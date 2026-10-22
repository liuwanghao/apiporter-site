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

import { Window } from 'happy-dom'
import { afterAll as after, afterEach, describe, test } from 'vitest'

const domWindow = new Window()
const domGlobals = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'HTMLButtonElement',
  'HTMLInputElement',
  'HTMLLabelElement',
  'SVGElement',
  'Node',
  'Element',
  'Event',
  'CustomEvent',
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

const React = await import('react')
const { act, useState } = React
const { createRoot } = await import('react-dom/client')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { LegalConsent } = await import('./legal-consent')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'ja',
  resources: {
    ja: {
      translation: {
        'I have read and agree to the': '私は以下を読み、同意します',
        'User Agreement': 'ユーザー利用規約',
        and: 'および',
        'Privacy Policy': 'プライバシーポリシー',
      },
    },
  },
})

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  document.body.replaceChildren()
})

after(() => {
  domWindow.close()
})

describe('legal consent', () => {
  test('shows a required checkbox with both legal document links', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    function Harness() {
      const [checked, setChecked] = useState(false)
      return (
        <I18nextProvider i18n={i18n}>
          <LegalConsent checked={checked} onCheckedChange={setChecked} />
        </I18nextProvider>
      )
    }

    await act(async () => root.render(<Harness />))

    const checkbox = container.querySelector<HTMLElement>('[role="checkbox"]')
    const links = [...container.querySelectorAll<HTMLAnchorElement>('a')]

    assert.ok(checkbox)
    assert.equal(checkbox.getAttribute('aria-required'), 'true')
    assert.equal(checkbox.getAttribute('aria-checked'), 'false')
    assert.match(
      container.textContent,
      /ユーザー利用規約 および プライバシーポリシー/
    )
    assert.deepEqual(
      links.map((link) => link.getAttribute('href')),
      ['/pfd/用戶協議_V1.0.pdf', '/pfd/隱私政策_V1.0.pdf']
    )
    assert.ok(links.every(({ target }) => target === '_blank'))
    assert.ok(
      links.every(
        ({ rel }) => rel.includes('noopener') && rel.includes('noreferrer')
      )
    )

    await act(async () => links[0].click())
    assert.equal(checkbox.getAttribute('aria-checked'), 'false')

    await act(async () => checkbox.click())
    assert.equal(checkbox.getAttribute('aria-checked'), 'true')

    await act(async () => root.unmount())
  })

  test('always shows both legal links without system configuration', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () =>
      root.render(
        <I18nextProvider i18n={i18n}>
          <LegalConsent checked={false} onCheckedChange={() => {}} />
        </I18nextProvider>
      )
    )

    assert.deepEqual(
      [...container.querySelectorAll('a')].map((link) =>
        link.getAttribute('href')
      ),
      ['/pfd/用戶協議_V1.0.pdf', '/pfd/隱私政策_V1.0.pdf']
    )
    assert.match(
      container.textContent,
      /ユーザー利用規約 および プライバシーポリシー/
    )

    await act(async () => root.unmount())
  })

  test('renders unchecked by default', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () =>
      root.render(
        <I18nextProvider i18n={i18n}>
          <LegalConsent checked={false} onCheckedChange={() => {}} />
        </I18nextProvider>
      )
    )

    assert.equal(
      container
        .querySelector('[role="checkbox"]')
        ?.getAttribute('aria-checked'),
      'false'
    )

    await act(async () => root.unmount())
  })
})
