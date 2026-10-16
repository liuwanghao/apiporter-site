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
function RechargeHarness(props: { rate?: number; minimum?: number } = {}) {
  const [amount, setAmount] = React.useState(20)
  return (
    <RechargeFormCard
      topupInfo={{
        enable_online_topup: true,
        enable_stripe_topup: false,
        pay_methods: [{ name: 'Alipay', type: 'alipay' }],
        min_topup: props.minimum || 1,
        stripe_min_topup: 1,
        amount_options: [20, 100],
        discount: {},
      }}
      presetAmounts={[{ value: 20 }, { value: 100, discount: 0.9 }]}
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
      paymentAmount={131.4}
      calculating={false}
      onOnlinePay={() => {
        payments += 1
      }}
      onlinePaying={false}
      redemptionCode=''
      onRedemptionCodeChange={() => {}}
      onRedeem={() => {}}
      redeeming={false}
      rechargeDisplayRate={props.rate ?? 7.3}
    />
  )
}
async function mount(props: { rate?: number; minimum?: number } = {}) {
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
after(() => domWindow.close())

test('domestic recharge shows CNY presets, input and summary without HKD or USD', async () => {
  await mount()
  const text = document.body.textContent || ''
  assert.doesNotMatch(text, /HKD|USD|\$/)
  assert.equal(amountInput().value, '146')
  assert.equal(amountInput().min, '7.3')
  assert.match(text, /131\.40 CNY/)
  const preset = [...document.querySelectorAll('button')].find((item) =>
    item.textContent?.includes('730')
  )
  assert.ok(preset)
  await act(async () => preset.click())
  assert.deepEqual(selected, [100])
  assert.equal(amountInput().value, '730')
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
