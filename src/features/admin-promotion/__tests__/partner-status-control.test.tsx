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

import { describe, test } from 'vitest'

const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { PartnerStatusControl } = await import('../partner-status-control')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        'Pause partnership': 'Pause partnership',
        Off: 'Off',
        On: 'On',
        'Resume partnership': 'Resume partnership',
      },
    },
  },
})

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

describe('partner status control', () => {
  test('shows the current status and requests a pause from the active state', async () => {
    const requestedStates: boolean[] = []
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () =>
      root.render(
        <I18nextProvider i18n={i18n}>
          <PartnerStatusControl
            active
            onChange={(active) => requestedStates.push(active)}
          />
        </I18nextProvider>
      )
    )

    const statusSwitch =
      container.querySelector<HTMLButtonElement>('[role="switch"]')
    assert.ok(statusSwitch)
    assert.equal(statusSwitch.getAttribute('aria-checked'), 'true')
    assert.equal(statusSwitch.getAttribute('aria-label'), 'Pause partnership')
    assert.equal(statusSwitch.closest('[data-slot="badge"]'), null)
    assert.equal(
      statusSwitch.querySelector('[data-slot="switch-checked-label"]')
        ?.textContent,
      'On'
    )
    assert.equal(
      statusSwitch.querySelector('[data-slot="switch-unchecked-label"]')
        ?.textContent,
      'Off'
    )

    await act(async () => statusSwitch.click())
    assert.deepEqual(requestedStates, [false])

    await act(async () => root.unmount())
    container.remove()
  })

  test('exposes a disabled resume control while a status update is pending', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () =>
      root.render(
        <I18nextProvider i18n={i18n}>
          <PartnerStatusControl active={false} disabled onChange={() => {}} />
        </I18nextProvider>
      )
    )

    const statusSwitch =
      container.querySelector<HTMLButtonElement>('[role="switch"]')
    assert.ok(statusSwitch)
    assert.equal(statusSwitch.getAttribute('aria-checked'), 'false')
    assert.equal(statusSwitch.getAttribute('aria-label'), 'Resume partnership')
    assert.equal(statusSwitch.hasAttribute('data-disabled'), true)
    assert.equal(
      statusSwitch.querySelector('[data-slot="switch-unchecked-label"]')
        ?.textContent,
      'Off'
    )

    await act(async () => root.unmount())
    container.remove()
  })
})
