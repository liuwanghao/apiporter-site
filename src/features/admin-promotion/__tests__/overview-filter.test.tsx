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
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

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
    if (url.startsWith('/api/user/search?')) {
      return {
        data: {
          success: true,
          data: {
            items: [
              {
                id: 42,
                username: 'partner-alice',
                display_name: 'Alice Example',
                email: 'alice@example.com',
              },
              {
                id: 77,
                username: 'partner-alice-two',
                display_name: 'Bob',
                email: 'bob@example.com',
              },
            ],
            total: 2,
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

async function searchPromoter(
  value = '42',
  submit: 'button' | 'enter' = 'button'
) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('textbox', { name: 'Promotion Partner' }))
  await user.paste(value)
  if (submit === 'enter') {
    await user.keyboard('{Enter}')
  } else {
    await user.click(
      screen.getByRole('button', { name: 'Query promotion summary' })
    )
  }
  return user
}

function metricValue(label: string) {
  const metric = screen.getByText(label).parentElement
  if (!metric) throw new Error(`Missing metric: ${label}`)
  return within(metric).getAllByRole('paragraph')[1].textContent
}

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.getState().auth.setUser(null)
})

describe('promotion overview inviter filter', () => {
  test('editing input keeps the current totals until the query is submitted and repeating the query refreshes them', async () => {
    const requests = setupRequests()
    renderPromotion()
    await screen.findByText('12')
    const user = userEvent.setup()
    const input = screen.getByRole('textbox', { name: 'Promotion Partner' })
    await user.click(input)
    await user.paste('42')
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(
      requests.mock.calls.filter(([url]) => url === summaryUrl)
    ).toHaveLength(1)
    await user.click(
      screen.getByRole('button', { name: 'Query promotion summary' })
    )
    await screen.findByText('3')
    await user.click(
      screen.getByRole('button', { name: 'Query promotion summary' })
    )
    await waitFor(() =>
      expect(
        requests.mock.calls.filter(([url]) => url === summaryUrl)
      ).toHaveLength(3)
    )
    await user.click(input)
    await user.clear(input)
    await user.paste('partner-alice')
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(
      requests.mock.calls.some(([url]) => url.startsWith('/api/user/search?'))
    ).toBe(false)
  })

  test('searching a full username resolves that user without loading all users or showing a dropdown', async () => {
    const requests = setupRequests()
    renderPromotion()
    await screen.findByText('12')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    await searchPromoter('  partner-alice  ')
    await screen.findByText('3')
    expect(
      requests.mock.calls.some(([url]) =>
        url.startsWith('/api/user/search?keyword=partner-alice&')
      )
    ).toBe(true)
    expect(requests).toHaveBeenCalledWith(summaryUrl, {
      params: { inviter_user_id: 42 },
    })
    expect(requests.mock.calls.some(([url]) => url === '/api/user/')).toBe(
      false
    )
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  test('an exact username on a later search page is resolved to its own ID', async () => {
    const requests = setupRequests()
    const originalRequest = requests.getMockImplementation()
    if (!originalRequest) throw new Error('Missing request fixture')
    requests.mockImplementation(async (url, config) => {
      if (url.startsWith('/api/user/search?')) {
        const page = new URL(url, 'https://example.test').searchParams.get('p')
        return {
          data: {
            success: true,
            data: {
              items:
                page === '1'
                  ? [{ id: 77, username: 'partner-alice-two' }]
                  : [{ id: 42, username: 'partner-alice' }],
              total: 2,
            },
          },
        } as AxiosResponse
      }
      return originalRequest(url, config)
    })
    renderPromotion()
    await screen.findByText('12')
    await searchPromoter('partner-alice')
    await screen.findByText('3')
    expect(requests.mock.calls.some(([url]) => url.includes('p=2&'))).toBe(true)
    expect(requests).toHaveBeenCalledWith(summaryUrl, {
      params: { inviter_user_id: 42 },
    })
  })

  test.each([
    'partner',
    'Alice Example',
    'alice@example.com',
    '0',
    '99999999999999999999999',
  ])(
    'searching %s does not use a partial username, name, email or invalid ID as a match',
    async (keyword) => {
      const requests = setupRequests()
      renderPromotion()
      await screen.findByText('12')
      await searchPromoter(keyword)
      await waitFor(() => expect(metricValue('Invited users')).toBe('0'))
      expect(
        requests.mock.calls.filter(([url]) => url === summaryUrl)
      ).toHaveLength(1)
    }
  )

  test('a failed username lookup shows retry instead of global totals', async () => {
    const requests = setupRequests()
    const originalRequest = requests.getMockImplementation()
    if (!originalRequest) throw new Error('Missing request fixture')
    requests.mockImplementation(async (url, config) => {
      if (url.startsWith('/api/user/search?')) {
        return {
          data: { success: false, message: 'lookup failed' },
        } as AxiosResponse
      }
      return originalRequest(url, config)
    })
    renderPromotion()
    await screen.findByText('12')
    await searchPromoter('partner-alice')
    expect(
      await screen.findByRole('button', { name: 'Retry' })
    ).toBeInTheDocument()
    expect(screen.queryByText('12')).not.toBeInTheDocument()
  })

  test.each(['button', 'enter'] as const)(
    'submitting with %s updates every metric and submitting an empty input restores the global overview',
    async (submit) => {
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
      expect(
        screen.queryByRole('button', { name: 'Clear' })
      ).not.toBeInTheDocument()

      const user = await searchPromoter('42', submit)
      await screen.findByText('3')
      expect(requests).toHaveBeenCalledWith(summaryUrl, {
        params: { inviter_user_id: 42 },
      })
      for (const [index, label] of labels.entries()) {
        expect(metricValue(label)).not.toBe(globalValues[index])
      }
      expect(
        screen.getByRole('textbox', { name: 'Promotion Partner' })
      ).toHaveValue('42')

      await user.clear(
        screen.getByRole('textbox', { name: 'Promotion Partner' })
      )
      if (submit === 'enter') {
        await user.keyboard('{Enter}')
      } else {
        await user.click(
          screen.getByRole('button', { name: 'Query promotion summary' })
        )
      }
      await screen.findByText('12')
      expect(labels.map(metricValue)).toEqual(globalValues)
      expect(
        screen.getByRole('textbox', { name: 'Promotion Partner' })
      ).toHaveValue('')
    }
  )

  test('a pending promoter lookup hides previous totals and ignores the late result after clearing', async () => {
    let resolveSelected!: (response: AxiosResponse) => void
    const pending = new Promise<AxiosResponse>((resolve) => {
      resolveSelected = resolve
    })
    setupRequests(pending)
    renderPromotion()
    await screen.findByText('12')
    const user = await searchPromoter()
    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('12')).not.toBeInTheDocument()
    await user.clear(screen.getByRole('textbox', { name: 'Promotion Partner' }))
    await user.click(
      screen.getByRole('button', { name: 'Query promotion summary' })
    )
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
    await searchPromoter()
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
    await searchPromoter()
    await waitFor(() => expect(metricValue('Invited users')).toBe('0'))
    expect(metricValue('Consumption amount')).toMatch(/0/)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('manual referral binding', () => {
  test('searches both users, rejects identical selections, and refreshes referrals after binding', async () => {
    const requests = setupRequests()
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { success: true, data: { id: 8 } },
    } as AxiosResponse)
    useAuthStore.getState().auth.setUser({
      id: 99,
      username: 'operator',
      role: ROLE.SUPER_ADMIN,
    })
    renderPromotion()
    const user = userEvent.setup()

    await user.click(screen.getByRole('tab', { name: 'Referrals' }))
    await user.click(
      screen.getByRole('button', { name: 'Bind referral relation' })
    )
    const inviter = screen.getByRole('combobox', { name: 'Inviter user ID' })
    const invitee = screen.getByRole('combobox', { name: 'Invitee user ID' })
    await user.type(inviter, 'partner-alice')
    await user.click(
      await screen.findByRole('option', { name: /partner-alice · #42/ })
    )
    await user.type(invitee, 'partner-alice')
    await user.click(
      await screen.findByRole('option', { name: /partner-alice · #42/ })
    )
    await user.click(screen.getByRole('button', { name: 'Create relation' }))
    expect(post).not.toHaveBeenCalled()
    expect(
      await screen.findByText('Inviter and invitee must be different')
    ).toBeInTheDocument()

    await user.type(invitee, 'partner-alice-two')
    await user.click(
      await screen.findByRole('option', { name: /partner-alice-two · #77/ })
    )
    await user.click(screen.getByRole('button', { name: 'Create relation' }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/admin/promotion/referrals', {
        inviter_user_id: 42,
        invitee_user_id: 77,
      })
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    await waitFor(() =>
      expect(
        requests.mock.calls.filter(
          ([url]) => url === '/api/admin/promotion/referrals'
        ).length
      ).toBeGreaterThan(1)
    )
  })

  test('hides the binding action without referral change permission', async () => {
    setupRequests()
    useAuthStore.getState().auth.setUser({
      id: 10,
      username: 'viewer',
      role: ROLE.ADMIN,
      permissions: { admin_permissions: { referral: { view_all: true } } },
    })
    renderPromotion()
    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Referrals' }))
    expect(
      screen.queryByRole('button', { name: 'Bind referral relation' })
    ).not.toBeInTheDocument()
  })
})
