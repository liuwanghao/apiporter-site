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
import { after, afterEach, describe, test } from 'node:test'

import type { AxiosAdapter } from 'axios'
import { Window } from 'happy-dom'

const domWindow = new Window({ url: 'http://localhost:5180' })
const domGlobals = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'SVGElement',
  'Node',
  'Element',
  'Event',
  'CustomEvent',
  'MutationObserver',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'getComputedStyle',
] as const
const originalGlobals = new Map(
  domGlobals.map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ])
)
for (const key of domGlobals) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: domWindow[key],
  })
}

const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { QueryClient, QueryClientProvider } =
  await import('@tanstack/react-query')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { api } = await import('@/lib/api')
const { SettingsPageProvider } =
  await import('../../components/settings-page-context')
const { AlipayOfficialSettingsSection } =
  await import('../alipay-official-settings-section')
const { DEFAULT_ALIPAY_OFFICIAL_VALUES } =
  await import('../alipay-official-config')
const { default: en } = await import('@/i18n/locales/en.json')

const i18n = createInstance()
await i18n.use(initReactI18next).init({ lng: 'en', resources: { en } })
const testGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
const originalActEnvironment = testGlobals.IS_REACT_ACT_ENVIRONMENT
testGlobals.IS_REACT_ACT_ENVIRONMENT = true
const originalAdapter = api.defaults.adapter
const cleanups: Array<() => Promise<void>> = []

async function renderSettings(
  complianceConfirmed = true,
  privateKeyConfigured = true
) {
  const container = document.createElement('div')
  const actions = document.createElement('div')
  document.body.append(container, actions)
  const root = createRoot(container)
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  })
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <SettingsPageProvider actionsContainer={actions}>
            <AlipayOfficialSettingsSection
              defaultValues={{
                ...DEFAULT_ALIPAY_OFFICIAL_VALUES,
                enabled: privateKeyConfigured,
                app_id: '2026101600000001',
                seller_id: '2088000000000001',
                public_key: 'saved-public-key',
                callback_url: 'https://pay.example.com',
              }}
              serverAddress='https://api.example.com/'
              privateKeyConfigured={privateKeyConfigured}
              complianceConfirmed={complianceConfirmed}
            />
          </SettingsPageProvider>
        </I18nextProvider>
      </QueryClientProvider>
    )
  })
  cleanups.push(async () => {
    await act(async () => root.unmount())
    container.remove()
    actions.remove()
    client.clear()
  })
  const input = (label: string) => {
    const node = [...container.querySelectorAll('label')].find(
      (item) => item.textContent === label
    )
    assert.ok(node, label)
    const field = document.querySelector(`[id="${node.htmlFor}"]`)
    assert.ok(field, label)
    return field as HTMLInputElement
  }
  const save = actions.querySelector<HTMLButtonElement>('button:last-child')
  assert.ok(save)
  return { container, actions, input, save }
}

function setInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    domWindow.HTMLInputElement.prototype,
    'value'
  )?.set
  assert.ok(setter)
  setter.call(input, value)
  input.dispatchEvent(
    new domWindow.Event('input', { bubbles: true }) as unknown as Event
  )
}

