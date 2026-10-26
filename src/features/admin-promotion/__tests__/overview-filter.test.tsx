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
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AxiosResponse } from 'axios'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { api } from '@/lib/api'

import { AdminPromotion } from '../index'

const summaryUrl = '/api/admin/promotion/commission/summary'
const summaries = {
  all: {
    invitee_count: 12,
    consumption_amount: 12000000,
    estimated_amount: 1200000,
    confirmed_amount: 2400000,
    settled_amount: 3600000,
    paid_amount: 4800000,
    reversal_amount: -600000,
  },
  selected: {
    invitee_count: 3,
    consumption_amount: 3000000,
    estimated_amount: 300000,
    confirmed_amount: 600000,
    settled_amount: 900000,
    paid_amount: 1200000,
    reversal_amount: -150000,
  },
}

function setupRequests(selectedResponse?: Promise<AxiosResponse>) {
  return vi.spyOn(api, 'get').mockImplementation(async (url, config) => {
    if (url === summaryUrl) {
      if (config?.params?.inviter_user_id === 42 && selectedResponse) {
        return selectedResponse
      }
      const data =
        config?.params?.inviter_user_id === 42
          ? summaries.selected
          : summaries.all
      return { data: { success: true, data } } as AxiosResponse
    }
    if (url === '/api/user/') {
      return {
        data: {
          success: true,
          data: {
            items:
              config?.params?.p === 1
                ? [
                    {
                      id: 42,
                      username: 'partner-alice',
                      display_name: 'Alice Example',
                      email: 'alice@example.com',
                    },
                  ]
                : [
                    {
                      id: 77,
                      username: 'ordinary-bob',
                      display_name: 'Bob',
                      email: 'bob@example.com',
                    },
                  ],
            total: 2,
            page: config?.params?.p,
            page_size: 1,
          },
        },
      } as AxiosResponse
    }
    return {
      data: { success: true, data: { items: [], total: 0 } },
    } as AxiosResponse
  })
}

function renderPromotion() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <AdminPromotion />
    </QueryClientProvider>
  )
  return { client, ...view }
}

async function selectPromoter() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('combobox', { name: 'Promotion Partner' }))
  await user.type(
    screen.getByPlaceholderText('Search by username, name, email, or ID'),
    'alice'
  )
  await user.click(await screen.findByRole('option', { name: /partner-alice/ }))
  return user
}

function metricValue(label: string) {
  const metric = screen.getByText(label).parentElement
  if (!metric) throw new Error(`Missing metric: ${label}`)
  return within(metric).getAllByRole('paragraph')[1].textContent
}

afterEach(() => vi.restoreAllMocks())

