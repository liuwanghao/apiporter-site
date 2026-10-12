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
import { describe, test } from 'node:test'

import { sanitizeAuthRedirect } from './auth-redirect.ts'

const origin = 'https://dashboard.example.com'

describe('authentication redirect validation', () => {
  test('preserves safe internal paths, search parameters, and fragments', () => {
    assert.equal(
      sanitizeAuthRedirect('/console?tab=usage#recent', origin),
      '/console?tab=usage#recent'
    )
    assert.equal(
      sanitizeAuthRedirect(
        'https://dashboard.example.com/dashboard?tab=quota#daily',
        origin
      ),
      '/dashboard?tab=quota#daily'
    )
  })

  test('rejects external and ambiguously parsed redirect targets', () => {
    const unsafeTargets: unknown[] = [
      undefined,
      '',
      'dashboard',
      '//attacker.example/path',
      'https://attacker.example/path',
      'javascript:alert(1)',
      '/\\attacker.example/path',
      'https:\\attacker.example/path',
    ]

    for (const target of unsafeTargets) {
      assert.equal(sanitizeAuthRedirect(target, origin), null)
    }
  })

  test('rejects invalid or non-HTTP application origins', () => {
    assert.equal(sanitizeAuthRedirect('/dashboard', 'not-an-origin'), null)
    assert.equal(sanitizeAuthRedirect('/dashboard', 'file:///tmp/app'), null)
  })
})
