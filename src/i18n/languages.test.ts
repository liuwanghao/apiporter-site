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

import {
  convertDetectedLanguage,
  INTERFACE_LANGUAGE_OPTIONS,
  normalizeInterfaceLanguage,
  toDocumentLanguage,
} from './languages.ts'

describe('document language mapping', () => {
  test('uses standard locale tags for the requested typography variants', () => {
    assert.equal(toDocumentLanguage('zhCN'), 'zh-CN')
    assert.equal(toDocumentLanguage('zhTW'), 'zh-TW')
    assert.equal(toDocumentLanguage('en'), 'en')
    assert.equal(toDocumentLanguage('ja'), 'ja')
  })

  test('preserves the project language codes when they come back from storage', () => {
    assert.equal(convertDetectedLanguage('zhTW'), 'zhTW')
    assert.equal(convertDetectedLanguage('zhCN'), 'zhCN')
    assert.equal(convertDetectedLanguage('zh-TW'), 'zhTW')
    assert.equal(convertDetectedLanguage('zh-CN'), 'zhCN')
  })

  test('offers only English, Simplified Chinese, Traditional Chinese, and Japanese', () => {
    assert.deepEqual(INTERFACE_LANGUAGE_OPTIONS, [
      { code: 'en', label: 'English' },
      { code: 'zhCN', label: '简体中文' },
      { code: 'zhTW', label: '繁體中文' },
      { code: 'ja', label: '日本語' },
    ])
    assert.equal(normalizeInterfaceLanguage('fr'), 'en')
  })
})