describe('official Alipay configuration form', () => {
  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) await cleanup()
    api.defaults.adapter = originalAdapter
  })
  after(() => {
    testGlobals.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment
    for (const key of domGlobals) {
      const original = originalGlobals.get(key)
      if (original) Object.defineProperty(globalThis, key, original)
      else Reflect.deleteProperty(globalThis, key)
    }
    domWindow.close()
  })

  test('shows generated callback URLs and an empty private key with stored-key status', async () => {
    const { container, input, save } = await renderSettings()
    assert.equal(input('Application private key').value, '')
    assert.match(container.textContent ?? '', /A private key is saved/)
    const callbacks = [...container.querySelectorAll('code')].map(
      (node) => node.textContent
    )
    assert.deepEqual(callbacks, [
      'https://pay.example.com/api/user/alipay/notify',
      'https://pay.example.com/api/subscription/alipay/notify',
    ])
    assert.equal(save.disabled, true)
  })

  test('hides the merchant field and gives the application ID the full row', async () => {
    const { container, input } = await renderSettings()
    assert.equal(container.querySelector('[name="seller_id"]'), null)
    assert.doesNotMatch(
      container.textContent ?? '',
      /Merchant account ID|payment notification must match/
    )
    assert.equal(
      input('Application ID (App ID)')
        .closest('[data-slot="form-item"]')
        ?.getAttribute('data-settings-form-span'),
      'full'
    )
  })

  test('aligns price and minimum controls at the top despite the price description', async () => {
    const { input } = await renderSettings()
    for (const label of [
      'Price per USD of balance (CNY)',
      'Minimum wallet top-up (USD)',
    ]) {
      const item = input(label).closest('[data-slot="form-item"]')
      assert.ok(item?.classList.contains('self-start'))
    }
  })

  test('preserves the stored merchant ID when saving a blank callback and previews the server address', async () => {
    let requestBody: Record<string, unknown> | undefined
    api.defaults.adapter = (async (config) => {
      requestBody = JSON.parse(config.data as string) as Record<string, unknown>
      return {
        config,
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
      }
    }) satisfies AxiosAdapter
    const { container, input, save } = await renderSettings()
    await act(async () => {
      setInput(input('Public callback origin'), '')
    })
    assert.deepEqual(
      [...container.querySelectorAll('code')].map((node) => node.textContent),
      [
        'https://api.example.com/api/user/alipay/notify',
        'https://api.example.com/api/subscription/alipay/notify',
      ]
    )
    await act(async () => save.click())
    assert.equal(requestBody?.seller_id, '2088000000000001')
    assert.equal(requestBody?.callback_url, '')
    assert.equal(save.disabled, true)
  })

  test('keeps payment enablement disabled before compliance confirmation while allowing sandbox draft settings', async () => {
    const { input } = await renderSettings(false, false)
    const enabled = input('Enable official Alipay payments')
    const sandbox = input('Sandbox mode')
    assert.equal(enabled.disabled, true)
    assert.equal(enabled.checked, false)
    assert.equal(sandbox.disabled, false)
    await act(async () => sandbox.click())
    assert.equal(sandbox.checked, true)
  })

  test('blocks a callback with a path and marks the field invalid without sending settings', async () => {
    let requests = 0
    api.defaults.adapter = (async () => {
      requests++
      throw new Error('Unexpected network request')
    }) satisfies AxiosAdapter
    const { input, save } = await renderSettings()
    const origin = input('Public callback origin')
    await act(async () => setInput(origin, 'https://pay.example.com/notify'))
    await act(async () => save.click())
    assert.equal(origin.getAttribute('aria-invalid'), 'true')
    assert.equal(requests, 0)
  })

  test('saves related settings atomically, keeps a blank private key and disables editing while saving', async () => {
    let resolveRequest: (() => void) | undefined
    let startRequest: (() => void) | undefined
    let requestBody: Record<string, unknown> | undefined
    const started = new Promise<void>((resolve) => {
      startRequest = resolve
    })
    const pending = new Promise<void>((resolve) => {
      resolveRequest = resolve
    })
    api.defaults.adapter = (async (config) => {
      assert.equal(config.method, 'put')
      assert.equal(config.url, '/api/option/alipay_official')
      requestBody = JSON.parse(config.data as string) as Record<string, unknown>
      startRequest?.()
      await pending
      return {
        config,
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
      }
    }) satisfies AxiosAdapter
    const { input, save } = await renderSettings()
    const price = input('Price per USD of balance (CNY)')
    await act(async () => setInput(price, '7.6'))
    await act(async () => {
      save.click()
      await started
    })
    assert.equal(price.disabled, true)
    assert.equal(save.disabled, true)
    assert.equal(requestBody?.private_key, '')
    assert.equal(requestBody?.price, 7.6)
    assert.equal(
      Object.hasOwn(requestBody ?? {}, 'private_key_configured'),
      false
    )
    await act(async () => resolveRequest?.())
    assert.equal(price.disabled, false)
    assert.equal(save.disabled, true)
    assert.equal(input('Application private key').value, '')
  })

  test('preserves an unsaved draft and shows the server rejection after a failed save', async () => {
    api.defaults.adapter = (async (config) => ({
      config,
      data: { success: false, message: 'Invalid Alipay public key' },
      status: 200,
      statusText: 'OK',
      headers: {},
    })) satisfies AxiosAdapter
    const { container, input, save } = await renderSettings()
    const price = input('Price per USD of balance (CNY)')
    await act(async () => setInput(price, '8'))
    await act(async () => save.click())
    assert.equal(price.value, '8')
    assert.match(container.textContent ?? '', /Invalid Alipay public key/)
    assert.equal(save.disabled, false)
  })
})
