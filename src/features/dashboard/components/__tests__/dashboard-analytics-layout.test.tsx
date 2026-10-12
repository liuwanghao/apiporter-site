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
const domGlobals = {
  window: domWindow,
  document: domWindow.document,
  navigator: domWindow.navigator,
  HTMLElement: domWindow.HTMLElement,
  HTMLButtonElement: domWindow.HTMLButtonElement,
  Node: domWindow.Node,
  Element: domWindow.Element,
  Event: domWindow.Event,
  MouseEvent: domWindow.MouseEvent,
  MutationObserver: domWindow.MutationObserver,
}

for (const [key, value] of Object.entries(domGlobals)) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value,
  })
}

const React = await import('react')
const { act } = React
Object.defineProperty(globalThis, 'React', {
  configurable: true,
  value: React,
})
const { createRoot } = await import('react-dom/client')
const { DashboardAnalyticsLayout } =
  await import('../dashboard-analytics-layout')

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true,
})

describe('dashboard analytics layout', () => {
  after(() => {
    domWindow.close()
  })

  test('keeps section navigation above the analytics workspace', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <DashboardAnalyticsLayout
          activeSection='models'
          navigationLabel='Dashboard'
          sections={['models', 'flow']}
          sectionLabels={{
            overview: 'Overview',
            models: 'Models',
            flow: 'Flow',
            users: 'Users',
          }}
          actions={<button type='button'>Filter</button>}
          onSectionChange={() => undefined}
        >
          <div>Charts</div>
        </DashboardAnalyticsLayout>
      )
    })

    const layout = container.querySelector(
      '[data-slot="dashboard-analytics-layout"]'
    )
    const sectionBar = container.querySelector(
      '[data-slot="dashboard-section-bar"]'
    )
    const navigation = container.querySelector('nav[aria-label="Dashboard"]')
    const activeLink = container.querySelector(
      '[data-slot="dashboard-section-link"][data-state="active"]'
    )

    assert.equal(layout?.classList.contains('flex-col'), true)
    assert.equal(sectionBar?.classList.contains('lg:flex-row'), true)
    assert.equal(navigation?.classList.contains('overflow-x-auto'), true)
    assert.equal(navigation?.classList.contains('flex'), true)
    assert.equal(
      container.querySelector('[data-slot="dashboard-analytics-content"]')
        ?.textContent,
      'Charts'
    )
    assert.equal(
      container
        .querySelector('[data-slot="dashboard-section-link"]')
        ?.getAttribute('aria-current'),
      'page'
    )
    assert.equal(activeLink?.classList.contains('bg-muted'), true)
    assert.equal(activeLink?.classList.contains('text-foreground'), true)
    assert.equal(activeLink?.classList.contains('text-primary'), false)
    assert.equal(activeLink?.classList.contains('bg-primary/10'), false)
    assert.equal(
      container.querySelector('[data-slot="dashboard-section-actions"]')
        ?.textContent,
      'Filter'
    )

    await act(async () => root.unmount())
    container.remove()
  })

  test('keeps section switching interactive', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    let selected = 'models'

    await act(async () => {
      root.render(
        <DashboardAnalyticsLayout
          activeSection='models'
          navigationLabel='Dashboard'
          sections={['models', 'flow']}
          sectionLabels={{
            overview: 'Overview',
            models: 'Models',
            flow: 'Flow',
            users: 'Users',
          }}
          onSectionChange={(section) => {
            selected = section
          }}
        >
          <div>Charts</div>
        </DashboardAnalyticsLayout>
      )
    })

    const links = container.querySelectorAll(
      '[data-slot="dashboard-section-link"]'
    )
    await act(async () => {
      links[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    assert.equal(selected, 'flow')

    await act(async () => root.unmount())
    container.remove()
  })
})
