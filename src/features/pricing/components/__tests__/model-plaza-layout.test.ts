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

import { Window } from 'happy-dom'
import { afterAll as after, describe, test } from 'vitest'

const domWindow = new Window({ width: 1440, height: 900 })
const stylesheet = await readFile(
  resolve(import.meta.dirname, '../../../../styles/reference-console.css'),
  'utf8'
)
const pricingDetails = await readFile(
  resolve(import.meta.dirname, '../model-details.tsx'),
  'utf8'
)
const style = domWindow.document.createElement('style')
style.textContent = stylesheet
domWindow.document.head.append(style)

describe('model plaza layout', () => {
  after(() => {
    domWindow.close()
  })

  test('uses a fixed filter column beside a flexible pricing workspace', () => {
    assert.match(
      stylesheet,
      /\.console-model-plaza\s*{[\s\S]*?--model-sidebar-width:\s*300px;/
    )
    assert.match(
      stylesheet,
      /\.console-model-plaza-layout\s*{[\s\S]*?grid-template-columns:\s*var\(--model-sidebar-width\) minmax\(0, 1fr\);/
    )
  })

  test('reuses the console palette for surfaces and selection states', () => {
    assert.match(
      stylesheet,
      /\.console-model-plaza\s*{[\s\S]*?--model-page:\s*var\(--console-page\);/
    )
    assert.match(
      stylesheet,
      /\.console-model-plaza\s*{[\s\S]*?--model-accent:\s*var\(--console-brand\);/
    )
    assert.match(
      stylesheet,
      /\.console-model-type-chips button\.is-active\s*{[\s\S]*?background:\s*var\(--model-accent\);/
    )
    assert.match(
      stylesheet,
      /\.console-provider-model\.is-selected\s*{[\s\S]*?background:\s*var\(--model-accent-soft\);/
    )
    assert.doesNotMatch(stylesheet, /--model-accent:\s*#(?:4f46e5|818cf8);/)
  })

  test('keeps core pricing columns stable and hides unavailable media prices', () => {
    assert.match(
      stylesheet,
      /\.console-model-group-pricing-table\s*\[data-slot='table'\]\s*\{[\s\S]*?table-layout:\s*fixed;[\s\S]*?min-width:\s*760px;/
    )
    assert.match(
      pricingDetails,
      /if \(props\.model\.image_ratio != null\) available\.add\('image'\)/
    )
    assert.match(
      pricingDetails,
      /if \(props\.model\.audio_ratio != null\) available\.add\('audio_input'\)/
    )
    assert.match(
      pricingDetails,
      /props\.model\.audio_ratio != null &&[\s\S]*?props\.model\.audio_completion_ratio != null[\s\S]*?available\.add\('audio_output'\)/
    )
    assert.match(
      pricingDetails,
      /\.filter\(\(priceType\) => availableExtraPriceTypes\.has\(priceType\.type\)\)/
    )
  })

  test('does not show a separate dynamic-pricing breakdown after selecting a model', () => {
    const panelStart = pricingDetails.indexOf(
      'export function ModelPricingPanel'
    )
    const panelEnd = pricingDetails.indexOf(
      'export function ModelDetailsContent',
      panelStart
    )
    const panelSource = pricingDetails.slice(panelStart, panelEnd)

    assert.ok(panelStart >= 0 && panelEnd > panelStart)
    assert.doesNotMatch(panelSource, /DynamicPricingBreakdown/)
    assert.match(panelSource, /showBillingMode={false}/)
    assert.match(panelSource, /<GroupPricingSection/)
  })
})
