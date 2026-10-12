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
import { describe, test } from 'node:test'

import {
  detectIpLanguage,
  languageForCountry,
  toLandingLanguage,
} from './geo-language.ts'

describe('IP-aware interface language', () => {
  test('maps supported regions onto the four public-site languages', () => {
    assert.equal(languageForCountry('CN'), 'zhCN')
    assert.equal(languageForCountry('TW'), 'zhTW')
    assert.equal(languageForCountry('HK'), 'zhTW')
    assert.equal(languageForCountry('MO'), 'zhTW')
    assert.equal(languageForCountry('jp'), 'ja')
    assert.equal(languageForCountry('US'), 'en')
    assert.equal(languageForCountry(undefined), null)
  })

  test('normalizes every app language to a landing-page locale', () => {
    assert.equal(toLandingLanguage('zhCN'), 'zh-CN')
    assert.equal(toLandingLanguage('zhTW'), 'zh-TW')
    assert.equal(toLandingLanguage('ja-JP'), 'ja')
    assert.equal(toLandingLanguage('fr'), 'fr')
    assert.equal(toLandingLanguage('fr-FR'), 'fr')
    assert.equal(toLandingLanguage('ru'), 'ru')
    assert.equal(toLandingLanguage('ru-RU'), 'ru')
    assert.equal(toLandingLanguage('vi'), 'vi')
    assert.equal(toLandingLanguage('vi_VN'), 'vi')
    assert.equal(toLandingLanguage('de'), 'en')
    assert.equal(toLandingLanguage(undefined), 'en')
  })

  test('reads only the country code from the IP lookup response', async () => {
    const requestUrls: string[] = []
    const result = await detectIpLanguage(async (input) => {
      requestUrls.push(String(input))
      return new Response(
        JSON.stringify({ ip: '203.0.113.1', country: 'TW' }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    })

    assert.deepEqual(requestUrls, ['https://api.country.is/'])
    assert.equal(result, 'zhTW')
  })

  test('fails open when geolocation is unavailable', async () => {
    const result = await detectIpLanguage(async () => {
      throw new TypeError('offline')
    })

    assert.equal(result, null)
  })
})
