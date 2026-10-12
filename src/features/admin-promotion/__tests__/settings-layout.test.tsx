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
import { after, describe, test } from 'node:test'

import { Window } from 'happy-dom'

const domWindow = new Window()
const domGlobals = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'HTMLButtonElement',
  'HTMLInputElement',
  'SVGElement',
  'Node',
  'Element',
  'Event',
  'CustomEvent',
  'MutationObserver',
  'ResizeObserver',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'getComputedStyle',
] as const

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
const { ReviewDialog, SettingsPanel } = await import('../index')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
})

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

describe('admin settlement settings layout', () => {
  after(() => {
    domWindow.close()
  })

  test('renders settings and paginated history as separate stacked modules and disables unchanged saves', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    })
    const settings = {
      id: 1,
      version: 2,
      currency: 'USD',
      timezone: 'Asia/Shanghai',
      settlement_cycle: 'MONTHLY',
      commission_rate_bps: 1_000,
      confirmation_days: 7,
      minimum_settlement_amount: 5_000,
      created_at: 1_700_000_000,
      updated_at: 1_700_000_100,
    }
    queryClient.setQueryData(['admin-promotion', 'settings'], {
      success: true,
      data: settings,
    })
    queryClient.setQueryData(['admin-promotion', 'setting-versions', 1], {
      success: true,
      data: {
        items: [
          {
            ...settings,
            setting_id: 1,
            effective_at: 1_700_000_100,
            created_by: 9,
            created_by_username: 'admin',
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
      },
    })

    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <SettingsPanel />
          </I18nextProvider>
        </QueryClientProvider>
      )
    )

    const settingsCard = container.querySelector(
      '[data-settlement-settings-card]'
    )
    const historyCard = container.querySelector('[data-settings-history-card]')
    assert.ok(settingsCard)
    assert.ok(historyCard)
    assert.equal(settingsCard.parentElement, historyCard.parentElement)
    assert.equal(settingsCard.nextElementSibling, historyCard)
    assert.equal(
      settingsCard.querySelector<HTMLButtonElement>('[data-save-settings]')
        ?.disabled,
      true
    )
    assert.equal(
      settingsCard
        .querySelector('[data-settings-fields]')
        ?.classList.contains('lg:grid-cols-3'),
      true
    )
    assert.ok(historyCard.querySelector('[data-settings-history-pager]'))

    await act(async () => root.unmount())
    container.remove()
  })

  test('uses an aligned three-column comparison table in the confirmation dialog', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    })
    queryClient.setQueryData(['admin-promotion', 'settings'], {
      success: true,
      data: {
        id: 1,
        version: 2,
        currency: 'USD',
        timezone: 'Asia/Shanghai',
        settlement_cycle: 'MONTHLY',
        commission_rate_bps: 1_000,
        confirmation_days: 7,
        minimum_settlement_amount: 5_000,
        created_at: 1_700_000_000,
        updated_at: 1_700_000_100,
      },
    })
    queryClient.setQueryData(['admin-promotion', 'setting-versions', 1], {
      success: true,
      data: { items: [], total: 0, page: 1, page_size: 10 },
    })

    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <SettingsPanel />
          </I18nextProvider>
        </QueryClientProvider>
      )
    )

    const minimumInput = container.querySelector<HTMLInputElement>(
      '#minimum-settlement'
    )
    assert.ok(minimumInput)
    await act(async () => {
      minimumInput.value = '60'
      minimumInput.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const saveButton = container.querySelector<HTMLButtonElement>(
      '[data-save-settings]'
    )
    assert.ok(saveButton)
    assert.equal(saveButton.disabled, false)
    await act(async () => saveButton.click())

    const dialog = document.body.querySelector(
      '[data-slot="alert-dialog-content"]'
    )
    assert.ok(dialog)
    assert.equal(
      dialog.classList.contains('data-[size=default]:sm:max-w-[600px]'),
      true
    )
    assert.equal(dialog.classList.contains('p-6'), true)
    const comparisonTable = dialog.querySelector(
      '[data-settings-comparison-table]'
    )
    assert.ok(comparisonTable)
    assert.equal(
      comparisonTable.parentElement?.classList.contains('overflow-x-auto'),
      false
    )
    assert.equal(comparisonTable.classList.contains('min-w-[32rem]'), false)
    assert.deepEqual(
      Array.from(comparisonTable.querySelectorAll('thead th'), (header) =>
        header.textContent?.trim()
      ),
      ['Setting item', 'Before change', 'After change']
    )
    assert.equal(comparisonTable.querySelectorAll('tbody tr').length, 3)
    const comparisons = dialog.querySelectorAll('[data-settings-comparison]')
    assert.equal(comparisons.length, 3)
    for (const comparison of comparisons) {
      assert.equal(comparison.classList.contains('whitespace-nowrap'), true)
    }

    await act(async () => root.unmount())
    container.remove()
  })

  test('shows contact email and application note while reviewing a partner application', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () =>
      root.render(
        <I18nextProvider i18n={i18n}>
          <ReviewDialog
            open
            onOpenChange={() => {}}
            title='Review partner application'
            application={{
              contact_email: 'partner@example.com',
              apply_reason: 'I publish API integration tutorials.',
            }}
            onSubmit={() => {}}
          />
        </I18nextProvider>
      )
    )

    const details = document.body.querySelector('[data-application-details]')
    assert.ok(details)
    assert.match(details.textContent, /partner@example\.com/)
    assert.match(details.textContent, /I publish API integration tutorials\./)

    await act(async () => root.unmount())
    container.remove()
  })

  test('shows the translated settlement payment method in the select trigger', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () =>
      root.render(
        <I18nextProvider i18n={i18n}>
          <ReviewDialog
            open
            onOpenChange={() => {}}
            title='Review settlement'
            onSubmit={() => {}}
          />
        </I18nextProvider>
      )
    )

    const trigger = container.querySelector('#settlement-payment-method')
    assert.ok(trigger)
    assert.match(trigger.textContent ?? '', /Transfer to wallet/)

    await act(async () => root.unmount())
    container.remove()
  })
})
