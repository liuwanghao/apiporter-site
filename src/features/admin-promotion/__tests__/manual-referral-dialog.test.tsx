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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AxiosResponse } from 'axios'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { api } from '@/lib/api'

import { ManualReferralDialog } from '../manual-referral-dialog'

const users = [
  {
    id: 12,
    username: 'alice',
    display_name: 'Alice',
    email: 'alice@example.com',
  },
  { id: 34, username: 'bob', display_name: 'Bob', email: 'bob@example.com' },
]

function renderDialog() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const onSubmit = vi.fn(async () => true)
  render(
    <QueryClientProvider client={client}>
      <ManualReferralDialog
        open
        isPending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />
    </QueryClientProvider>
  )
  return { onSubmit, client }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('manual referral user search', () => {
  test('editing a selected user clears its ID until another result is selected', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (url) => {
      const keyword =
        new URL(url, 'https://example.test').searchParams.get('keyword') ?? ''
      return {
        data: {
          success: true,
          data: {
            items: users.filter((user) => user.username.includes(keyword)),
            total: users.length,
          },
        },
      } as AxiosResponse
    })
    const { onSubmit, client } = renderDialog()
    const user = userEvent.setup()
    const inviter = screen.getByRole('combobox', { name: 'Inviter user ID' })
    const invitee = screen.getByRole('combobox', { name: 'Invitee user ID' })

    await user.type(inviter, 'alice')
    await user.click(await screen.findByRole('option', { name: /alice · #12/ }))
    await user.type(invitee, 'bob')
    await user.click(await screen.findByRole('option', { name: /bob · #34/ }))
    await user.type(inviter, 'unknown')
    expect(screen.queryByText('alice · #12')).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Create relation' }))
    expect(onSubmit).not.toHaveBeenCalled()
    client.clear()
  })

  test('a failed user search offers retry and keeps the form unsubmitted', async () => {
    let unavailable = true
    vi.spyOn(api, 'get').mockImplementation(
      async () =>
        ({
          data: unavailable
            ? { success: false, message: 'Search unavailable' }
            : { success: true, data: { items: [users[0]], total: 1 } },
        }) as AxiosResponse
    )
    const { onSubmit, client } = renderDialog()
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('combobox', { name: 'Inviter user ID' }),
      'alice'
    )
    expect(await screen.findByText('Failed to search users')).toBeVisible()
    expect(onSubmit).not.toHaveBeenCalled()

    unavailable = false
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await user.click(await screen.findByRole('option', { name: /alice · #12/ }))
    expect(screen.getByText('alice · #12')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Create relation' }))
    expect(onSubmit).not.toHaveBeenCalled()
    client.clear()
  })
})
