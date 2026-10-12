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
for (const [key, value] of Object.entries({
  window: domWindow,
  document: domWindow.document,
  navigator: domWindow.navigator,
  HTMLElement: domWindow.HTMLElement,
  SVGElement: domWindow.SVGElement,
  Node: domWindow.Node,
  Element: domWindow.Element,
  Event: domWindow.Event,
  MutationObserver: domWindow.MutationObserver,
})) {
  Object.defineProperty(globalThis, key, { configurable: true, value })
}

const React = await import('react')
const { act } = React
Object.defineProperty(globalThis, 'React', { configurable: true, value: React })
const { createRoot } = await import('react-dom/client')
const { ProfileWorkspaceLayout } = await import('../profile-workspace-layout')

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true,
})

function slot(name: string) {
  return <section data-test-slot={name}>{name}</section>
}

describe('profile workspace layout', () => {
  after(() => domWindow.close())

  test('keeps profile content in the main column and personal settings in the right rail', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <ProfileWorkspaceLayout
          accountSettings={slot('account-settings')}
          languagePreferences={slot('language-preferences')}
          securityActions={slot('security-actions')}
          passkey={slot('passkey')}
          twoFactor={slot('two-factor')}
          checkin={slot('checkin')}
          sidebar={slot('sidebar')}
          sessions={slot('sessions')}
        />
      )
    })

    const workspace = container.querySelector('[data-profile-workspace]')
    const shell = container.querySelector('[data-profile-shell]')
    const primary = container.querySelector('[data-profile-primary]')
    const settingsRail = container.querySelector('[data-profile-settings-rail]')
    const strongAuthGrid = container.querySelector(
      '[data-profile-strong-auth-grid]'
    )
    const passkey = container.querySelector('[data-profile-passkey]')
    const twoFactor = container.querySelector('[data-profile-two-factor]')
    const checkin = container.querySelector('[data-profile-checkin]')
    const sidebar = container.querySelector('[data-profile-sidebar]')
    const sessions = container.querySelector('[data-profile-sessions]')

    assert.ok(workspace)
    assert.ok(shell)
    assert.equal(
      shell.classList.contains(
        'xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]'
      ),
      true
    )
    assert.ok(primary)
    assert.ok(settingsRail)
    assert.equal(
      settingsRail.querySelector('[data-profile-language-preferences]')
        ?.nextElementSibling,
      settingsRail.querySelector('[data-profile-security-actions]')
    )
    assert.equal(
      settingsRail.querySelector('[data-profile-security-actions]')
        ?.nextElementSibling,
      sidebar
    )
    assert.ok(strongAuthGrid)
    assert.equal(strongAuthGrid.classList.contains('lg:grid-cols-2'), true)
    assert.equal(strongAuthGrid.classList.contains('lg:items-stretch'), true)
    assert.ok(passkey)
    assert.ok(twoFactor)
    for (const cardSlot of [passkey, twoFactor]) {
      assert.equal(cardSlot.classList.contains('lg:h-full'), true)
      assert.equal(cardSlot.classList.contains('lg:[&>*]:h-full'), true)
    }
    assert.ok(checkin)
    assert.equal(primary.contains(checkin), true)
    assert.ok(sidebar)
    assert.equal(settingsRail.contains(sidebar), true)
    assert.equal(primary.contains(sidebar), false)
    assert.ok(sessions)
    assert.equal(primary.contains(sessions), true)

    await act(async () => root.unmount())
    container.remove()
  })

  test('keeps the right settings rail intact when optional modules are unavailable', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <ProfileWorkspaceLayout
          accountSettings={slot('account-settings')}
          languagePreferences={slot('language-preferences')}
          securityActions={slot('security-actions')}
          passkey={slot('passkey')}
          twoFactor={slot('two-factor')}
          sessions={slot('sessions')}
        />
      )
    })

    const primary = container.querySelector('[data-profile-primary]')
    const settingsRail = container.querySelector('[data-profile-settings-rail]')
    const sidebar = container.querySelector('[data-profile-sidebar]')
    const checkin = container.querySelector('[data-profile-checkin]')
    assert.ok(primary)
    assert.ok(settingsRail)
    assert.equal(sidebar, null)
    assert.equal(checkin, null)
    assert.ok(settingsRail.querySelector('[data-profile-language-preferences]'))
    assert.ok(settingsRail.querySelector('[data-profile-security-actions]'))

    await act(async () => root.unmount())
    container.remove()
  })
})
