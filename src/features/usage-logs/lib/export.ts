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
import { api } from '@/lib/api'

import type { GetLogsParams } from '../types'

/** Download every matching log in one backend request. Pagination is list-only. */
export async function downloadUsageLogsCsv(
  params: GetLogsParams,
  isAdmin: boolean,
  language: string
): Promise<void> {
  const { p: _page, page_size: _pageSize, ...filters } = params
  const path = isAdmin ? '/api/log/export' : '/api/log/self/export'
  const response = await api.get<Blob>(path, {
    params: {
      ...filters,
      language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    responseType: 'blob',
    disableDuplicate: true,
    skipBusinessError: true,
  })
  if (
    !String(response.headers['content-type'])
      .toLowerCase()
      .startsWith('text/csv')
  ) {
    throw new Error('Failed to export logs')
  }
  const url = URL.createObjectURL(response.data)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = `usage-logs-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.append(link)
    try {
      link.click()
    } finally {
      link.remove()
    }
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}
