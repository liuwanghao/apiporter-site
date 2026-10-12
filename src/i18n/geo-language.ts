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

export type LandingLanguage =
  | 'en'
  | 'fr'
  | 'ru'
  | 'vi'
  | 'ja'
  | 'zh-CN'
  | 'zh-TW'

const IP_LANGUAGE_ENDPOINT = 'https://api.country.is/'

export function languageForCountry(
  country?: string | null
): InterfaceLanguageCode | null {
  if (!country) return null

  switch (country.trim().toUpperCase()) {
    case 'CN':
      return 'zhCN'
    case 'HK':
    case 'MO':
    case 'TW':
      return 'zhTW'
    case 'JP':
      return 'ja'
    default:
      return 'en'
  }
}

export function toLandingLanguage(language?: string | null): LandingLanguage {
  const normalized = language?.trim().replaceAll('_', '-').toLowerCase() || ''
  if (
    normalized === 'zhtw' ||
    normalized === 'zh-tw' ||
    normalized === 'zh-hk' ||
    normalized === 'zh-mo' ||
    normalized.startsWith('zh-hant')
  ) {
    return 'zh-TW'
  }
  if (normalized === 'zhcn' || normalized.startsWith('zh')) return 'zh-CN'
  if (normalized.startsWith('ja')) return 'ja'
  const baseLanguage = normalized.split('-')[0]
  if (baseLanguage === 'fr' || baseLanguage === 'ru' || baseLanguage === 'vi') {
    return baseLanguage
  }
  return 'en'
}

export async function detectIpLanguage(
  fetcher: typeof fetch = globalThis.fetch,
  timeoutMs = 2200
): Promise<InterfaceLanguageCode | null> {
  if (typeof fetcher !== 'function') return null

  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetcher(IP_LANGUAGE_ENDPOINT, {
      cache: 'no-store',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    })
    if (!response.ok) return null

    const payload = (await response.json()) as { country?: unknown }
    return typeof payload.country === 'string'
      ? languageForCountry(payload.country)
      : null
  } catch {
    return null
  } finally {
    globalThis.clearTimeout(timeout)
  }
}
