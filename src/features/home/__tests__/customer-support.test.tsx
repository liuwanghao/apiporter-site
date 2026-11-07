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
import { act, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { Home } from '../index'

vi.mock('@/components/layout', () => ({
  PublicLayout: (props: { children: ReactNode }) => <div>{props.children}</div>,
}))
vi.mock('@/context/theme-provider', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}))

describe('homepage footer support bridge', () => {
  test('opens support only for a request from its own same-origin landing frame', async () => {
    let opened = false
    const support = {
      open: async () => {
        opened = true
      },
      status: () => ({ open: opened }),
    }
    vi.stubGlobal('Cloudbridge', support)
    const view = render(<Home />)
    const frame = screen.getByTitle(
      'Relay / 统一 AI 请求路由层'
    ) as HTMLIFrameElement
    const request = (
      origin: string,
      source: MessageEventSource | null,
      type = 'relay-support-open'
    ) =>
      window.dispatchEvent(
        new MessageEvent('message', { origin, source, data: { type } })
      )

    try {
      await act(async () => {
        request('https://untrusted.example', frame.contentWindow)
        request(window.location.origin, window)
        request(window.location.origin, frame.contentWindow, 'other-message')
      })
      expect(opened).toBe(false)

      await act(async () => {
        request(window.location.origin, frame.contentWindow)
      })
      expect(opened).toBe(true)

      view.unmount()
      opened = false
      await act(async () => {
        request(window.location.origin, frame.contentWindow)
      })
      expect(opened).toBe(false)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
