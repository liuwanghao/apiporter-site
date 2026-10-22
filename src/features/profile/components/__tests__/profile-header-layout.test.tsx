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
import { afterAll as after, describe, test } from 'vitest'

const domWindow = new Window({ width: 1440, height: 900 })
for (const [key, value] of Object.entries({
  window: domWindow,
  document: domWindow.document,
  navigator: domWindow.navigator,
  HTMLElement: domWindow.HTMLElement,
  SVGElement: domWindow.SVGElement,
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
const { createRoot } = await import('react-dom/client')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { ProfileHeader } = await import('../profile-header')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
})

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true,
})

describe('profile header layout', () => {
  after(() => domWindow.close())

  test('places identity and account metrics in one responsive bento header', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <ProfileHeader
            loading={false}
            profile={{
              id: 1,
              username: 'demo',
              display_name: 'Demo User',
              role: 1,
              email: 'demo@example.com',
              group: 'default',
              quota: 120_000,
              used_quota: 45_000,
              request_count: 82,
              status: 1,
              aff_count: 0,
              aff_quota: 0,
              aff_history_quota: 0,
              created_time: 1_700_000_000,
            }}
          />
        </I18nextProvider>
      )
    })

    const layout = container.querySelector('[data-profile-summary-layout]')
    const identity = container.querySelector('[data-profile-identity]')
    const stats = container.querySelector('[data-profile-stats]')

    assert.ok(layout)
    assert.equal(
      layout.classList.contains(
        'lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.6fr)]'
      ),
      true
    )
    assert.ok(identity)
    assert.equal(identity.classList.contains('bg-muted/35'), true)
    assert.ok(stats)
    assert.equal(stats.classList.contains('sm:grid-cols-3'), true)
    assert.equal(stats.children.length, 3)

    await act(async () => root.unmount())
    container.remove()
  })
})
