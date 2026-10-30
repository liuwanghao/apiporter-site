import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
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
import { resolve } from 'node:path'

import { test } from 'vitest'

const indexHtml = await readFile(
  resolve(import.meta.dirname, '../../../index.html'),
  'utf8'
)
const mainSource = await readFile(
  resolve(import.meta.dirname, '../../main.tsx'),
  'utf8'
)

test('loads the designated ApiPorter customer-support widget once', () => {
  const scriptMatches = indexHtml.match(
    /https:\/\/im\.myhelp\.im\/api\/v1\/public\/access-sdk\.js\?site=7a510f9e-6425-4feb-9e2b-16d8535e63e8/g
  )

  assert.equal(scriptMatches?.length, 1)
  assert.match(indexHtml, /data-site="7a510f9e-6425-4feb-9e2b-16d8535e63e8"/)
  assert.match(indexHtml, /<script[^>]*\sasync(?:="")?[^>]*><\/script>/)
})

test('does not mount the legacy widget or its duplicate fallback launcher', () => {
  assert.doesNotMatch(indexHtml, /csm-cn\.cbapi\.ai\/widget\.js/)
  assert.doesNotMatch(mainSource, /CustomerSupportFallback/)
})
