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

import { createInstance } from 'i18next'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { test } from 'vitest'

import { PaymentSummary } from '../payment-summary'

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
})

function renderSummary(topupAmount: number, displayRate?: number) {
  return renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(PaymentSummary, { topupAmount, displayRate })
    )
  )
}

test('payment summary only shows recharge amount and removes payment estimates', () => {
  const markup = renderSummary(5)
  assert.match(markup, /Recharge Amount/)
  assert.match(markup, /5\.00/)
  assert.doesNotMatch(markup, /Subtotal|Tax|Estimated Payment|Starting at/)
})

test('recharge amount follows the display rate and defaults to one', () => {
  assert.match(renderSummary(10, 7.3), /73\.00/)
  assert.match(renderSummary(0), /0\.00/)
  assert.match(renderSummary(10), /10\.00/)
})
