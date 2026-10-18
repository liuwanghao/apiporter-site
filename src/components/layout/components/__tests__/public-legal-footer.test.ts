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

const footer = await readFile(
  new URL('../public-legal-footer.tsx', import.meta.url),
  'utf8'
)
const docsPages = await Promise.all([
  readFile(
    new URL('../../../../features/docs/home.tsx', import.meta.url),
    'utf8'
  ),
  readFile(
    new URL('../../../../features/docs/index.tsx', import.meta.url),
    'utf8'
  ),
  readFile(
    new URL('../../../../features/docs/guide.tsx', import.meta.url),
    'utf8'
  ),
  readFile(
    new URL('../../../../features/pricing/index.tsx', import.meta.url),
    'utf8'
  ),
  readFile(
    new URL('../../../../features/about/index.tsx', import.meta.url),
    'utf8'
  ),
])

describe('public legal footer', () => {
  test('uses the homepage customer-service destination and all six document links', () => {
    assert.match(
      footer,
      /CUSTOMER_SERVICE_URL = 'https:\/\/csm-cn\.cbapi\.ai\/index\.php'/
    )
    for (const href of [
      '/pfd/AI服務使用規範_V1.0.pdf',
      '/pfd/充值服務協議_V1.pdf',
      '/pfd/第三方模型服務說明_V1.0.pdf',
      '/pfd/數據安全承諾_V1.0.pdf',
      '/pfd/隱私政策_V1.0.pdf',
      '/pfd/用戶協議_V1.0.pdf',
    ]) {
      assert.match(footer, new RegExp(href.replaceAll('.', '\\.')))
    }
  })

  test('keeps the footer brand and legal links aligned across responsive layouts', () => {
    assert.match(footer, /items-center/)
    assert.match(footer, /max-\[820px\]:grid/)
    assert.match(footer, /max-\[820px\]:grid-cols-2/)
    assert.match(footer, /footer\.contactAria/)
  })

  test('uses the homepage footer on documentation, pricing and about pages', () => {
    for (const page of docsPages) {
      assert.match(page, /import \{ PublicLegalFooter \}/)
      assert.match(page, /<PublicLegalFooter \/>/)
    }
  })
})
