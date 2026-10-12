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
const { LanguagePreferencesCard } = await import('../language-preferences-card')

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true,
})

const profile = {
  id: 1,
  username: 'demo',
  display_name: 'Demo User',
  role: 1,
  group: 'default',
  quota: 0,
  used_quota: 0,
  request_count: 0,
  status: 1,
  aff_count: 0,
  aff_quota: 0,
  aff_history_quota: 0,
  created_time: 1_700_000_000,
  setting: '{"language":"ru"}',
}

describe('profile interface language selection', () => {
  after(async () => domWindow.happyDOM.close())

  test('shows the active Chinese interface language instead of the saved account language', async () => {
    const i18n = createInstance()
    await i18n.use(initReactI18next).init({
      lng: 'zhCN',
      resources: {
        zhCN: { translation: { 'Interface Language': '界面语言' } },
        ru: { translation: { 'Interface Language': 'Язык интерфейса' } },
      },
    })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        root.render(
          <I18nextProvider i18n={i18n}>
            <LanguagePreferencesCard
              profile={profile}
              onProfileUpdate={() => {}}
            />
          </I18nextProvider>
        )
      })

      const selector = container.querySelector('[role="combobox"]')
      assert.ok(selector)
      assert.equal(selector.textContent?.trim(), '简体中文')
      assert.equal(i18n.resolvedLanguage, 'zhCN')
    } finally {
      await act(async () => root.unmount())
      container.remove()
    }
  })

  test('follows interface language changes while the saved account language stays unchanged', async () => {
    const i18n = createInstance()
    await i18n.use(initReactI18next).init({
      lng: 'zhCN',
      resources: {
        zhCN: { translation: { 'Interface Language': '界面语言' } },
        en: { translation: { 'Interface Language': 'Interface Language' } },
        ru: { translation: { 'Interface Language': 'Язык интерфейса' } },
      },
    })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        root.render(
          <I18nextProvider i18n={i18n}>
            <LanguagePreferencesCard
              profile={profile}
              onProfileUpdate={() => {}}
            />
          </I18nextProvider>
        )
      })

      await act(async () => {
        await i18n.changeLanguage('en')
      })

      const selector = container.querySelector('[role="combobox"]')
      assert.ok(selector)
      assert.equal(selector.textContent?.trim(), 'English')
      assert.equal(profile.setting, '{"language":"ru"}')
    } finally {
      await act(async () => root.unmount())
      container.remove()
    }
  })
})
