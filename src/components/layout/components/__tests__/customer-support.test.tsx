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
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { PublicLegalFooter } from '../public-legal-footer'

test('opens the shared support widget from the footer with keyboard activation', async () => {
  let opened = false
  vi.stubGlobal('Cloudbridge', {
    open: async () => {
      opened = true
    },
    status: () => ({ open: opened }),
  })

  try {
    render(<PublicLegalFooter />)
    const contact = screen.getByRole('button', { name: 'footer.contactAria' })
    contact.focus()
    await userEvent.keyboard('{Enter}')
    expect(opened).toBe(true)
    expect(screen.getAllByRole('link')).toHaveLength(6)
  } finally {
    vi.unstubAllGlobals()
  }
})
