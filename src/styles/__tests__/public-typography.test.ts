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
import { describe, test } from 'node:test'

const [stylesheet, landing, pricing, rankings, docs] = await Promise.all([
  readFile(new URL('../reference-console.css', import.meta.url), 'utf8'),
  readFile(
    new URL('../../../public/relay-landing.html', import.meta.url),
    'utf8'
  ),
  readFile(
    new URL('../../features/pricing/index.tsx', import.meta.url),
    'utf8'
  ),
  readFile(
    new URL(
      '../../features/rankings/components/rankings-hero.tsx',
      import.meta.url
    ),
    'utf8'
  ),
  readFile(new URL('../../features/docs/home.tsx', import.meta.url), 'utf8'),
])

describe('public page typography', () => {
  test('defines one semantic responsive scale for public pages', () => {
    assert.match(
      stylesheet,
      /--public-page-title-size:\s*clamp\(2\.25rem, 4vw, 3rem\);/
    )
    assert.match(
      stylesheet,
      /--public-section-title-size:\s*clamp\(1\.75rem, 3vw, 2\.25rem\);/
    )
    assert.match(stylesheet, /--public-body-size:\s*1rem;/)
    assert.match(
      stylesheet,
      /\.public-page-title\s*\{[^}]*font-size:\s*var\(--public-page-title-size\);/
    )
    assert.match(
      stylesheet,
      /\.public-page-lead\s*\{[^}]*font-size:\s*var\(--public-body-size\);/
    )
  })

  test('uses the same primary title and lead roles on every public page', () => {
    for (const source of [pricing, rankings, docs]) {
      assert.match(source, /public-page-title/)
      assert.match(source, /public-page-lead/)
    }
    assert.match(
      landing,
      /--public-page-title-size:\s*clamp\(2\.25rem, 4vw, 3rem\);/
    )
    assert.match(landing, /font-size:\s*var\(--public-page-title-size\);/)
    assert.match(landing, /font-size:\s*var\(--public-body-size\);/)
  })
})
