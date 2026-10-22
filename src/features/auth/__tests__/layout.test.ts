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

import { describe, test } from 'vitest'

const authLayout = await readFile(
  resolve(import.meta.dirname, '../auth-layout.tsx'),
  'utf8'
)
const referenceConsoleStyles = await readFile(
  resolve(import.meta.dirname, '../../../styles/reference-console.css'),
  'utf8'
)
const signInForm = await readFile(
  resolve(import.meta.dirname, '../sign-in/components/user-auth-form.tsx'),
  'utf8'
)
const forgotPasswordForm = await readFile(
  resolve(
    import.meta.dirname,
    '../forgot-password/components/forgot-password-form.tsx'
  ),
  'utf8'
)
const legalConsent = await readFile(
  resolve(import.meta.dirname, '../components/legal-consent.tsx'),
  'utf8'
)
const publicFooter = await readFile(
  resolve(
    import.meta.dirname,
    '../../../components/layout/components/footer.tsx'
  ),
  'utf8'
)

describe('authentication page layout', () => {
  test('reuses the same system brand as the public home header', () => {
    assert.match(
      authLayout,
      /import \{ SystemBrand \} from '@\/components\/layout'/
    )
    assert.match(authLayout, /<SystemBrand variant='inline' \/>/)
  })

  test('keeps the form positioned within a fixed viewport-height layout', () => {
    const rootClasses = authLayout.match(
      /className='([^']*\bconsole-auth\b[^']*)'/
    )?.[1]

    assert.ok(rootClasses)
    const classNames = rootClasses.split(/\s+/)
    assert.equal(classNames.includes('h-svh'), true)
    assert.equal(classNames.includes('min-h-svh'), false)
  })

  test('paints the authentication background behind overflowing form content', () => {
    assert.match(
      referenceConsoleStyles,
      /\.console-auth,\s*body:has\(\.console-auth\)\s*\{\s*background:/
    )
  })

  test('centers Turnstile on both sign-in and forgot-password forms', () => {
    const centeredTurnstile =
      /<div className='mt-2 flex justify-center'>\s*<Turnstile/

    assert.match(signInForm, centeredTurnstile)
    assert.match(forgotPasswordForm, centeredTurnstile)
  })

  test('keeps legal consent readable in the mobile form width', () => {
    assert.match(legalConsent, /grid-cols-\[auto_minmax\(0,1fr\)\]/)
    assert.match(legalConsent, /min-w-0[^']*\[overflow-wrap:anywhere\]/)
    assert.match(legalConsent, /className='mt-0\.5 shrink-0'/)
  })

  test('stacks homepage copyright and legal links on mobile', () => {
    assert.match(
      publicFooter,
      /flex min-w-0 flex-col items-center[^']*sm:flex-row/
    )
    assert.match(
      publicFooter,
      /inline-flex max-w-full flex-wrap items-center justify-center/
    )
  })
})
