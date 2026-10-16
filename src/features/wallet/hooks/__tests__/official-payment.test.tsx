/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import assert from 'node:assert/strict'
import { after, afterEach, test } from 'node:test'

import { Window } from 'happy-dom'

const domWindow = new Window({ url: 'https://app.example.com/wallet' })
for (const [key, value] of Object.entries({
  window: domWindow,
  document: domWindow.document,
  navigator: domWindow.navigator,
  localStorage: domWindow.localStorage,
  HTMLElement: domWindow.HTMLElement,
  Node: domWindow.Node,
  Element: domWindow.Element,
  Event: domWindow.Event,
  MutationObserver: domWindow.MutationObserver,
})) {
  Object.defineProperty(globalThis, key, { configurable: true, value })
}

const React = await import('react')
const { act } = React
Object.defineProperty(globalThis, 'React', { configurable: true, value: React })
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true,
})
const { createRoot } = await import('react-dom/client')
const { api } = await import('@/lib/api')
const { usePayment } = await import('../use-payment')
const { useTopupInfo } = await import('../use-topup-info')
const { getMinTopupAmount, resolveDefaultPayment } =
  await import('../../lib/payment')
const { getPaymentMethodName } = await import('../../lib/billing')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const i18n = createInstance()
await i18n
  .use(initReactI18next)
  .init({ lng: 'en', resources: { en: { translation: {} } } })

const originalAdapter = api.defaults.adapter
const originalSubmit = domWindow.HTMLFormElement.prototype.submit
let root: ReturnType<typeof createRoot> | undefined
const requests: { url: string; body: unknown }[] = []
const submissions: {
  action: string
  acceptCharset: string
  params: Record<string, string>
}[] = []
function mount(element: React.ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  const mountedRoot = createRoot(host)
  root = mountedRoot
  return act(async () =>
    mountedRoot.render(<I18nextProvider i18n={i18n}>{element}</I18nextProvider>)
  )
}
function findButton(label: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find(
    (item) => item.textContent === label
  )
  assert.ok(button, `Missing ${label} button`)
  return button
}
function PaymentHarness(props: { type: string }) {
  const payment = usePayment()
  return (
    <>
      <button
        type='button'
        onClick={() => void payment.calculatePaymentAmount(20, props.type)}
      >
        Quote
      </button>
      <button
        type='button'
        onClick={() => void payment.processPayment(20.9, props.type)}
      >
        Pay
      </button>
      <output aria-label='Quoted payment amount'>
        {payment.amount.toFixed(2)} CNY
      </output>
    </>
  )
}
function InfoHarness() {
  const { topupInfo, loading } = useTopupInfo()
  if (loading || !topupInfo) return <span>Loading</span>
  return (
    <>
      <output aria-label='Payment method'>
        {resolveDefaultPayment(topupInfo)?.method.type}
      </output>
      <input
        aria-label='Minimum recharge'
        min={getMinTopupAmount(topupInfo)}
        defaultValue={getMinTopupAmount(topupInfo)}
      />
    </>
  )
}
afterEach(async () => {
  const mountedRoot = root
  if (mountedRoot) await act(async () => mountedRoot.unmount())
  root = undefined
  document.body.innerHTML = ''
  api.defaults.adapter = originalAdapter
  domWindow.HTMLFormElement.prototype.submit = originalSubmit
  requests.length = 0
  submissions.length = 0
})
after(() => domWindow.close())

for (const [type, amountEndpoint, payEndpoint, currency] of [
  ['alipay_official', '/api/user/alipay/amount', '/api/user/alipay/pay', 'CNY'],
  ['alipay', '/api/user/amount', '/api/user/pay', 'CNY'],
]) {
  test(`${type} quote and checkout use their own endpoints and signed form`, async () => {
    const action =
      type === 'alipay_official'
        ? 'https://openapi.alipay.com/gateway.do?charset=utf-8&sign_type=RSA2&sign=signed-by-server'
        : 'https://openapi.alipay.com/gateway.do'
    const params =
      type === 'alipay_official'
        ? {
            biz_content: '{"subject":"钱包充值 & + =","total_amount":"140.00"}',
          }
        : { sign: 'signed-by-server', biz_content: '{"total_amount":"140.00"}' }

    api.defaults.adapter = async (config) => {
      requests.push({ url: config.url || '', body: JSON.parse(config.data) })
      return {
        config,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: (config.url || '').endsWith('/amount')
          ? { success: true, data: '140.00' }
          : {
              message: 'success',
              url: action,
              data: params,
            },
      }
    }
    domWindow.HTMLFormElement.prototype.submit = function () {
      submissions.push({
        action: this.action,
        acceptCharset: this.acceptCharset,
        params: Object.fromEntries(
          [...this.querySelectorAll('input')].map((input) => [
            input.name,
            input.value,
          ])
        ),
      })
    }
    await mount(<PaymentHarness type={type} />)
    await act(async () => findButton('Quote').click())
    assert.match(
      document.body.textContent || '',
      new RegExp(`140\\.00 ${currency}`)
    )
    await act(async () => findButton('Pay').click())
    assert.deepEqual(requests, [
      { url: amountEndpoint, body: { amount: 20 } },
      { url: payEndpoint, body: { amount: 20, payment_method: type } },
    ])
    assert.deepEqual(submissions, [
      {
        action,
        acceptCharset: 'UTF-8',
        params,
      },
    ])
  })
}

for (const methodMinimum of [20, undefined]) {
  test(`official default uses its independent minimum with ${methodMinimum ? 'an explicit gateway minimum' : 'the config fallback'}`, async () => {
    api.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        success: true,
        data: {
          enable_online_topup: true,
          enable_stripe_topup: false,
          enable_alipay_official_topup: true,
          alipay_official_min_topup: 20,
          min_topup: 1,
          stripe_min_topup: 1,
          pay_methods: [
            {
              name: 'Alipay Official',
              type: 'alipay_official',
              min_topup: methodMinimum,
            },
            { name: 'Alipay', type: 'alipay', min_topup: 1 },
          ],
          amount_options: [],
          discount: {},
        },
      },
    })
    await mount(<InfoHarness />)
    assert.equal(
      document.querySelector('output')?.textContent,
      'alipay_official'
    )
    assert.equal(document.querySelector('input')?.min, '20')
    assert.equal(document.querySelector('input')?.value, '20')
  })
}

test('billing history distinguishes official Alipay from Epay Alipay', () => {
  assert.equal(getPaymentMethodName('alipay_official'), 'Alipay Official')
  assert.equal(getPaymentMethodName('alipay'), 'Alipay')
})

test('a failed official checkout never submits a form or falls back to Epay', async () => {
  api.defaults.adapter = async (config) => {
    requests.push({ url: config.url || '', body: JSON.parse(config.data) })
    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { success: false, message: 'Alipay is unavailable' },
    }
  }
  domWindow.HTMLFormElement.prototype.submit = function () {
    submissions.push({
      action: this.action,
      acceptCharset: this.acceptCharset,
      params: {},
    })
  }
  await mount(<PaymentHarness type='alipay_official' />)
  await act(async () => findButton('Pay').click())
  assert.deepEqual(requests, [
    {
      url: '/api/user/alipay/pay',
      body: { amount: 20, payment_method: 'alipay_official' },
    },
  ])
  assert.deepEqual(submissions, [])
})
