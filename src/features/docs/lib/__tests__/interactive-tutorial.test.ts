/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/
import assert from 'node:assert/strict'

import { test } from 'vitest'

import {
  getTutorialLanguage,
  isTutorialNavigation,
} from '../interactive-tutorial.ts'

test('site language selects the matching supported tutorial locale', () => {
  assert.equal(getTutorialLanguage('zh-CN'), 'zh')
  assert.equal(getTutorialLanguage('zh-Hant-TW'), 'zh-TW')
  assert.equal(getTutorialLanguage('zh-TW'), 'zh-TW')
  assert.equal(getTutorialLanguage('en-US'), 'en')
  assert.equal(getTutorialLanguage('fr'), 'en')
})

for (const product of ['codex', 'claude-code'] as const) {
  test(`${product} navigation accepts only its own messages and document path`, () => {
    const type = `apiporter:${product}-navigate`
    assert.equal(isTutorialNavigation({ type, path: '/' }, product), true)
    assert.equal(
      isTutorialNavigation({ type, path: `/docs/${product}` }, product),
      true
    )
    const otherProduct = product === 'codex' ? 'claude-code' : 'codex'
    for (const data of [
      null,
      {},
      'invalid',
      { type: 'other', path: '/' },
      { type, path: 'https://example.com' },
      { type, path: '/keys' },
      { type, path: `/docs/${otherProduct}` },
      { type: `apiporter:${otherProduct}-navigate`, path: '/' },
    ]) {
      assert.equal(isTutorialNavigation(data, product), false)
    }
  })
}
