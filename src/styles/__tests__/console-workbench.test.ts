import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
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
import { resolve } from 'node:path'

import { Window } from 'happy-dom'
import { afterAll, describe, test } from 'vitest'

const domWindow = new Window({ width: 1440, height: 900 })
const stylesheet = await readFile(
  resolve(import.meta.dirname, '../reference-console.css'),
  'utf8'
)
const style = domWindow.document.createElement('style')
style.textContent = stylesheet
domWindow.document.head.append(style)

function createConsoleSurface(slot: string) {
  const consoleShell = domWindow.document.createElement('div')
  consoleShell.className = 'console-theme'
  const surface = domWindow.document.createElement('div')
  surface.dataset.slot = slot
  consoleShell.append(surface)
  domWindow.document.body.append(consoleShell)
  return { consoleShell, surface }
}

describe('console workbench theme', () => {
  afterAll(() => {
    domWindow.close()
  })

  test('uses the overview panel geometry for shared cards', () => {
    const rendered = createConsoleSurface('card')
    const computedStyle = domWindow.getComputedStyle(rendered.surface)

    assert.equal(computedStyle.borderRadius, '8px')
    assert.equal(computedStyle.borderTopStyle, 'solid')
    assert.equal(computedStyle.borderTopWidth, '1px')
    assert.equal(computedStyle.backgroundColor, '#ffffff')

    rendered.consoleShell.remove()
  })

  test('frames data workbenches as compact overview-style panels', () => {
    const rendered = createConsoleSurface('data-table-page')
    const computedStyle = domWindow.getComputedStyle(rendered.surface)

    assert.equal(computedStyle.borderRadius, '8px')
    assert.equal(computedStyle.borderTopWidth, '1px')
    assert.equal(computedStyle.padding, '12px')
    assert.equal(computedStyle.backgroundColor, '#ffffff')

    rendered.consoleShell.remove()
  })

  test('keeps the same surface hierarchy in dark mode', () => {
    domWindow.document.documentElement.classList.add('dark')
    const rendered = createConsoleSurface('data-table-view')
    const computedStyle = domWindow.getComputedStyle(rendered.surface)

    assert.equal(computedStyle.borderRadius, '7px')
    assert.equal(computedStyle.backgroundColor, '#122237')

    rendered.consoleShell.remove()
    domWindow.document.documentElement.classList.remove('dark')
  })
})
