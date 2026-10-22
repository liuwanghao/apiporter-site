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

import { test } from 'vitest'

const walletPage = await readFile(
  resolve(import.meta.dirname, '../../index.tsx'),
  'utf8'
)
const historyCard = await readFile(
  resolve(import.meta.dirname, '../recharge-history-card.tsx'),
  'utf8'
)
test('wallet page renders the complete recharge history inline', () => {
  assert.match(walletPage, /<RechargeHistoryCard/)
  assert.doesNotMatch(walletPage, /BillingHistoryDialog/)
  assert.doesNotMatch(walletPage, /billingDialogOpen/)
  assert.doesNotMatch(walletPage, /t\('Billing History'\)/)
  assert.ok(
    walletPage.indexOf('<RechargeHistoryCard') >
      walletPage.indexOf('<AffiliateRewardsCard')
  )
})

test('recharge history owns search, pagination, and order copy actions', () => {
  assert.match(historyCard, /useBillingHistory\(\)/)
  assert.match(historyCard, /data-recharge-history/)
  assert.match(historyCard, /handleSearch/)
  assert.match(historyCard, /handlePageChange/)
  assert.match(historyCard, /handlePageSizeChange/)
  assert.match(historyCard, /value=\{record\.trade_no\}/)
  assert.doesNotMatch(historyCard, /value=\{userId\}/)
  assert.match(historyCard, /\{t\('Time'\)\}/)
  for (const field of [
    'record.trade_no',
    'record.user_id',
    'record.create_time',
    'record.payment_method',
    'record.amount',
    'record.money',
    'record.status',
  ]) {
    assert.match(historyCard, new RegExp(field.replaceAll('.', '\\.')))
  }
})

test('recharge records use one shared table header', () => {
  assert.match(historyCard, /<TableHeader\b/)
  assert.match(historyCard, /<TableBody>/)
  for (const column of [
    'Order Number',
    'Time',
    'User ID',
    'Payment Method',
    'Amount',
    'Payment',
    'Status',
  ]) {
    assert.match(historyCard, new RegExp(`t\\('${column}'\\)`))
  }
  assert.doesNotMatch(historyCard, /<Label/)
})

test('history no longer exposes duplicate navigation actions', () => {
  assert.doesNotMatch(historyCard, /onViewAll/)
  assert.doesNotMatch(historyCard, /t\('View all'\)/)
  assert.doesNotMatch(walletPage, /onOpenBilling/)
})
