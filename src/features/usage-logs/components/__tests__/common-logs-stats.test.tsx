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
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'
import { api } from '@/lib/api'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'
import { useSystemConfigStore } from '@/stores/system-config-store'

import type { LogStatistics } from '../../types'
import { CommonLogsHeaderActions } from '../common-logs-header-actions'
import { UsageLogsProvider } from '../usage-logs-provider'

const totals = { quota: 225_000, rpm: 1, tpm: 200 }
const breakdown = {
  ...totals,
  wallet_principal_quota: 100_000,
  wallet_gift_quota: 50_000,
  unclassified_quota: 75_000,
}

function renderSummary(stats: LogStatistics, role: number = ROLE.USER) {
  useAuthStore.getState().auth.setUser({ id: 1, username: 'tester', role })
  const get = vi.spyOn(api, 'get').mockResolvedValue({
    data: { success: true, data: stats },
  })
  const root = createRootRoute()
  const auth = createRoute({ getParentRoute: () => root, id: '_authenticated' })
  const logs = createRoute({
    getParentRoute: () => auth,
    path: '/usage-logs/$section',
    component: CommonLogsHeaderActions,
    validateSearch: (search: Record<string, unknown>) => search,
  })
  const router = createRouter({
    routeTree: root.addChildren([auth.addChildren([logs])]),
    history: createMemoryHistory({ initialEntries: ['/usage-logs/common'] }),
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <UsageLogsProvider>
          <RouterProvider router={router} />
        </UsageLogsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
  return get
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  useAuthStore.setState(useAuthStore.getInitialState(), true)
  useSystemConfigStore.setState(useSystemConfigStore.getInitialState(), true)
  localStorage.clear()
})

test.each([
  [ROLE.USER, '/api/log/self/stat?'],
  [ROLE.ADMIN, '/api/log/stat?'],
])(
  'shows a source breakdown when usage data is available for role %i',
  async (role, endpoint) => {
    const get = renderSummary(breakdown, role)

    expect(await screen.findByText('usageLogs.stats.principal')).toBeVisible()
    expect(screen.getByText('usageLogs.stats.gift')).toBeVisible()
    expect(screen.getByText('usageLogs.stats.unclassified')).toBeVisible()
    expect(screen.getByText('$0.45')).toBeVisible()
    expect(screen.getByText('$0.2')).toBeVisible()
    expect(screen.getByText('$0.1')).toBeVisible()
    expect(screen.getByText('$0.15')).toBeVisible()
    expect(get).toHaveBeenCalledWith(expect.stringContaining(endpoint))
  }
)

test('keeps only the total when the server does not provide a source breakdown', async () => {
  renderSummary(totals)

  expect(await screen.findByText('$0.45')).toBeVisible()
  expect(
    screen.queryByText('usageLogs.stats.principal')
  ).not.toBeInTheDocument()
  expect(screen.queryByText('usageLogs.stats.gift')).not.toBeInTheDocument()
  expect(
    screen.queryByText('usageLogs.stats.unclassified')
  ).not.toBeInTheDocument()
})

test('shows zero principal and gift usage without an empty unclassified total', async () => {
  renderSummary({
    quota: 0,
    rpm: 0,
    tpm: 0,
    wallet_principal_quota: 0,
    wallet_gift_quota: 0,
    unclassified_quota: 0,
  })

  expect(await screen.findByText('usageLogs.stats.gift')).toBeVisible()
  expect(screen.getByText('usageLogs.stats.principal')).toBeVisible()
  expect(screen.getAllByText('$0')).toHaveLength(3)
  expect(
    screen.queryByText('usageLogs.stats.unclassified')
  ).not.toBeInTheDocument()
})

test('hides every usage amount when the privacy control is toggled', async () => {
  renderSummary(breakdown)
  const user = userEvent.setup()
  expect(await screen.findByText('$0.45')).toBeVisible()

  await user.click(screen.getByRole('button', { name: 'Hide' }))

  expect(screen.getAllByText('••••')).toHaveLength(4)
  expect(screen.queryByText('$0.45')).not.toBeInTheDocument()
  expect(screen.queryByText('$0.2')).not.toBeInTheDocument()
  expect(screen.queryByText('$0.1')).not.toBeInTheDocument()
  expect(screen.queryByText('$0.15')).not.toBeInTheDocument()
  expect(screen.getByText('200')).toBeVisible()
})
