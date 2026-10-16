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
  HTMLInputElement: domWindow.HTMLInputElement,
  HTMLButtonElement: domWindow.HTMLButtonElement,
  Node: domWindow.Node,
  Element: domWindow.Element,
  Event: domWindow.Event,
  MouseEvent: domWindow.MouseEvent,
  MutationObserver: domWindow.MutationObserver,
  Image: domWindow.Image,
  getComputedStyle: domWindow.getComputedStyle.bind(domWindow),
  requestAnimationFrame: domWindow.requestAnimationFrame.bind(domWindow),
  cancelAnimationFrame: domWindow.cancelAnimationFrame.bind(domWindow),
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
const { SubscriptionPurchaseDialog } =
  await import('../subscription-purchase-dialog')
const { SubscriptionPlansCard } =
  await import('@/features/wallet/components/subscription-plans-card')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { subscriptionPlanSchema } = await import('../../../types')
const i18n = createInstance()
await i18n
  .use(initReactI18next)
  .init({ lng: 'en', resources: { en: { translation: {} } } })
const plan = {
  plan: subscriptionPlanSchema.parse({
    id: 11,
    title: 'Monthly',
    price_amount: 20,
    currency: 'USD',
    duration_unit: 'month',
    duration_value: 1,
    quota_reset_period: 'never',
    enabled: true,
    sort_order: 0,
    max_purchase_per_user: 0,
    total_amount: 100,
    allow_balance_pay: false,
  }),
}
const originalAdapter = api.defaults.adapter
const originalSubmit = domWindow.HTMLFormElement.prototype.submit
let root: ReturnType<typeof createRoot> | undefined

afterEach(async () => {
  const mountedRoot = root
  if (mountedRoot) await act(async () => mountedRoot.unmount())
  root = undefined
  document.body.innerHTML = ''
  api.defaults.adapter = originalAdapter
  domWindow.HTMLFormElement.prototype.submit = originalSubmit
})
after(() => domWindow.close())

for (const [type, name, endpoint] of [
  ['alipay_official', 'Alipay Official', '/api/subscription/alipay/pay'],
  ['alipay', 'Alipay', '/api/subscription/epay/pay'],
]) {
  test(`buying a subscription with ${type} posts the chosen provider and server signature`, async () => {
    const requests: { url: string; body: unknown }[] = []
    const submitted: Record<string, string>[] = []
    const openChanges: boolean[] = []
    api.defaults.adapter = async (config) => {
      requests.push({ url: config.url || '', body: JSON.parse(config.data) })
      return {
        config,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {
          message: 'success',
          url: 'https://openapi.alipay.com/gateway.do',
          data: {
            sign: 'signed-subscription',
            biz_content: '{"total_amount":"140.00"}',
          },
        },
      }
    }
    domWindow.HTMLFormElement.prototype.submit = function () {
      assert.equal(this.action, 'https://openapi.alipay.com/gateway.do')
      submitted.push(
        Object.fromEntries(
          [...this.querySelectorAll('input')].map((input) => [
            input.name,
            input.value,
          ])
        )
      )
    }
    const host = document.createElement('div')
    document.body.append(host)
    const mountedRoot = createRoot(host)
    root = mountedRoot
    await act(async () =>
      mountedRoot.render(
        <I18nextProvider i18n={i18n}>
          <SubscriptionPurchaseDialog
            open
            onOpenChange={(open) => openChanges.push(open)}
            plan={plan}
            enableOnlineTopUp
            epayMethods={[{ type, name }]}
          />
        </I18nextProvider>
      )
    )
    assert.ok(
      document.querySelector('[role="combobox"]')?.textContent?.includes(name)
    )
    if (type === 'alipay_official') {
      assert.ok(document.body.textContent?.includes('$20.00 USD'))
      assert.ok(
        document.body.textContent?.includes('CNY · Subject to payment page')
      )
    }
    const pay = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === 'Pay'
    )
    assert.ok(pay)
    assert.equal(pay.disabled, false)
    await act(async () => pay.click())
    assert.deepEqual(requests, [
      { url: endpoint, body: { plan_id: 11, payment_method: type } },
    ])
    assert.deepEqual(submitted, [
      { sign: 'signed-subscription', biz_content: '{"total_amount":"140.00"}' },
    ])
    assert.deepEqual(openChanges, [false])
  })
}

test('wallet subscription plans offer official Alipay when it is the only online gateway', async () => {
  const requests: string[] = []
  api.defaults.adapter = async (config) => {
    requests.push(config.url || '')
    let data: unknown
    if (config.url === '/api/subscription/plans') {
      data = { success: true, data: [plan] }
    } else if (config.url === '/api/subscription/self') {
      data = {
        success: true,
        data: { subscriptions: [], all_subscriptions: [] },
      }
    } else {
      data = {
        message: 'success',
        url: 'https://openapi.alipay.com/gateway.do',
        data: { sign: 'signed' },
      }
    }
    return { config, status: 200, statusText: 'OK', headers: {}, data }
  }
  domWindow.HTMLFormElement.prototype.submit = function () {}
  const host = document.createElement('div')
  document.body.append(host)
  const mountedRoot = createRoot(host)
  root = mountedRoot
  await act(async () =>
    mountedRoot.render(
      <I18nextProvider i18n={i18n}>
        <SubscriptionPlansCard
          topupInfo={{
            enable_online_topup: true,
            enable_alipay_official_topup: true,
            enable_stripe_topup: false,
            pay_methods: [
              {
                type: 'alipay_official',
                name: 'Alipay Official',
                min_topup: 20,
              },
            ],
            min_topup: 20,
            alipay_official_min_topup: 20,
            stripe_min_topup: 1,
            amount_options: [],
            discount: {},
          }}
        />
      </I18nextProvider>
    )
  )
  const subscribe = [...document.querySelectorAll('button')].find(
    (button) => button.textContent === 'Subscribe Now'
  )
  assert.ok(subscribe)
  await act(async () => subscribe.click())
  assert.ok(
    document
      .querySelector('[role="dialog"]')
      ?.textContent?.includes('Alipay Official')
  )
  const pay = [...document.querySelectorAll('button')].find(
    (button) => button.textContent === 'Pay'
  )
  assert.ok(pay)
  await act(async () => pay.click())
  assert.equal(
    requests.filter((url) => url.endsWith('/pay')).join(),
    '/api/subscription/alipay/pay'
  )
})
