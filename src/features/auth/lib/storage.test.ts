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

import { afterEach, describe, test } from 'vitest'

import {
  getAffiliateCode,
  getReferralCode,
  saveAffiliateCode,
  saveCommissionReferralCode,
  saveOfficialAffiliateCode,
  saveReferralCode,
} from './storage.ts'

function installStorage() {
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    },
  })
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window')
})

describe('registration referral storage', () => {
  test('an explicit ref clears a stale official affiliate code', () => {
    installStorage()
    saveAffiliateCode('AFF-OLD')
    saveCommissionReferralCode('REF-NEW')

    assert.equal(getReferralCode(), 'REF-NEW')
    assert.equal(getAffiliateCode(), '')
  })

  test('an explicit aff clears a stale commission referral', () => {
    installStorage()
    saveReferralCode('REF-OLD')
    saveOfficialAffiliateCode('AFF-NEW')

    assert.equal(getReferralCode(), '')
    assert.equal(getAffiliateCode(), 'AFF-NEW')
  })
})
