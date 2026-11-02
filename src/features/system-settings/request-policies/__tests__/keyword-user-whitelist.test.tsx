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
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Form, FormField } from '@/components/ui/form'
import { api } from '@/lib/api'

import { KeywordUserWhitelist } from '../keyword-user-whitelist'

let client: QueryClient
const alice = {
  id: 12,
  username: 'alice',
  display_name: 'Alice Example',
  email: 'alice@example.com',
}
const bob = {
  id: 34,
  username: 'bob',
  display_name: 'Bob Example',
  email: 'bob@example.com',
}

function Fixture(props: { initial?: string }) {
  const form = useForm({ defaultValues: { whitelist: props.initial ?? '' } })
  return (
    <QueryClientProvider client={client}>
      <Form {...form}>
        <FormField
          control={form.control}
          name='whitelist'
          render={({ field }) => (
            <KeywordUserWhitelist
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <output aria-label='Saved whitelist IDs'>
          {form.watch('whitelist')}
        </output>
      </Form>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    if (url === '/api/user/12') return { data: { success: true, data: alice } }
    if (url === '/api/user/34') return { data: { success: true, data: bob } }
    const params = new URL(url, 'http://localhost').searchParams
    const keyword = params.get('keyword') ?? ''
    return {
      data: {
        success: true,
        data: {
          items: [alice, bob].filter((user) =>
            `${user.username} ${user.display_name} ${user.email} ${user.id}`
              .toLowerCase()
              .includes(keyword.toLowerCase())
          ),
          total: 2,
        },
      },
    }
  })
})

afterEach(() => {
  cleanup()
  client.clear()
})

describe('keyword filtering user whitelist picker', () => {
  it('aligns the dropdown to the search field and caps its width on wide screens', async () => {
    render(<Fixture />)
    await userEvent.type(screen.getByRole('combobox'), 'ali')
    const popup = (
      await screen.findByRole('option', { name: /alice/ })
    ).closest('[data-slot="combobox-content"]')
    expect(popup).toHaveAttribute('data-chips', 'true')
    expect(popup).toHaveClass(
      'w-[min(var(--anchor-width),24rem)]',
      'min-w-0',
      'data-[chips=true]:min-w-0'
    )
  })

  it('loads saved IDs as named users and allows removing an unavailable user', async () => {
    vi.mocked(api.get).mockImplementation(async (url) => ({
      data:
        url === '/api/user/12'
          ? { success: true, data: alice }
          : { success: false, message: 'User no longer exists' },
    }))
    render(<Fixture initial={'12\n99'} />)
    const list = screen.getByRole('list', { name: 'Whitelisted users' })
    expect(await within(list).findByText('alice')).toBeVisible()
    expect(await within(list).findByText('User unavailable')).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove user 99 from whitelist' })
    )
    expect(screen.getByLabelText('Saved whitelist IDs')).toHaveTextContent('12')
    expect(
      screen.queryByRole('button', { name: 'Remove user 99 from whitelist' })
    ).not.toBeInTheDocument()
  })

  it('uses fuzzy server search and keyboard selection to append a user without duplicates', async () => {
    render(<Fixture />)
    expect(screen.getByText('No whitelisted users')).toBeVisible()
    expect(api.get).not.toHaveBeenCalled()
    const search = screen.getByRole('combobox', {
      name: 'Keyword filtering user whitelist',
    })
    await userEvent.type(search, 'example.com')
    expect(await screen.findByRole('option', { name: /alice/ })).toBeVisible()
    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining('keyword=example.com')
    )
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(
      screen.getByRole('button', { name: 'Remove user 12 from whitelist' })
    ).toBeVisible()
    expect(search).toHaveValue('')
    await userEvent.type(search, 'alice')
    expect(await screen.findByText('No matching users')).toBeVisible()
    expect(
      screen.queryByRole('option', { name: /alice/ })
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Saved whitelist IDs')).toHaveTextContent(
      /^12$/
    )
  })

  it('keeps current selections when search fails and supports retrying', async () => {
    let failed = true
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === '/api/user/12') {
        return { data: { success: true, data: alice } }
      }
      return {
        data: failed
          ? { success: false, message: 'Search unavailable' }
          : { success: true, data: { items: [bob], total: 1 } },
      }
    })
    render(<Fixture initial='12' />)
    await userEvent.type(screen.getByRole('combobox'), 'bob')
    expect(await screen.findByText('Failed to search users')).toBeVisible()
    expect(screen.getByLabelText('Saved whitelist IDs')).toHaveTextContent('12')
    failed = false
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await userEvent.click(await screen.findByRole('option', { name: /bob/ }))
    expect(screen.getByLabelText('Saved whitelist IDs')).toHaveTextContent(
      '12 34'
    )
  })

  it('loads additional search results before selecting a user from a later page', async () => {
    vi.mocked(api.get).mockImplementation(async (url) => {
      const page = new URL(url, 'http://localhost').searchParams.get('p')
      return {
        data: {
          success: true,
          data: { items: page === '2' ? [bob] : [alice], total: 21 },
        },
      }
    })
    render(<Fixture />)
    await userEvent.type(screen.getByRole('combobox'), 'example')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Load more' })
    )
    await userEvent.click(await screen.findByRole('option', { name: /bob/ }))
    expect(screen.getByLabelText('Saved whitelist IDs')).toHaveTextContent('34')
  })

  it('clearing the last user restores the empty state and serializes an empty whitelist', async () => {
    render(<Fixture initial='12' />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove user 12 from whitelist' })
    )
    await waitFor(() =>
      expect(screen.getByText('No whitelisted users')).toBeVisible()
    )
    expect(screen.getByLabelText('Saved whitelist IDs')).toBeEmptyDOMElement()
  })

  it('ignores a late response from an older search term', async () => {
    let resolveEarlier: (response: {
      data: {
        success: boolean
        data: { items: (typeof alice)[]; total: number }
      }
    }) => void = () => undefined
    vi.mocked(api.get).mockImplementation(async (url) => {
      const keyword = new URL(url, 'http://localhost').searchParams.get(
        'keyword'
      )
      if (keyword === 'ali') {
        return new Promise((resolve) => {
          resolveEarlier = resolve
        })
      }
      return { data: { success: true, data: { items: [bob], total: 1 } } }
    })
    render(<Fixture />)
    const search = screen.getByRole('combobox')
    await userEvent.type(search, 'ali')
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('keyword=ali')
      )
    )
    await userEvent.clear(search)
    await userEvent.type(search, 'bob')
    expect(await screen.findByRole('option', { name: /bob/ })).toBeVisible()
    await act(async () =>
      resolveEarlier({
        data: { success: true, data: { items: [alice], total: 1 } },
      })
    )
    expect(
      screen.queryByRole('option', { name: /alice/ })
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('option', { name: /bob/ }))
    expect(screen.getByLabelText('Saved whitelist IDs')).toHaveTextContent(
      /^34$/
    )
  })
})
