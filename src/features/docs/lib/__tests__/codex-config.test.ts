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

import { buildCodexConfig, resolveCodexApiBaseUrl } from '../codex-config.ts'

describe('Codex documentation configuration', () => {
  test('uses the current page origin as the documentation API address', () => {
    assert.equal(
      resolveCodexApiBaseUrl('https://console.example.com'),
      'https://console.example.com/v1'
    )
  })

  test('preserves the current page port for local development', () => {
    assert.equal(
      resolveCodexApiBaseUrl('http://localhost:5180'),
      'http://localhost:5180/v1'
    )
  })

  test('appends one v1 segment when the address has trailing slashes or v1', () => {
    assert.equal(
      resolveCodexApiBaseUrl('https://console.example.com/'),
      'https://console.example.com/v1'
    )
    assert.equal(
      resolveCodexApiBaseUrl('https://console.example.com/v1/'),
      'https://console.example.com/v1'
    )
  })

  test('uses an environment variable instead of embedding a secret', () => {
    const config = buildCodexConfig('https://gateway.example.com/v1')

    assert.match(config, /model_provider = "apiporter"/)
    assert.match(config, /env_key = "APIPORTER_API_KEY"/)
    assert.match(config, /wire_api = "responses"/)
    assert.doesNotMatch(config, /YOUR_APIPORTER_API_KEY/)
    assert.doesNotMatch(config, /auth\.json/)
  })
})
