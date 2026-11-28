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

import { Window } from 'happy-dom'
import { afterAll, afterEach, test } from 'vitest'

import type { TopupInfo } from '../../types'

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
const { RechargeFormCard } = await import('../recharge-form-card')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
})

let root: ReturnType<typeof createRoot> | undefined
const selected: number[] = []
const changed: number[] = []
let payments = 0
type RechargeHarnessProps = {
  rate?: number
  minimum?: number
  loading?: boolean
  cny?: boolean
  giftRanges?: TopupInfo['gift_ranges']
  giftPercentage?: TopupInfo['gift_percentage']
}

function RechargeHarness(props: RechargeHarnessProps = {}) {
  const [amount, setAmount] = React.useState(props.cny ? 2000 : 20)
  return (
    <RechargeFormCard
      loading={props.loading}
      topupInfo={{
        enable_online_topup: true,
        enable_stripe_topup: false,
        pay_methods: [{ name: 'Alipay', type: 'alipay' }],
        min_topup: props.minimum || 1,
        stripe_min_topup: 1,
        amount_options: [20, 100],
        discount: {},
        cny_topup: props.cny
          ? {
              payment_method: 'alipay',
              min_cents: 500,
              amount_options: [5, 20],
            }
          : undefined,
        amount_gifts: props.cny ? { 20: 1 } : undefined,
        gift_ranges: props.giftRanges,
        gift_percentage: props.giftPercentage,
      }}
      presetAmounts={
        props.cny
          ? [{ value: 500 }, { value: 2000 }]
          : [{ value: 20 }, { value: 100, discount: 0.9 }]
      }
      selectedPreset={null}
      onSelectPreset={(preset) => {
        selected.push(preset.value)
        setAmount(preset.value)
      }}
      topupAmount={amount}
      onTopupAmountChange={(value) => {
        changed.push(value)
        setAmount(value)
      }}
      calculating={false}
      onOnlinePay={() => {
        payments += 1
      }}
      onlinePaying={false}
      redemptionCode=''
      onRedemptionCodeChange={() => {}}
      onRedeem={() => {}}
      redeeming={false}
      rechargeDisplayRate={props.cny ? 0.01 : (props.rate ?? 7.3)}
    />
  )
}
async function mount(props: RechargeHarnessProps = {}) {
  const host = document.createElement('div')
  document.body.append(host)
  const mountedRoot = createRoot(host)
  root = mountedRoot
  await act(async () =>
    mountedRoot.render(
      <I18nextProvider i18n={i18n}>
        <RechargeHarness {...props} />
      </I18nextProvider>
    )
  )
}
function amountInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('#topup-amount')
  assert.ok(input)
  return input
}
async function enterAmount(value: string) {
  await act(async () => {
    const input = amountInput()
    const setter = Object.getOwnPropertyDescriptor(
      domWindow.HTMLInputElement.prototype,
      'value'
    )?.set
    assert.ok(setter)
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
function payButton(): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find(
    (item) => item.textContent === 'Pay Online'
  )
  assert.ok(button)
  return button
}
afterEach(async () => {
  if (root) await act(async () => root?.unmount())
  root = undefined
  document.body.innerHTML = ''
  selected.length = 0
  changed.length = 0
  payments = 0
})
afterAll(() => domWindow.close())

test('domestic recharge shows CNY presets, input and summary without HKD or USD', async () => {
  await mount()
  const text = document.body.textContent || ''
  assert.doesNotMatch(text, /HKD|USD|\$/)
  assert.equal(amountInput().value, '146')
  assert.equal(amountInput().min, '7.3')
  assert.match(text, /146\.00 CNY/)
  assert.doesNotMatch(text, /Subtotal|Tax|Estimated Payment/)
  const preset = [...document.querySelectorAll('button')].find((item) =>
    item.textContent?.includes('730')
  )
  assert.ok(preset)
  await act(async () => preset.click())
  assert.deepEqual(selected, [100])
  assert.equal(amountInput().value, '730')
})

test('exact CNY checkout shows the gift for ¥20 and no gift for ¥20.01', async () => {
  await mount({ cny: true })
  const summary = document.querySelector('[data-payment-summary]')

  assert.equal(amountInput().value, '20')
  assert.equal(amountInput().min, '5')
  assert.match(summary?.textContent ?? '', /20\.00 CNY/)
  assert.match(summary?.textContent ?? '', /wallet\.gift\.amount1\.00 CNY/)
  assert.match(
    document.querySelector('[data-preset-amounts]')?.textContent ?? '',
    /20wallet\.gift\.preset/
  )

  await enterAmount('20.01')
  assert.equal(changed.at(-1), 2001)
  assert.doesNotMatch(summary?.textContent ?? '', /wallet\.gift\.amount/)
  assert.equal(payButton().disabled, false)
})

test('CNY checkout shows the range gift at both inclusive bounds', async () => {
  await mount({ cny: true, giftRanges: [{ min: 20, max: 25.75, gift: 2.25 }] })
  const summary = document.querySelector('[data-payment-summary]')

  assert.match(summary?.textContent ?? '', /wallet\.gift\.amount2\.25 CNY/)
  assert.match(
    document.querySelector('[data-preset-amounts]')?.textContent ?? '',
    /20wallet\.gift\.preset/
  )

  await enterAmount('25.75')
  assert.match(summary?.textContent ?? '', /wallet\.gift\.amount2\.25 CNY/)

  await enterAmount('25.76')
  assert.doesNotMatch(summary?.textContent ?? '', /wallet\.gift\.amount/)

  await enterAmount('19.99')
  assert.doesNotMatch(summary?.textContent ?? '', /wallet\.gift\.amount/)
})

test('previews the gift at the threshold and rounds the gift and total above it', async () => {
  await mount({ cny: true, giftPercentage: { above: 1000, rate: 10 } })
  const summary = document.querySelector('[data-payment-summary]')

  assert.match(document.body.textContent ?? '', /wallet\.gift\.percentageRule/)
  await enterAmount('999.99')
  assert.doesNotMatch(summary?.textContent ?? '', /wallet\.gift\.amount/)
  await enterAmount('1000')
  assert.match(summary?.textContent ?? '', /wallet\.gift\.amount100\.00 CNY/)

  await enterAmount('1000.05')
  assert.equal(changed.at(-1), 100005)
  assert.match(summary?.textContent ?? '', /wallet\.gift\.amount100\.01 CNY/)
  assert.match(
    summary?.textContent ?? '',
    /wallet\.gift\.estimatedCredit1,100\.06 CNY/
  )
  assert.equal(payButton().disabled, false)
})

test('CNY entry converts back to the integer recharge quantity without truncating money', async () => {
  await mount()
  await enterAmount('73')
  assert.equal(amountInput().value, '73')
  assert.equal(changed.at(-1), 10)
  assert.equal(payButton().disabled, false)
  await act(async () => payButton().click())
  assert.equal(payments, 1)
  await enterAmount('74')
  assert.equal(amountInput().value, '74')
  assert.equal(amountInput().getAttribute('aria-invalid'), 'true')
  assert.equal(payButton().disabled, true)
  assert.equal(changed.at(-1), 0)
  await enterAmount('')
  assert.equal(amountInput().value, '')
  assert.equal(payButton().disabled, true)
})

test('CNY entry enforces the converted minimum and supports token-denominated recharge quantities', async () => {
  await mount({ rate: 7.3 / 500000, minimum: 500000 })
  await enterAmount('7.3')
  assert.equal(changed.at(-1), 500000)
  assert.equal(payButton().disabled, false)
  await enterAmount('1')
  assert.equal(payButton().disabled, true)
})

test('loading recharge summary reserves only the remaining amount card', async () => {
  await mount({ loading: true })
  const skeletons = document.querySelectorAll(
    '[data-payment-summary] [data-slot="skeleton"]'
  )
  assert.equal(skeletons.length, 1)
})

test('domestic recharge shows Alipay as the only supported payment channel', async () => {
  await mount()
  const channels = document.querySelectorAll('[data-supported-channels] li')
  assert.deepEqual(
    [...channels].map((item) => item.getAttribute('aria-label')),
    ['Alipay']
  )
})
