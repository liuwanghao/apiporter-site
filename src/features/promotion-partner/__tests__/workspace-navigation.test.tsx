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

const domWindow = new Window({ width: 1440, height: 900 })
for (const [key, value] of Object.entries({
  window: domWindow,
  document: domWindow.document,
  navigator: domWindow.navigator,
  HTMLElement: domWindow.HTMLElement,
  HTMLButtonElement: domWindow.HTMLButtonElement,
  SVGElement: domWindow.SVGElement,
  Node: domWindow.Node,
  Element: domWindow.Element,
  Event: domWindow.Event,
  MutationObserver: domWindow.MutationObserver,
  ResizeObserver: domWindow.ResizeObserver,
})) {
  Object.defineProperty(globalThis, key, { configurable: true, value })
}

const React = await import('react')
const { act } = React
Object.defineProperty(globalThis, 'React', { configurable: true, value: React })
const { createRoot } = await import('react-dom/client')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { Tabs } = await import('@/components/ui/tabs')
const { PartnerWorkspaceNavigation } =
  await import('../partner-workspace-navigation')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
})

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true,
})

describe('promotion partner workspace navigation', () => {
  after(() => domWindow.close())

  test('uses a neutral horizontal workbench for partner data sections', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <Tabs defaultValue='invitees'>
            <PartnerWorkspaceNavigation />
          </Tabs>
        </I18nextProvider>
      )
    })

    const navigation = container.querySelector(
      '[data-partner-workspace-navigation]'
    )
    const tabsList = navigation?.querySelector('[data-slot="tabs-list"]')
    const triggers = navigation?.querySelectorAll('[data-slot="tabs-trigger"]')

    assert.ok(navigation)
    assert.equal(navigation.classList.contains('lg:flex-row'), false)
    assert.equal(tabsList?.classList.contains('grid-cols-3'), true)
    assert.equal(tabsList?.classList.contains('overflow-x-auto'), false)
    assert.equal(triggers?.length, 3)
    assert.equal(
      [...(triggers ?? [])].every(
        (trigger) =>
          trigger.classList.contains('min-h-11') &&
          !trigger.classList.contains('text-primary')
      ),
      true
    )

    await act(async () => root.unmount())
    container.remove()
  })
})
