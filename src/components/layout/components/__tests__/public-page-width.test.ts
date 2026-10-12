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

const publicPages = [
  {
    name: 'about',
    source: await readFile(
      new URL('../../../../features/about/index.tsx', import.meta.url),
      'utf8'
    ),
    outerWidth: 1492,
    horizontalPadding: 32,
  },
  {
    name: 'docs',
    source: await readFile(
      new URL('../../../../features/docs/home.tsx', import.meta.url),
      'utf8'
    ),
    outerWidth: 1508,
    horizontalPadding: 48,
  },
  {
    name: 'pricing',
    source: await readFile(
      new URL('../../../../features/pricing/index.tsx', import.meta.url),
      'utf8'
    ),
    outerWidth: 1524,
    horizontalPadding: 64,
  },
  {
    name: 'rankings',
    source: await readFile(
      new URL('../../../../features/rankings/index.tsx', import.meta.url),
      'utf8'
    ),
    outerWidth: 1524,
    horizontalPadding: 64,
  },
]

describe('public page widths', () => {
  for (const page of publicPages) {
    test(`${page.name} reserves a net 1460px content width`, () => {
      assert.equal(page.outerWidth - page.horizontalPadding, 1460)
      assert.match(page.source, new RegExp(`max-w-\\[${page.outerWidth}px\\]`))
      assert.doesNotMatch(page.source, /max-w-\[(1280|1460)px\]/)
    })
  }
})
