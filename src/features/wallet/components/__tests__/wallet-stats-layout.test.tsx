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
const { WalletStatsCard } = await import('../wallet-stats-card')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
})

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true,
})

describe('wallet stats layout', () => {
  after(() => domWindow.close())

  test('renders three equal wallet metrics on white card surfaces', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <WalletStatsCard
            user={{
              id: 1,
              username: 'demo',
              quota: 120_000,
              used_quota: 45_000,
              request_count: 82,
              aff_quota: 0,
              aff_history_quota: 0,
              aff_count: 0,
              group: 'default',
            }}
          />
        </I18nextProvider>
      )
    })

    const layout = container.querySelector('[data-wallet-stats-layout]')
    const stats = container.querySelectorAll('[data-wallet-stat]')

    assert.ok(layout)
    assert.equal(layout.classList.contains('sm:grid-cols-3'), true)
    assert.equal(layout.children.length, 3)
    assert.equal(stats.length, 3)
    assert.equal(
      [...stats].every(
        (stat) =>
          stat.classList.contains('bg-card') &&
          stat.classList.contains('rounded-xl') &&
          !stat.classList.contains('bg-muted/40')
      ),
      true
    )

    await act(async () => root.unmount())
    container.remove()
  })
})
