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

import { describe, test } from 'vitest'

import {
  createAlipayOfficialSchema,
  DEFAULT_ALIPAY_OFFICIAL_VALUES,
} from '../alipay-official-config'

const configured = {
  ...DEFAULT_ALIPAY_OFFICIAL_VALUES,
  enabled: true,
  app_id: '2026101600000001',
  seller_id: '2088000000000001',
  public_key: 'configured-public-key',
  callback_url: 'https://pay.example.com',
}

const t = (key: string) => key

describe('official Alipay settings validation', () => {
  test('allows a disabled draft but requires credentials before enabling', () => {
    const schema = createAlipayOfficialSchema(t, false, true)
    assert.equal(schema.safeParse(DEFAULT_ALIPAY_OFFICIAL_VALUES).success, true)
    const result = schema.safeParse({
      ...DEFAULT_ALIPAY_OFFICIAL_VALUES,
      enabled: true,
    })
    assert.equal(result.success, false)
    if (!result.success) {
      assert.deepEqual(
        result.error.issues.map((issue) => issue.path[0]).sort(),
        ['app_id', 'callback_url', 'private_key', 'public_key']
      )
    }
  })

  test('allows an omitted merchant PID and defaults callbacks to the configured server', () => {
    const schema = createAlipayOfficialSchema(
      t,
      true,
      true,
      'https://api.example.com/'
    )
    const values = { ...configured, seller_id: '', callback_url: '' }
    assert.equal(schema.parse(values).callback_url, '')
    for (const address of [
      '',
      'http://api.example.com',
      'https://api.example.com/path',
    ]) {
      assert.equal(
        createAlipayOfficialSchema(t, true, true, address).safeParse(values)
          .success,
        false
      )
    }
    assert.equal(
      createAlipayOfficialSchema(
        t,
        true,
        true,
        'http://invalid.example.com'
      ).safeParse(configured).success,
      true
    )
    assert.equal(
      createAlipayOfficialSchema(
        t,
        true,
        true,
        'http://localhost:8080'
      ).safeParse({ ...values, sandbox: true }).success,
      true
    )
  })

  test('keeps a stored private key when the replacement field is empty', () => {
    const schema = createAlipayOfficialSchema(t, true, true)
    assert.equal(schema.parse(configured).private_key, '')
    assert.equal(
      createAlipayOfficialSchema(t, false, true).safeParse(configured).success,
      false
    )
  })

  test('requires a production HTTPS origin and only allows HTTP in sandbox', () => {
    const schema = createAlipayOfficialSchema(t, true, true)
    for (const callback_url of [
      'http://pay.example.com',
      'https://pay.example.com/api/user/alipay/notify',
      'https://user:password@pay.example.com',
      'https://pay.example.com?key=value',
      'https://pay.example.com#notify',
      'javascript:alert(1)',
    ]) {
      assert.equal(
        schema.safeParse({ ...configured, callback_url }).success,
        false,
        callback_url
      )
    }
    assert.equal(
      schema.safeParse({
        ...configured,
        sandbox: true,
        callback_url: 'http://sandbox.example.com',
      }).success,
      true
    )
  })

  test('rejects invalid merchant IDs, nonpositive prices and fractional minimums', () => {
    const schema = createAlipayOfficialSchema(t, true, true)
    for (const patch of [
      { app_id: 'not-an-app' },
      { seller_id: 'merchant@email.example' },
      { price: 0 },
      { price: 1000001 },
      { price: Number.POSITIVE_INFINITY },
      { min_topup: 0 },
      { min_topup: 1.5 },
      { min_topup: 4001 },
    ]) {
      assert.equal(schema.safeParse({ ...configured, ...patch }).success, false)
    }
  })

  test('blocks enabling before the existing payment compliance confirmation', () => {
    const result = createAlipayOfficialSchema(t, true, false).safeParse(
      configured
    )
    assert.equal(result.success, false)
    if (!result.success) {
      assert.equal(result.error.issues[0].path[0], 'enabled')
    }
  })
})
