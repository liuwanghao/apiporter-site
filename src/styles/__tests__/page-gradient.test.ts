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

const [
  stylesheet,
  publicLayout,
  authenticatedLayout,
  home,
  pricing,
  rankings,
  about,
] = await Promise.all([
  readFile(new URL('../reference-console.css', import.meta.url), 'utf8'),
  readFile(
    new URL(
      '../../components/layout/components/public-layout.tsx',
      import.meta.url
    ),
    'utf8'
  ),
  readFile(
    new URL(
      '../../components/layout/components/authenticated-layout.tsx',
      import.meta.url
    ),
    'utf8'
  ),
  readFile(new URL('../../features/home/index.tsx', import.meta.url), 'utf8'),
  readFile(
    new URL('../../features/pricing/index.tsx', import.meta.url),
    'utf8'
  ),
  readFile(
    new URL('../../features/rankings/index.tsx', import.meta.url),
    'utf8'
  ),
  readFile(new URL('../../features/about/index.tsx', import.meta.url), 'utf8'),
])

describe('shared page gradient', () => {
  test('reuses the documentation page radial gradient recipe', () => {
    assert.match(
      stylesheet,
      /\.app-gradient-page\s*\{[\s\S]*?circle at 12% 15%[\s\S]*?var\(--primary\) 13%[\s\S]*?circle at 88% 32%[\s\S]*?var\(--success\) 11%/
    )
    assert.match(
      stylesheet,
      /\.app-gradient-page\s*\{[^}]*min-height:\s*100svh;/
    )
  })

  test('public layout exposes an explicit gradient background option', () => {
    assert.match(publicLayout, /gradientBackground\?: boolean/)
    assert.match(
      publicLayout,
      /props\.gradientBackground && 'app-gradient-page'/
    )
  })

  test('home, model plaza, rankings and about opt into the shared gradient', () => {
    for (const source of [home, pricing, rankings, about]) {
      assert.match(source, /<PublicLayout[^>]*gradientBackground/s)
    }
  })

  test('console shell uses the same gradient without an opaque inset', () => {
    assert.match(
      authenticatedLayout,
      /console-theme app-gradient-page flex-col/
    )
    assert.match(
      stylesheet,
      /\.console-theme\.app-gradient-page \[data-slot='sidebar-inset'\][\s\S]*?background:\s*transparent;/
    )
  })

  test('continues the page gradient through public and console topbars', () => {
    assert.match(stylesheet, /--app-page-gradient:\s*radial-gradient\(/)
    assert.match(stylesheet, /background-image:\s*var\(--app-page-gradient\);/)
    assert.match(
      stylesheet,
      /\.app-gradient-page[\s\S]*?header\.public-topbar[\s\S]*?header\.console-topbar[\s\S]*?background-image:\s*var\(--app-page-gradient\);/
    )
  })
})
