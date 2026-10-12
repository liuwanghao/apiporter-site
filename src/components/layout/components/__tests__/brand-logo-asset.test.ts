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

const logoAssetUrl = new URL('../../../../../public/logo.png', import.meta.url)
const wordmarkAssetUrl = new URL(
  '../../../../../public/cloudbridge-wordmark.png',
  import.meta.url
)
const faviconAssetUrl = new URL(
  '../../../../../public/cloudbridge-favicon.png',
  import.meta.url
)
const indexHtmlUrl = new URL('../../../../../index.html', import.meta.url)

function assertPng(asset: Buffer, expected: { width: number; height: number }) {
  assert.deepEqual(
    asset.subarray(0, 8),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  )
  assert.equal(asset.readUInt32BE(16), expected.width)
  assert.equal(asset.readUInt32BE(20), expected.height)
  assert.equal(asset[25], 6)
}

describe('brand logo asset', () => {
  test('provides a crisp square RGBA logo for every compact brand slot', async () => {
    const logo = await readFile(logoAssetUrl)

    assertPng(logo, { width: 512, height: 512 })
  })

  test('ships the supplied Cloudbridge wordmark beside the compact mark', async () => {
    const wordmark = await readFile(wordmarkAssetUrl)

    assertPng(wordmark, { width: 664, height: 136 })
  })

  test('uses a dedicated cache-safe Cloudbridge favicon', async () => {
    const [favicon, indexHtml] = await Promise.all([
      readFile(faviconAssetUrl),
      readFile(indexHtmlUrl, 'utf8'),
    ])

    assertPng(favicon, { width: 64, height: 64 })
    assert.match(indexHtml, /href="\/cloudbridge-favicon\.png"/)
  })

  test('renders CBAPI as the initial browser tab title', async () => {
    const indexHtml = await readFile(indexHtmlUrl, 'utf8')

    assert.match(indexHtml, /<title>CBAPI<\/title>/)
    assert.match(indexHtml, /<meta name="title" content="CBAPI" \/>/)
    assert.doesNotMatch(indexHtml, /<title>New API<\/title>/)
  })
})
