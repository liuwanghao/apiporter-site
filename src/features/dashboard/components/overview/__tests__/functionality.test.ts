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
  USER_OVERVIEW_ACTION_PATHS,
  buildOverviewRequestExample,
  getRunwayDisplay,
  resolveCurrencyEnabled,
  resolveSetupGuideExpanded,
} from '../../../lib/overview-functionality.ts'

const translate = (key: string) => key

describe('overview functionality', () => {
  test('waits for setup data before automatically expanding the guide', () => {
    assert.equal(resolveSetupGuideExpanded(null, false, false), false)
    assert.equal(resolveSetupGuideExpanded(null, true, false), true)
    assert.equal(resolveSetupGuideExpanded(null, true, true), false)
    assert.equal(resolveSetupGuideExpanded(true, false, true), true)
  })

  test('builds the original ready-to-run request preview', () => {
    const request = buildOverviewRequestExample({
      sourceUrl: 'https://api.example.com/v1/',
      origin: 'https://console.example.com',
      firstModel: undefined,
      preferredKey: {
        id: 7,
        name: 'Production',
        key: 'abcdefghijklmnop',
      },
      noKeyName: 'No API key yet',
    })

    assert.deepEqual(request, {
      endpoint: 'https://api.example.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      keyName: 'Production',
      keyId: 7,
      displayKey: 'sk-abcd...mnop',
      ready: true,
    })
  })

  test('keeps the preview locked until an API key exists', () => {
    const request = buildOverviewRequestExample({
      origin: 'https://console.example.com',
      firstModel: 'gpt-4.1',
      preferredKey: null,
      noKeyName: 'No API key yet',
    })

    assert.equal(
      request.endpoint,
      'https://console.example.com/v1/chat/completions'
    )
    assert.equal(request.displayKey, 'sk-...')
    assert.equal(request.ready, false)
  })

  test('honors the server currency flag before the local fallback', () => {
    assert.equal(resolveCurrencyEnabled(false, true), false)
    assert.equal(resolveCurrencyEnabled(true, false), true)
    assert.equal(resolveCurrencyEnabled(undefined, true), true)
  })

  test('preserves the original runway empty and boundary states', () => {
    assert.equal(getRunwayDisplay(0, 0, translate), 'Balance depleted')
    assert.equal(getRunwayDisplay(100, 0, translate), 'No recent usage')
    assert.equal(getRunwayDisplay(2, 10, translate), 'Less than 1 day left')
    assert.equal(getRunwayDisplay(10_000, 1, translate), '999+ days')
  })

  test('exposes only the original user-facing quick actions', () => {
    assert.deepEqual(USER_OVERVIEW_ACTION_PATHS, [
      '/keys',
      '/usage-logs',
      '/pricing',
    ])
  })
})
