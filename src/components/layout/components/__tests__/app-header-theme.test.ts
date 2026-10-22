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
  resolve(import.meta.dirname, '../../../../styles/reference-console.css'),
  'utf8'
)
const landingPage = await readFile(
  resolve(import.meta.dirname, '../../../../../public/relay-landing.html'),
  'utf8'
)
const homePage = await readFile(
  resolve(import.meta.dirname, '../../../../features/home/index.tsx'),
  'utf8'
)
const appHeader = await readFile(
  resolve(import.meta.dirname, '../app-header.tsx'),
  'utf8'
)
const style = domWindow.document.createElement('style')
style.textContent = stylesheet
domWindow.document.head.append(style)

describe('app header theme', () => {
  afterAll(() => {
    domWindow.close()
  })

  test('inherits the console foreground color for header controls in dark mode', () => {
    domWindow.document.documentElement.classList.add('dark')

    const shell = domWindow.document.createElement('div')
    shell.className = 'console-theme'

    const header = domWindow.document.createElement('header')
    const button = domWindow.document.createElement('button')
    button.dataset.slot = 'button'
    button.dataset.variant = 'ghost'
    header.append(button)
    shell.append(header)
    domWindow.document.body.append(shell)

    assert.equal(domWindow.getComputedStyle(button).color, '#e8f1fc')
    domWindow.document.documentElement.classList.remove('dark')
  })

  test('uses the grouped public navigation layout', () => {
    const shell = domWindow.document.createElement('div')
    shell.className = 'console-public'

    const header = domWindow.document.createElement('header')
    header.className = 'sticky public-topbar'
    const outer = domWindow.document.createElement('div')
    const inner = domWindow.document.createElement('div')
    const content = domWindow.document.createElement('div')
    const brand = domWindow.document.createElement('div')
    const navigation = domWindow.document.createElement('div')
    const actions = domWindow.document.createElement('div')
    actions.className = 'app-header-actions'
    const iconControl = domWindow.document.createElement('button')
    iconControl.className = 'topbar-icon-control'
    iconControl.dataset.slot = 'dropdown-menu-trigger'
    iconControl.dataset.variant = 'ghost'
    actions.append(iconControl)
    const nav = domWindow.document.createElement('nav')
    const link = domWindow.document.createElement('a')
    link.dataset.active = 'true'
    nav.append(link)
    navigation.append(nav)
    content.append(brand, navigation, actions)
    inner.append(content)
    outer.append(inner)
    header.append(outer)
    shell.append(header)
    domWindow.document.body.append(shell)

    assert.equal(domWindow.getComputedStyle(header).height, '76px')
    assert.equal(domWindow.getComputedStyle(nav).borderRadius, '14px')
    assert.equal(domWindow.getComputedStyle(link).minHeight, '34px')
    assert.equal(domWindow.getComputedStyle(brand).position, 'static')
    assert.equal(domWindow.getComputedStyle(navigation).marginLeft, 'auto')
    assert.equal(domWindow.getComputedStyle(actions).justifyContent, 'flex-end')
    assert.equal(domWindow.getComputedStyle(iconControl).width, '42px')
    assert.equal(domWindow.getComputedStyle(iconControl).height, '38px')
    assert.equal(domWindow.getComputedStyle(iconControl).borderRadius, '11px')
    assert.match(
      stylesheet,
      /\.console-public header\.public-topbar \.app-header-left,[\s\S]*?\.console-public header\.public-topbar \.app-header-actions\s*\{[^}]*translate:\s*none\s*!important;/
    )
  })

  test('sizes the public mobile navigation panel to its content', () => {
    assert.match(
      stylesheet,
      /body\.top-nav-menu-open[\s\S]*?\.console-public[\s\S]*?\.top-nav-mobile-panel\s*\{[^}]*inset:\s*62px 0 auto;[^}]*height:\s*auto;[^}]*max-height:\s*calc\(100dvh - 62px\);/
    )
    assert.match(
      stylesheet,
      /\.console-public header\.public-topbar \.top-nav-mobile-panel\s*\{[^}]*height:\s*auto;[^}]*max-height:\s*calc\(100dvh - 74px\);[^}]*overflow-y:\s*auto;[^}]*padding:\s*10px;/
    )
    assert.match(
      stylesheet,
      /@media \(max-width:\s*767px\)[\s\S]*?\.console-public header\.public-topbar\[data-scrolled='true'\]\s*\{[^}]*backdrop-filter:\s*none\s*!important;/
    )
    assert.match(
      stylesheet,
      /@media \(max-width:\s*767px\)[\s\S]*?\.console-public header\.public-topbar\[data-scrolled='true'\] > div\s*\{[^}]*transform:\s*none;/
    )
    assert.doesNotMatch(
      stylesheet,
      /\.console-public header\.public-topbar \.app-header-center[\s\S]*?translate:\s*0\s*!important;/
    )
    assert.match(
      stylesheet,
      /body\.top-nav-menu-open[\s\S]*?\.console-theme[\s\S]*?\.top-nav-mobile-panel\s*\{[^}]*inset:\s*62px 0 0;/
    )
    assert.match(
      stylesheet,
      /\.console-theme header\.console-topbar \.top-nav-mobile-panel a\s*\{[^}]*min-height:\s*48px;/
    )
  })

  test('aligns the console navigation with the public topbar layout', () => {
    const shell = domWindow.document.createElement('div')
    shell.className = 'console-theme'

    const header = domWindow.document.createElement('header')
    header.className = 'sticky console-topbar'
    const outer = domWindow.document.createElement('div')
    const inner = domWindow.document.createElement('div')
    inner.className = 'app-header-inner'
    const brand = domWindow.document.createElement('div')
    brand.className = 'app-header-left'
    const navigation = domWindow.document.createElement('div')
    navigation.className = 'app-header-center'
    const actions = domWindow.document.createElement('div')
    actions.className = 'app-header-actions'
    inner.append(brand, navigation, actions)
    outer.append(inner)
    header.append(outer)
    shell.append(header)
    domWindow.document.body.append(shell)

    assert.equal(domWindow.getComputedStyle(header).height, '62px')
    assert.match(
      stylesheet,
      /\.console-theme header\.console-topbar > div\s*{[^}]*padding-inline:\s*24px;/
    )
    assert.equal(domWindow.getComputedStyle(brand).position, 'static')
    assert.equal(domWindow.getComputedStyle(navigation).marginLeft, 'auto')
    assert.equal(domWindow.getComputedStyle(actions).justifyContent, 'flex-end')
  })

  test('keeps the configured console link in primary navigation for every authentication state', () => {
    assert.match(appHeader, /<TopNav links=\{links\}/)
    assert.doesNotMatch(appHeader, /links\.filter/)
    assert.doesNotMatch(appHeader, /app-console-link/)
  })

  test('provides a mobile trigger for the authenticated sidebar', () => {
    assert.match(appHeader, /consoleMode\s*&&\s*\(/)
    assert.match(
      appHeader,
      /<SidebarTrigger[\s\S]*?className='console-sidebar-trigger topbar-icon-control md:hidden'/
    )
  })

  test('caps the public topbar content at 1480px on wide screens', () => {
    assert.match(stylesheet, /--public-topbar-content-width:\s*1480px;/)
    assert.match(
      stylesheet,
      /padding-inline:\s*max\(\s*20px,\s*calc\(\(100% - var\(--public-topbar-content-width\)\) \/ 2\)\s*\);/
    )
  })

  test('uses the same 1480px content width on the landing page', () => {
    assert.match(
      landingPage,
      /\.shell\s*\{\s*width:\s*min\(1480px,\s*calc\(100% - 48px\)\);/
    )
  })

  test('matches the target scroll-state topbar contract', () => {
    const shell = domWindow.document.createElement('div')
    shell.className = 'console-public'

    const header = domWindow.document.createElement('header')
    header.className = 'public-topbar home-topbar'
    header.dataset.scrolled = 'true'
    const outer = domWindow.document.createElement('div')
    const inner = domWindow.document.createElement('div')
    inner.className = 'app-header-inner'
    const left = domWindow.document.createElement('div')
    left.className = 'app-header-left'
    const center = domWindow.document.createElement('div')
    center.className = 'app-header-center'
    const actions = domWindow.document.createElement('div')
    actions.className = 'app-header-actions'
    const nav = domWindow.document.createElement('nav')
    const link = domWindow.document.createElement('a')
    link.setAttribute('aria-current', 'page')
    nav.append(link)
    center.append(nav)
    inner.append(left, center, actions)
    outer.append(inner)
    header.append(outer)
    shell.append(header)
    domWindow.document.body.append(shell)

    const computedHeader = domWindow.getComputedStyle(header)
    assert.equal(computedHeader.position, 'fixed')
    assert.equal(computedHeader.height, '62px')
    assert.equal(computedHeader.minHeight, '62px')
    assert.match(computedHeader.transition, /height/)
    assert.match(computedHeader.transition, /min-height/)
    assert.match(computedHeader.boxShadow, /12px 36px/)
    assert.equal(computedHeader.backgroundColor, 'rgba(245, 248, 252, 0.88)')
    assert.equal(domWindow.getComputedStyle(nav).borderRadius, '14px')
    assert.equal(domWindow.getComputedStyle(link).minHeight, '34px')
    assert.match(
      stylesheet,
      /header\.public-topbar\[data-scrolled='true'\][\s\S]*?\.app-header-brand\s*> div\s*\{[^}]*transform:\s*scale\(0\.88\);/
    )
    assert.match(
      stylesheet,
      /header\.public-topbar\[data-scrolled='true'\][\s\S]*?\.app-header-wordmark-image\s*\{[^}]*transform:\s*scale\(0\.88\);/
    )
    assert.match(
      stylesheet,
      /header\.public-topbar\[data-scrolled='true'\][\s\S]*?nav:not\(\.top-nav-mobile-panel\)\s*\{[^}]*transform:\s*translateY\(-1px\);/
    )
  })

  test('matches the reference topbar height and padding transitions', () => {
    assert.match(
      stylesheet,
      /\.console-public header\.public-topbar\s*\{[^}]*height:\s*76px;[^}]*min-height:\s*76px;/
    )
    assert.match(
      stylesheet,
      /\.console-public header\.public-topbar > div\s*\{[^}]*padding-block:\s*14px;/
    )
    assert.match(
      stylesheet,
      /\.console-public header\.public-topbar\[data-scrolled='true'\] > div\s*\{[^}]*padding-block:\s*8px;/
    )
    assert.match(
      stylesheet,
      /@media \(max-width:\s*767px\)[\s\S]*?\.console-public header\.public-topbar\s*\{[^}]*height:\s*68px;[^}]*min-height:\s*68px;/
    )
    assert.match(
      stylesheet,
      /@media \(max-width:\s*767px\)[\s\S]*?\.console-public header\.public-topbar > div\s*\{[^}]*padding-block:\s*12px;[^}]*padding-inline:\s*18px;/
    )
  })

  test('uses the reference landing palette for the home topbar in dark mode', () => {
    assert.match(
      stylesheet,
      /\.dark \.console-public header\.public-topbar\.home-topbar\s*{[\s\S]*?--console-page:\s*#0b1625;/
    )
    assert.match(
      stylesheet,
      /\.dark \.console-public header\.public-topbar\.home-topbar\s*{[\s\S]*?--console-topbar-scrolled-bg:\s*rgba\(11, 22, 37, 0\.88\);/
    )
  })

  test('synchronizes the resolved app theme with the landing iframe', () => {
    assert.match(homePage, /const \{ resolvedTheme \} = useTheme\(\)/)
    assert.match(homePage, /type:\s*'relay-theme'/)
    assert.match(homePage, /theme:\s*resolvedTheme/)
    assert.match(homePage, /onLoad=\{syncLandingPreferences\}/)
    assert.match(landingPage, /event\.source !== window\.parent/)
    assert.match(landingPage, /event\.data\?\.type !== 'relay-theme'/)
    assert.match(landingPage, /document\.body\.dataset\.theme = theme/)
  })

  test('shares the main site font and locale with the landing iframe', () => {
    assert.match(stylesheet, /font-family:\s*var\(--font-body\);/)
    assert.match(homePage, /siteFontUrl/)
    assert.match(homePage, /toLandingLanguage/)
    assert.match(homePage, /language:\s*landingLanguage/)
    assert.match(homePage, /fontUrl:\s*siteFontUrl/)
    assert.match(landingPage, /document\.documentElement\.lang = language/)
    assert.match(landingPage, /--site-font:\s*'Maple Mono CN'/)
    assert.match(landingPage, /const applyParentFont = \(fontUrl\) =>/)
    assert.match(landingPage, /applyParentFont\(event\.data\.fontUrl\)/)
    assert.doesNotMatch(landingPage, /:root:lang\((?:zh-TW|ja)\)/)
  })
})