describe('promotion overview inviter filter', () => {
  test('opening the dropdown loads every page without typing and searches locally across user fields', async () => {
    const requests = setupRequests()
    renderPromotion()
    await screen.findByText('12')
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('combobox', { name: 'Promotion Partner' })
    )
    await screen.findByRole('option', { name: /partner-alice/ })
    expect(
      screen.getByRole('option', { name: /ordinary-bob/ })
    ).toBeInTheDocument()
    expect(requests).toHaveBeenCalledWith('/api/user/', {
      params: { p: 2, page_size: 100, sort_by: 'id', sort_order: 'asc' },
    })
    const callsBeforeSearch = requests.mock.calls.length
    const search = screen.getByPlaceholderText(
      'Search by username, name, email, or ID'
    )
    for (const term of [
      'partner-alice',
      'ALICE EXAMPLE',
      'alice@example.com',
      '42',
    ]) {
      await user.clear(search)
      await user.paste(term)
      expect(
        screen.getByRole('option', { name: /partner-alice/ })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('option', { name: /ordinary-bob/ })
      ).not.toBeInTheDocument()
    }
    await user.clear(search)
    await user.paste('no-such-user')
    expect(screen.getByText('No users found')).toBeInTheDocument()
    await user.clear(search)
    expect(
      screen.getByRole('option', { name: /ordinary-bob/ })
    ).toBeInTheDocument()
    expect(requests.mock.calls).toHaveLength(callsBeforeSearch)
    await user.type(search, '77')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(
      screen.getByRole('combobox', { name: 'Promotion Partner' })
    ).toHaveTextContent('ordinary-bob (#77)')
    await waitFor(() =>
      expect(requests).toHaveBeenCalledWith(summaryUrl, {
        params: { inviter_user_id: 77 },
      })
    )
  })

  test('an empty user list shows the empty state as soon as the dropdown opens', async () => {
    const requests = setupRequests()
    requests.mockImplementation(async (url) => {
      if (url === summaryUrl) {
        return { data: { success: true, data: summaries.all } } as AxiosResponse
      }
      return {
        data: { success: true, data: { items: [], total: 0 } },
      } as AxiosResponse
    })
    renderPromotion()
    await screen.findByText('12')
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Promotion Partner' })
    )
    expect(await screen.findByText('No users found')).toBeInTheDocument()
  })

  test('a failed user page shows retry and does not expose an incomplete list', async () => {
    const requests = setupRequests()
    const normalRequest = requests.getMockImplementation()
    if (!normalRequest) throw new Error('Missing request fixture')
    requests.mockImplementation(async (url, config) => {
      if (url === '/api/user/' && config?.params?.p === 2) {
        return {
          data: { success: false, message: 'user list unavailable' },
        } as AxiosResponse
      }
      return normalRequest(url, config)
    })
    renderPromotion()
    await screen.findByText('12')
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('combobox', { name: 'Promotion Partner' })
    )
    const retry = await screen.findByRole('button', { name: 'Retry' })
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    requests.mockImplementation(normalRequest)
    await user.click(retry)
    expect(
      await screen.findByRole('option', { name: /ordinary-bob/ })
    ).toBeInTheDocument()
  })

  test('selecting a promoter updates every metric and clearing restores the global overview', async () => {
    const requests = setupRequests()
    renderPromotion()
    await screen.findByText('12')
    const labels = [
      'Invited users',
      'Consumption amount',
      'Estimated',
      'Confirmed',
      'Settled',
      'Paid',
      'Reversals',
    ]
    const globalValues = labels.map(metricValue)
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()

    const user = await selectPromoter()
    await screen.findByText('3')
    expect(requests).toHaveBeenCalledWith(summaryUrl, {
      params: { inviter_user_id: 42 },
    })
    for (const [index, label] of labels.entries()) {
      expect(metricValue(label)).not.toBe(globalValues[index])
    }
    expect(
      screen.getByRole('combobox', { name: 'Promotion Partner' })
    ).toHaveTextContent('partner-alice (#42)')

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    await screen.findByText('12')
    expect(labels.map(metricValue)).toEqual(globalValues)
    expect(
      screen.getByRole('combobox', { name: 'Promotion Partner' })
    ).toHaveTextContent('All users')
  })

  test('a pending promoter lookup hides previous totals and ignores the late result after clearing', async () => {
    let resolveSelected!: (response: AxiosResponse) => void
    const pending = new Promise<AxiosResponse>((resolve) => {
      resolveSelected = resolve
    })
    setupRequests(pending)
    renderPromotion()
    await screen.findByText('12')
    const user = await selectPromoter()
    expect(screen.queryByText('12')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    await screen.findByText('12')
    resolveSelected({
      data: { success: true, data: summaries.selected },
    } as AxiosResponse)
    await waitFor(() => expect(screen.queryByText('3')).not.toBeInTheDocument())
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  test('a failed selected summary shows an error and retry instead of zero totals', async () => {
    setupRequests(
      Promise.resolve({
        data: { success: false, message: 'summary unavailable' },
      } as AxiosResponse)
    )
    renderPromotion()
    await screen.findByText('12')
    await selectPromoter()
    expect(
      await screen.findByRole('button', { name: 'Retry' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Consumption amount')).not.toBeInTheDocument()
  })

  test('a promoter with no records displays zero totals', async () => {
    const empty = Object.fromEntries(
      Object.keys(summaries.all).map((key) => [key, 0])
    )
    setupRequests(
      Promise.resolve({ data: { success: true, data: empty } } as AxiosResponse)
    )
    renderPromotion()
    await screen.findByText('12')
    await selectPromoter()
    await waitFor(() => expect(metricValue('Invited users')).toBe('0'))
    expect(metricValue('Consumption amount')).toMatch(/0/)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
