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
const { ApplyPartnerDialog } = await import('../index')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
})

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

describe('promotion partner application form', () => {
  after(() => {
    domWindow.close()
  })

  test('asks for a frequently checked email and explains manual review without showing commission settings', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const queryClient = new QueryClient()

    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <ApplyPartnerDialog
              open
              onOpenChange={() => {}}
              onApplied={() => {}}
              defaultEmail='owner@example.com'
            />
          </I18nextProvider>
        </QueryClientProvider>
      )
    )

    const email = document.body.querySelector<HTMLInputElement>(
      'input[type="email"]'
    )
    assert.ok(email)
    assert.equal(email.required, true)
    assert.equal(email.value, 'owner@example.com')
    assert.equal(email.getAttribute('autocomplete'), 'email')
    assert.match(
      document.body.textContent,
      /Enter an email address you check regularly\./
    )
    assert.match(
      document.body.textContent,
      /All applications are reviewed manually\./
    )
    assert.doesNotMatch(
      document.body.textContent,
      /Consumption commission settings/
    )
    assert.equal(
      document.body.querySelector<HTMLButtonElement>(
        '[data-submit-application]'
      )?.disabled,
      false
    )

    await act(async () => root.unmount())
    container.remove()
  })

  test('labels reactivation clearly and prefills the existing application data', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const queryClient = new QueryClient()

    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <ApplyPartnerDialog
              open
              mode='reactivate'
              onOpenChange={() => {}}
              onApplied={() => {}}
              defaultEmail='partner@example.com'
              defaultReason='publish tutorials'
            />
          </I18nextProvider>
        </QueryClientProvider>
      )
    )

    assert.match(document.body.textContent, /Request partner reactivation/)
    assert.match(
      document.body.textContent,
      /Your existing partner application will be reused\./
    )
    assert.equal(
      document.body.querySelector<HTMLInputElement>('input[type="email"]')
        ?.value,
      'partner@example.com'
    )
    assert.equal(
      document.body.querySelector<HTMLTextAreaElement>('textarea')?.value,
      'publish tutorials'
    )
    assert.match(
      document.body.querySelector<HTMLButtonElement>(
        '[data-submit-application]'
      )?.textContent ?? '',
      /Submit reactivation request/
    )

    await act(async () => root.unmount())
    container.remove()
  })
})
