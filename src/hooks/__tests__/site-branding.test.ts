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
import { afterAll, test } from 'vitest'
import { createJSONStorage } from 'zustand/middleware'

const browser = new Window()
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
Object.defineProperty(globalThis, 'window', {
  value: browser,
  configurable: true,
})
const originalLocalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage'
)
Object.defineProperty(globalThis, 'localStorage', {
  value: browser.localStorage,
  configurable: true,
})
const { mapStatusDataToConfig } = await import('../use-system-config')
const { useSystemConfigStore } =
  await import('../../stores/system-config-store')
afterAll(async () => {
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow)
  } else {
    Reflect.deleteProperty(globalThis, 'window')
  }
  if (originalLocalStorage) {
    Object.defineProperty(globalThis, 'localStorage', originalLocalStorage)
  } else {
    Reflect.deleteProperty(globalThis, 'localStorage')
  }
  await browser.happyDOM.close()
})

test('legacy backend branding uses ApiPorter while preserving currency settings', () => {
  const config = mapStatusDataToConfig({
    system_name: 'CBAPI',
    logo: 'https://legacy.example.com/old-logo.png',
    quota_display_type: 'CNY',
    usd_exchange_rate: 7,
    footer_html: '<footer>custom footer</footer>',
  })

  assert.equal(config.systemName, 'ApiPorter')
  assert.equal(config.logo, '/brand/apiporter-logo.png')
  assert.equal(config.currency?.quotaDisplayType, 'CNY')
  assert.equal(config.currency?.usdExchangeRate, 7)
  assert.equal(config.footerHtml, '<footer>custom footer</footer>')
})

test('old browser cache cannot restore the previous brand or logo', async () => {
  const originalState = useSystemConfigStore.getState()
  const originalStorage = useSystemConfigStore.persist.getOptions().storage
  const cached = JSON.stringify({
    state: {
      config: {
        ...originalState.config,
        systemName: 'CBAPI',
        logo: '/cloudbridge-favicon.png',
        currency: { ...originalState.config.currency, usdExchangeRate: 8 },
      },
      loadedLogoUrl: '/cloudbridge-favicon.png',
    },
    version: 0,
  })
  const storage = createJSONStorage<{
    config: typeof originalState.config
    loadedLogoUrl: typeof originalState.loadedLogoUrl
  }>(() => ({
    getItem: () => cached,
    setItem: () => {},
    removeItem: () => {},
  }))

  try {
    useSystemConfigStore.persist.setOptions({ storage })
    await useSystemConfigStore.persist.rehydrate()
    const state = useSystemConfigStore.getState()
    assert.equal(state.config.systemName, 'ApiPorter')
    assert.equal(state.config.logo, '/brand/apiporter-logo.png')
    assert.equal(state.loadedLogoUrl, '/brand/apiporter-logo.png')
    assert.equal(state.config.currency.usdExchangeRate, 8)
  } finally {
    useSystemConfigStore.persist.setOptions({ storage: originalStorage })
    useSystemConfigStore.setState(originalState)
  }
})
