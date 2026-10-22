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

import { parseResetPasswordLanguage } from './language.ts'

describe('password reset link language', () => {
  test('maps server language codes to interface language codes', () => {
    assert.equal(parseResetPasswordLanguage('en'), 'en')
    assert.equal(parseResetPasswordLanguage('ja'), 'ja')
    assert.equal(parseResetPasswordLanguage('zh-CN'), 'zhCN')
    assert.equal(parseResetPasswordLanguage('zh-TW'), 'zhTW')
  })

  test('keeps legacy links and unsupported values from changing language', () => {
    assert.equal(parseResetPasswordLanguage(undefined), null)
    assert.equal(parseResetPasswordLanguage('fr'), null)
  })
})
