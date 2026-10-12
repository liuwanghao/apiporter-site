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

const fontStylesheetUrl = new URL('../fonts.css', import.meta.url)
const themeStylesheetUrl = new URL('../theme.css', import.meta.url)
const fontAssetUrl = new URL(
  '../../assets/fonts/maple-mono/maple-mono-cn-regular.woff2',
  import.meta.url
)

describe('site font bundle', () => {
  test('self-hosts Maple Mono CN as a swap-loaded WOFF2 font', async () => {
    const [stylesheet, themeStylesheet, fontAsset] = await Promise.all([
      readFile(fontStylesheetUrl, 'utf8'),
      readFile(themeStylesheetUrl, 'utf8'),
      readFile(fontAssetUrl),
    ])

    assert.match(stylesheet, /font-family: 'Maple Mono CN'/)
    assert.match(
      stylesheet,
      /url\('\.\.\/assets\/fonts\/maple-mono\/maple-mono-cn-regular\.woff2'\)/
    )
    assert.match(stylesheet, /font-display: swap/)
    assert.match(themeStylesheet, /--font-sans: var\(--font-maple\)/)
    assert.match(themeStylesheet, /--font-serif: var\(--font-maple\)/)
    assert.match(themeStylesheet, /--font-mono: var\(--font-maple\)/)
    assert.equal(fontAsset.subarray(0, 4).toString('ascii'), 'wOF2')
    assert.ok(fontAsset.byteLength > 0)
  })
})
