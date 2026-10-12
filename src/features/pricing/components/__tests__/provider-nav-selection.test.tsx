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

const domWindow = new Window()
const domGlobals = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'HTMLButtonElement',
  'SVGElement',
  'Node',
  'Element',
  'Event',
  'CustomEvent',
  'customElements',
  'MutationObserver',
  'ResizeObserver',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'getComputedStyle',
] as const

for (const key of domGlobals) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: domWindow[key],
  })
}

Object.defineProperty(globalThis, 'matchMedia', {
  configurable: true,
  value: domWindow.matchMedia.bind(domWindow),
})

const React = await import('react')
const { act, useState } = React
const { createRoot } = await import('react-dom/client')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { ProviderNav } = await import('../provider-nav')
const { FILTER_ALL } = await import('../../constants')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        'All providers': 'All providers',
        'Available routes': 'Available routes',
        'Catalog coverage': 'Catalog coverage',
        Collapse: 'Collapse',
        Expand: 'Expand',
        'Model providers': 'Model providers',
        Pricing: 'Pricing',
        Provider: 'Provider',
        models: 'models',
      },
    },
  },
})

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

const vendors = [
  { id: 1, name: 'OpenAI' },
  { id: 2, name: 'Anthropic' },
]

const models = [
  {
    id: 1,
    model_name: 'gpt-4.1',
    vendor_id: 1,
    vendor_name: 'OpenAI',
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 4,
    enable_groups: ['default'],
  },
  {
    id: 2,
    model_name: 'claude-sonnet',
    vendor_id: 2,
    vendor_name: 'Anthropic',
    quota_type: 0,
    model_ratio: 1.5,
    completion_ratio: 5,
    enable_groups: ['default'],
  },
]

function ProviderNavHarness() {
  const [provider, setProvider] = useState(FILTER_ALL)
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null
  )

  return (
    <ProviderNav
      vendors={vendors}
      models={models}
      value={provider}
      onChange={setProvider}
      onModelClick={setSelectedModelName}
      selectedModelName={selectedModelName}
    />
  )
}

describe('provider navigation selection', () => {
  after(() => {
    domWindow.close()
  })

  test('keeps providers switchable and exposes the selected model state', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () =>
      root.render(
        <I18nextProvider i18n={i18n}>
          <ProviderNavHarness />
        </I18nextProvider>
      )
    )

    const providerButtons = [
      ...container.querySelectorAll<HTMLButtonElement>(
        '.console-provider-group'
      ),
    ]
    const anthropicButton = providerButtons.find((button) =>
      button.textContent?.includes('Anthropic')
    )
    assert.ok(anthropicButton)

    await act(async () => anthropicButton.click())
    assert.equal(anthropicButton.getAttribute('aria-pressed'), 'true')
    assert.equal(
      providerButtons.some((button) => button.textContent?.includes('OpenAI')),
      true
    )

    const modelCode = [...container.querySelectorAll('code')].find(
      (code) => code.textContent === 'claude-sonnet'
    )
    const modelButton = modelCode?.closest('button')
    assert.ok(modelButton)

    await act(async () => modelButton.click())
    assert.equal(modelButton.getAttribute('aria-pressed'), 'true')

    await act(async () => root.unmount())
    container.remove()
  })
})
