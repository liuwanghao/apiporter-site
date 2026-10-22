/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

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

import { getLedgerDateRangeParams } from '../utils'

describe('promotion partner ledger date filters', () => {
  test('converts an inclusive local date range to backend half-open seconds', () => {
    const from = new Date(2026, 7, 19)
    const to = new Date(2026, 7, 21)

    assert.deepEqual(getLedgerDateRangeParams(from, to), {
      occurred_from: Math.floor(new Date(2026, 7, 19).getTime() / 1000),
      occurred_to: Math.floor(new Date(2026, 7, 22).getTime() / 1000),
    })
  })

  test('omits unset dates without creating an open-ended zero filter', () => {
    assert.deepEqual(getLedgerDateRangeParams(undefined, undefined), {})
    assert.deepEqual(getLedgerDateRangeParams(new Date(2026, 7, 19)), {
      occurred_from: Math.floor(new Date(2026, 7, 19).getTime() / 1000),
    })
  })
})
