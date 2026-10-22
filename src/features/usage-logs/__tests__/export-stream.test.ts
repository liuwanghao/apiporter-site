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
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('VITE_API_BASE_URL', 'https://backend.cbapi.example/')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

async function exportRuntime() {
  const { useAuthStore } = await import('@/stores/auth-store')
  useAuthStore.setState((state) => ({
    auth: {
      ...state.auth,
      user: { id: 7, username: 'alice', role: 1 },
      accessToken: 'current-access-token',
      accessExpiresAt: Math.floor(Date.now() / 1000) + 3600,
    },
  }))
  return import('../api')
}

it.each([true, false])(
  'streams export from the configured independent backend with admin=%s',
  async (isAdmin) => {
    const log = { id: 21, model_name: 'gpt-test' }
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          `${JSON.stringify(log)}\n${JSON.stringify({ success: true, data: { count: 1 } })}\n`,
          { headers: { 'content-type': 'application/x-ndjson' } }
        )
      )
    vi.stubGlobal('fetch', fetch)
    const { exportLogs } = await exportRuntime()
    const onLog = vi.fn()
    const signal = new AbortController().signal
    const count = await exportLogs({ model_name: 'gpt-test' }, isAdmin, {
      signal,
      onLog,
    })
    const endpoint = isAdmin ? '/api/log/export' : '/api/log/self/export'
    expect(fetch).toHaveBeenCalledWith(
      `https://backend.cbapi.example${endpoint}?model_name=gpt-test`,
      expect.objectContaining({
        credentials: 'include',
        signal,
        headers: expect.objectContaining({
          Authorization: 'Bearer current-access-token',
        }),
      })
    )
    expect(count).toBe(1)
    expect(onLog).toHaveBeenCalledWith(log)
  }
)

it('rejects a stream that ends without the successful completion record', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"id":21}\n')))
  const { exportLogs } = await exportRuntime()
  await expect(
    exportLogs({}, false, {
      signal: new AbortController().signal,
      onLog: vi.fn(),
    })
  ).rejects.toThrow()
})
