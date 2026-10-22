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
import { resolve } from 'node:path'

import { describe, test } from 'vitest'

const aboutPage = await readFile(
  resolve(import.meta.dirname, '../index.tsx'),
  'utf8'
)
const localeFiles = {
  en: resolve(import.meta.dirname, '../../../i18n/locales/en.json'),
  ja: resolve(import.meta.dirname, '../../../i18n/locales/ja.json'),
  zh: resolve(import.meta.dirname, '../../../i18n/locales/zh.json'),
  zhTW: resolve(import.meta.dirname, '../../../i18n/locales/zh-TW.json'),
}

const aboutKeys = [
  'aboutPage.eyebrow',
  'aboutPage.hero.titleLead',
  'aboutPage.hero.titleHighlight',
  'aboutPage.hero.description',
  'aboutPage.hero.descriptionLine2',
  'aboutPage.company.eyebrow',
  'aboutPage.company.title',
  'aboutPage.company.description1',
  'aboutPage.company.description2',
  'aboutPage.company.description3',
  'aboutPage.company.description4',
  'aboutPage.values.eyebrow',
  'aboutPage.values.title',
  'aboutPage.values.innovation.title',
  'aboutPage.values.innovation.description',
  'aboutPage.values.reliability.title',
  'aboutPage.values.reliability.description',
  'aboutPage.values.customer.title',
  'aboutPage.values.customer.description',
  'aboutPage.support.title',
  'aboutPage.support.customerService.title',
  'aboutPage.support.customerService.description',
  'aboutPage.support.customerService.link',
  'aboutPage.support.business.title',
  'aboutPage.support.business.description',
  'aboutPage.support.securityNotice',
] as const

describe('ApiPorter about page', () => {
  test('renders the complete page through reactive translations', () => {
    assert.match(aboutPage, /useTranslation/)
    for (const key of aboutKeys) {
      assert.match(aboutPage, new RegExp(key.replaceAll('.', '\\.')))
    }
    assert.match(aboutPage, /https:\/\/csm-cn\.cbapi\.ai\/index\.php/g)
    assert.equal(
      aboutPage.match(/https:\/\/csm-cn\.cbapi\.ai\/index\.php/g)?.length,
      2
    )
  })

  test('ships complete English, Japanese, simplified and traditional Chinese copy', async () => {
    for (const [locale, file] of Object.entries(localeFiles)) {
      const resource = JSON.parse(await readFile(file, 'utf8')).translation

      for (const key of aboutKeys) {
        assert.equal(
          typeof resource[key],
          'string',
          `${locale} is missing ${key}`
        )
        assert.ok(resource[key].trim(), `${locale} has an empty ${key}`)
      }
    }

    const en = JSON.parse(await readFile(localeFiles.en, 'utf8')).translation
    const ja = JSON.parse(await readFile(localeFiles.ja, 'utf8')).translation
    assert.doesNotMatch(en['aboutPage.hero.titleLead'], /[\u3400-\u9fff]/u)
    assert.match(ja['aboutPage.hero.titleLead'], /[\u3040-\u30ff]/u)
  })

  test('uses the branded public surface without the legacy empty state', () => {
    assert.match(aboutPage, /<PublicLayout[^>]*gradientBackground/s)
    assert.match(aboutPage, /public-page-title/)
    assert.match(aboutPage, /public-section-title/)
    assert.match(aboutPage, /public-page-lead/)
    assert.doesNotMatch(aboutPage, /getAboutContent/)
    assert.doesNotMatch(aboutPage, /New API Project Repository/)
  })
})
