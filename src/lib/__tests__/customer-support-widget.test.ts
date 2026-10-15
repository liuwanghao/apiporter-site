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
import { test } from 'node:test'

const indexHtml = await readFile(
  new URL('../../../index.html', import.meta.url),
  'utf8'
)
const mainSource = await readFile(
  new URL('../../main.tsx', import.meta.url),
  'utf8'
)

test('loads the designated ApiPorter customer-support widget once', () => {
  const scriptMatches = indexHtml.match(
    /https:\/\/csm-cn\.cbapi\.ai\/widget\.js\?channel=stable/g
  )

  assert.equal(scriptMatches?.length, 1)
  assert.match(indexHtml, /data-site-id="site_b263a2db8fd9c533a560"/)
  assert.match(indexHtml, /data-language="auto"/)
  assert.match(indexHtml, /<script[^>]*\sasync(?:="")?[^>]*><\/script>/)
})

test('shows a contact fallback until the official support widget mounts', async () => {
  const fallbackSource = await readFile(
    new URL('../../components/customer-support-fallback.tsx', import.meta.url),
    'utf8'
  ).catch(() => '')

  assert.match(mainSource, /<CustomerSupportFallback\s*\/>/)
  assert.match(fallbackSource, /cloudbridge-support-error/)
  assert.match(fallbackSource, /cloudbridge-support-widget/)
  assert.match(
    fallbackSource,
    /work\.weixin\.qq\.com\/kfid\/kfc04b263b7d12b1448/
  )
  assert.match(fallbackSource, /aria-label=/)
  assert.match(fallbackSource, /t\('Customer service center'\)/)
  assert.match(fallbackSource, /styleOfficialWidgetLauncher\(label\)/)
  assert.match(
    fallbackSource,
    /\.wrap \.launcher span\s*\{\s*display: none !important;/
  )
  assert.match(
    fallbackSource,
    /\.wrap\s*\{\s*bottom: max\(66px, calc\(env\(safe-area-inset-bottom\) \+ 50px\)\) !important;/
  )
  assert.match(
    fallbackSource,
    /bottom: max\(70px, calc\(env\(safe-area-inset-bottom\) \+ 50px\)\) !important;/
  )
  assert.match(
    fallbackSource,
    /bottom-\[max\(66px,calc\(env\(safe-area-inset-bottom\)\+50px\)\)\]/
  )
  assert.match(
    fallbackSource,
    /sm:bottom-\[max\(70px,calc\(env\(safe-area-inset-bottom\)\+50px\)\)\]/
  )
  assert.doesNotMatch(fallbackSource, /<span/)
})
