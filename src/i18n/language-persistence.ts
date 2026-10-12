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
import type { InterfaceLanguageCode } from './languages'

const LANGUAGE_STORAGE_KEY = 'i18nextLng'
const LANGUAGE_SOURCE_STORAGE_KEY = 'cloudbridgeLanguageSource'

export type LanguagePreferenceSource = 'ip' | 'manual' | 'browser'
export type LanguageStorage = Pick<Storage, 'getItem' | 'setItem'>

function getBrowserLanguageStorage(): LanguageStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readLanguagePreferenceSource(
  storage: LanguageStorage | null = getBrowserLanguageStorage()
): LanguagePreferenceSource | null {
  if (!storage) return null
  try {
    const source = storage.getItem(LANGUAGE_SOURCE_STORAGE_KEY)
    return source === 'ip' || source === 'manual' || source === 'browser'
      ? source
      : null
  } catch {
    return null
  }
}

export function persistLanguagePreference(
  language: string,
  source: LanguagePreferenceSource,
  storage: LanguageStorage | null = getBrowserLanguageStorage()
): boolean {
  if (!storage) return false
  try {
    storage.setItem(LANGUAGE_STORAGE_KEY, language)
    storage.setItem(LANGUAGE_SOURCE_STORAGE_KEY, source)
    return true
  } catch {
    return false
  }
}

export function preserveLanguageOnLogin(
  language: string,
  storage: LanguageStorage | null = getBrowserLanguageStorage()
): boolean {
  return persistLanguagePreference(
    language,
    readLanguagePreferenceSource(storage) ?? 'browser',
    storage
  )
}

type ApplyIpLanguagePreferenceOptions = {
  storage?: LanguageStorage | null
  detectLanguage: () => Promise<InterfaceLanguageCode | null>
  getCurrentLanguage: () => string | undefined
  changeLanguage: (language: InterfaceLanguageCode) => Promise<unknown>
}

export async function applyIpLanguagePreference(
  options: ApplyIpLanguagePreferenceOptions
): Promise<InterfaceLanguageCode | null> {
  const storage = options.storage ?? getBrowserLanguageStorage()
  if (readLanguagePreferenceSource(storage)) return null

  const detectedLanguage = await options.detectLanguage()
  if (!detectedLanguage || readLanguagePreferenceSource(storage)) return null

  if (detectedLanguage !== options.getCurrentLanguage()) {
    await options.changeLanguage(detectedLanguage)
  }
  persistLanguagePreference(detectedLanguage, 'ip', storage)
  return detectedLanguage
}
