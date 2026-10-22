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
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, test } from 'vitest'

const ERROR_FEATURE_KEYS = [
  'Error Request Center',
  'Error Statistics',
  'Every failed relay request is recorded here with the channel, user, token, model, upstream error, and billing status.',
  'Request ID',
  'Channel ID',
  'Channel name',
  'Model',
  'Username',
  'User ID',
  'Token name',
  'Search',
  'Reset',
  'Time',
  'Status',
  'Category',
  'Channel',
  'User',
  'Billing',
  'Actions',
  'Failed to load',
  'Details',
  'Previous',
  'Next',
  'Status code',
  'Source',
  'Yes',
  'No',
  'Insufficient balance',
  'Other',
  'Unknown',
  'Today',
  'No data',
  'Upstream response',
  'Balance pre-deduction failed',
  'Gateway rejected',
  'Invalid parameter',
  'Authentication error',
  'Rate limited',
  'Upstream unavailable',
  'Gateway error',
  'Content blocked',
  'Error source',
  'Whether charged',
  'Whether refunded',
  'Charged',
  'Not charged',
  'Refunded',
  'Not refunded',
  'No error requests found',
  'Error details',
  'Upstream request ID',
  'Request path',
  'Error message',
  "Today's errors",
  "Yesterday's errors",
  'Errors in range',
  'Successes in range',
  'Error rate',
  'Error count by category',
  'Error count by status code',
  'Error count by source',
  'Error count by model',
  'Hourly error trend',
  'Channel successes vs errors',
  'Errors',
  'Successes',
  'By status code',
  'By source',
  'By model',
  'Last 24 hours',
  'Last 7 days',
  'All sources',
  'All status codes',
] as const

const LOCALES = ['zh-TW', 'ja', 'fr', 'ru', 'vi'] as const
const VALID_IDENTICAL_TRANSLATIONS: Partial<
  Record<(typeof LOCALES)[number], ReadonlySet<string>>
> = {
  fr: new Set(['Actions', 'Source']),
}

async function readTranslations(locale: string) {
  const source = await readFile(
    resolve(import.meta.dirname, `../../../i18n/locales/${locale}.json`),
    'utf8'
  )
  return JSON.parse(source).translation as Record<string, string>
}

describe('relay error localization', () => {
  test('translates every error center and statistics label', async () => {
    const english = await readTranslations('en')

    for (const locale of LOCALES) {
      const translations = await readTranslations(locale)

      for (const key of ERROR_FEATURE_KEYS) {
        assert.equal(typeof translations[key], 'string', `${locale}: ${key}`)
        if (VALID_IDENTICAL_TRANSLATIONS[locale]?.has(key)) continue
        assert.notEqual(
          translations[key],
          english[key],
          `${locale} still uses English for: ${key}`
        )
      }
    }
  })
})
