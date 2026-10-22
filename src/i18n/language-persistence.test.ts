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

import { describe, test } from 'vitest'

import {
  applyIpLanguagePreference,
  persistLanguagePreference,
  preserveLanguageOnLogin,
  readLanguagePreferenceSource,
  type LanguageStorage,
} from './language-persistence.ts'
import type { InterfaceLanguageCode } from './languages'

function createStorage(initial: Record<string, string> = {}): LanguageStorage {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }
}

describe('language persistence', () => {
  test('replaces the detector legacy cache with the IP language and keeps it after refresh', async () => {
    const storage = createStorage({ i18nextLng: 'zhCN' })
    let currentLanguage = 'zhCN'
    let detectionCount = 0

    const applyPreference = () =>
      applyIpLanguagePreference({
        storage,
        detectLanguage: async () => {
          detectionCount += 1
          return 'en'
        },
        getCurrentLanguage: () => currentLanguage,
        changeLanguage: async (language) => {
          currentLanguage = language
        },
      })

    assert.equal(await applyPreference(), 'en')
    assert.equal(storage.getItem('i18nextLng'), 'en')
    assert.equal(readLanguagePreferenceSource(storage), 'ip')

    assert.equal(await applyPreference(), null)
    assert.equal(currentLanguage, 'en')
    assert.equal(detectionCount, 1)
  })

  test('never lets an IP result override a manual language preference', async () => {
    const storage = createStorage()
    persistLanguagePreference('ja', 'manual', storage)
    let changedLanguage: string | null = null

    const result = await applyIpLanguagePreference({
      storage,
      detectLanguage: async () => 'zhCN',
      getCurrentLanguage: () => 'ja',
      changeLanguage: async (language) => {
        changedLanguage = language
      },
    })

    assert.equal(result, null)
    assert.equal(changedLanguage, null)
    assert.equal(storage.getItem('i18nextLng'), 'ja')
    assert.equal(readLanguagePreferenceSource(storage), 'manual')
  })

  test('keeps the language displayed at login when an earlier IP request finishes later', async () => {
    const storage = createStorage({ i18nextLng: 'zhCN' })
    let currentLanguage = 'zhCN'
    let resolveDetection!: (language: InterfaceLanguageCode | null) => void
    const detection = new Promise<InterfaceLanguageCode | null>((resolve) => {
      resolveDetection = resolve
    })
    const pendingPreference = applyIpLanguagePreference({
      storage,
      detectLanguage: () => detection,
      getCurrentLanguage: () => currentLanguage,
      changeLanguage: async (language) => {
        currentLanguage = language
      },
    })

    preserveLanguageOnLogin(currentLanguage, storage)
    resolveDetection('en')

    assert.equal(await pendingPreference, null)
    assert.equal(currentLanguage, 'zhCN')
    assert.equal(storage.getItem('i18nextLng'), 'zhCN')
    assert.equal(readLanguagePreferenceSource(storage), 'browser')
  })

  test('keeps the language retained at login after a page refresh', async () => {
    const storage = createStorage()
    preserveLanguageOnLogin('zhCN', storage)

    const result = await applyIpLanguagePreference({
      storage,
      detectLanguage: async () => {
        assert.fail('A retained browser language must skip IP detection')
      },
      getCurrentLanguage: () => 'zhCN',
      changeLanguage: async () => {
        assert.fail('A refresh must not change the retained language')
      },
    })

    assert.equal(result, null)
    assert.equal(storage.getItem('i18nextLng'), 'zhCN')
  })

  test('retains an existing language preference source when login completes', () => {
    for (const source of ['manual', 'ip'] as const) {
      const storage = createStorage()
      persistLanguagePreference('zhCN', source, storage)

      assert.equal(preserveLanguageOnLogin('zhCN', storage), true)
      assert.equal(storage.getItem('i18nextLng'), 'zhCN')
      assert.equal(readLanguagePreferenceSource(storage), source)
    }
  })

  test('does not block login when browser storage is unavailable', () => {
    assert.equal(preserveLanguageOnLogin('zhCN', null), false)
    assert.equal(
      preserveLanguageOnLogin('zhCN', {
        getItem: () => {
          throw new Error('Storage is blocked')
        },
        setItem: () => {
          throw new Error('Storage is blocked')
        },
      }),
      false
    )
  })
})
