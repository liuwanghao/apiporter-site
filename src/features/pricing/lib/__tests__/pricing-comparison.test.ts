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
  createDiscountRateFormatter,
  formatDiscountRateLabel,
  getPricingComparisonRows,
} from '../model-helpers.ts'

describe('pricing comparison rows', () => {
  test('places the base price first and orders groups by ratio', () => {
    assert.deepEqual(
      getPricingComparisonRows(
        ['default', 'vip', 'priority'],
        { default: 1, vip: 0.6, priority: 1.2 },
        true
      ),
      [
        { kind: 'base', key: 'base', ratio: 6.5, discountRate: 0 },
        {
          kind: 'group',
          key: 'vip',
          group: 'vip',
          ratio: 0.6,
          discountRate: 0.907692,
        },
        {
          kind: 'group',
          key: 'default',
          group: 'default',
          ratio: 1,
          discountRate: 0.846154,
        },
        {
          kind: 'group',
          key: 'priority',
          group: 'priority',
          ratio: 1.2,
          discountRate: 0.815385,
        },
      ]
    )
  })

  test('uses the same original-price benchmark when the base row is hidden', () => {
    const rows = getPricingComparisonRows(['default'], { default: 0.8 })

    assert.deepEqual(rows, [
      {
        kind: 'group',
        key: 'default',
        group: 'default',
        ratio: 0.8,
        discountRate: 0.876923,
      },
    ])
  })

  test('keeps billing ratios unchanged while comparing discounts with the original price', () => {
    const rows = getPricingComparisonRows(
      ['Codex_core', 'Codex_prime', 'Claude_core', 'Claude_direct'],
      { Codex_core: 0.3, Codex_prime: 0.5, Claude_core: 2, Claude_direct: 6.5 },
      true
    )
    const formatter = createDiscountRateFormatter('en')

    assert.deepEqual(
      rows.map((row) => [
        row.ratio,
        formatDiscountRateLabel(formatter, row.discountRate),
      ]),
      [
        [6.5, '0% off'],
        [0.3, '95.38% off'],
        [0.5, '92.31% off'],
        [2, '69.23% off'],
        [6.5, '0% off'],
      ]
    )
  })

  test('preserves free pricing and exposes surcharges above the original price', () => {
    const rows = getPricingComparisonRows(['free', 'premium'], {
      free: 0,
      premium: 13,
    })

    assert.deepEqual(
      rows.map((row) => [row.ratio, row.discountRate]),
      [
        [0, 1],
        [13, -1],
      ]
    )
  })

  test('preserves source order when group ratios are equal', () => {
    const rows = getPricingComparisonRows(['beta', 'alpha'], {
      alpha: 0.8,
      beta: 0.8,
    })

    assert.deepEqual(
      rows.map((row) => row.key),
      ['beta', 'alpha']
    )
  })

  test('normalizes underscore locales before formatting discounts', () => {
    const formatter = createDiscountRateFormatter('zh_CN')

    assert.equal(formatter.format(0.4), '40%')
  })

  test('adds the off suffix to displayed discount rates', () => {
    const formatter = createDiscountRateFormatter('en')

    assert.equal(formatDiscountRateLabel(formatter, 0.8), '80% off')
  })
})
