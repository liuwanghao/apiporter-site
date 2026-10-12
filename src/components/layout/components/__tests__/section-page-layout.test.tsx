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
import { after, describe, test } from 'node:test'

import { Window } from 'happy-dom'

const domWindow = new Window({ width: 1440, height: 900 })
const domGlobals = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'HTMLDivElement',
  'Node',
  'Element',
  'Event',
  'MutationObserver',
] as const

for (const key of domGlobals) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: domWindow[key],
  })
}

const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { SectionPageLayout } = await import('../section-page-layout')

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

async function renderLayout(fixedContent: boolean) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(
      <SectionPageLayout fixedContent={fixedContent}>
        <SectionPageLayout.Title>API Keys</SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <button type='button'>Create</button>
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>Content</SectionPageLayout.Content>
      </SectionPageLayout>
    )
  })

  return { container, root }
}

describe('section page layout', () => {
  after(() => {
    domWindow.close()
  })

  test('exposes one stable visual hierarchy to every console page', async () => {
    const rendered = await renderLayout(true)

    assert.ok(
      rendered.container.querySelector('[data-slot="section-page-layout"]')
    )
    assert.equal(
      rendered.container.querySelector('[data-slot="section-page-title"]')
        ?.textContent,
      'API Keys'
    )
    assert.equal(
      rendered.container.querySelector('[data-slot="section-page-actions"]')
        ?.textContent,
      'Create'
    )
    assert.equal(
      rendered.container.querySelector('[data-slot="section-page-content"]')
        ?.textContent,
      'Content'
    )

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('keeps fixed workbench content inside its own scroll boundary', async () => {
    const rendered = await renderLayout(true)
    const content = rendered.container.querySelector(
      '[data-slot="section-page-content"]'
    )

    assert.equal(content?.classList.contains('overflow-hidden'), true)
    assert.equal(content?.classList.contains('overflow-auto'), false)

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('lets card pages use the page scroll container', async () => {
    const rendered = await renderLayout(false)
    const content = rendered.container.querySelector(
      '[data-slot="section-page-content"]'
    )

    assert.equal(content?.classList.contains('overflow-auto'), true)
    assert.equal(content?.classList.contains('overflow-hidden'), false)

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })
})
