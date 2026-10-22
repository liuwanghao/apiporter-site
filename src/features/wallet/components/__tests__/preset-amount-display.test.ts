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

const rechargeForm = await readFile(
  resolve(import.meta.dirname, '../recharge-form-card.tsx'),
  'utf8'
)
test('preset amount buttons omit converted payment and savings copy', () => {
  assert.doesNotMatch(rechargeForm, /Pay \{formatCurrency\(actualPrice\)\}/)
  assert.doesNotMatch(rechargeForm, /Save \{formatCurrency\(savedAmount\)\}/)
  assert.doesNotMatch(rechargeForm, /actualPrice,\s*savedAmount,/)
})

test('preset amount buttons stay on one horizontally scrollable row', () => {
  assert.match(
    rechargeForm,
    /data-preset-amounts[\s\S]{0,200}auto-cols-\[minmax\(112px,1fr\)\][\s\S]{0,100}grid-flow-col[\s\S]{0,100}overflow-x-auto/
  )
})

test('preset and custom amounts display a dollar prefix', () => {
  assert.match(rechargeForm, /data-preset-amount-currency/)
  assert.match(rechargeForm, /data-custom-amount-currency/)
})

test('custom amount uses one direct online payment action', () => {
  assert.match(rechargeForm, /onOnlinePay/)
  assert.match(rechargeForm, /t\('Pay Online'\)/)
  assert.doesNotMatch(rechargeForm, /t\('Amount to pay:'\)/)
  assert.doesNotMatch(rechargeForm, /t\('Payment Method'\)/)
  assert.doesNotMatch(rechargeForm, /onPaymentMethodSelect/)
})
