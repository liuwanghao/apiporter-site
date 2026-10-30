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
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { CheckinCalendarCard } from '../checkin-calendar-card'
import { CheckinSliderCaptcha } from '../checkin-slider-captcha'

const challenge = {
  token: 'first-puzzle',
  background: 'data:image/png;base64,AA==',
  piece: 'data:image/png;base64,AA==',
  width: 320,
  height: 180,
  piece_size: 52,
  piece_x: 0,
  piece_y: 60,
  max_offset: 268,
  expires_in: 180,
}

afterEach(() => {
  vi.restoreAllMocks()
  delete window.turnstile
})

beforeEach(() => {
  // jsdom has no layout; Base UI measures the control and thumb to position it.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      return new DOMRect(
        0,
        0,
        this.getAttribute('data-slot') === 'slider-thumb' ? 44 : 320,
        44
      )
    }
  )
  // GoCaptcha uses native layout metrics to map drag-handle travel to image pixels.
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      if (this.className.includes('gocaptcha-module_dragBlock__')) return 82
      return Number.parseFloat(this.style.width) || 320
    }
  )
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(
    function (this: HTMLElement) {
      return Number.parseFloat(this.style.left) || 0
    }
  )
})

it('waits for keyboard confirmation and prevents duplicate submissions while verifying', async () => {
  const user = userEvent.setup()
  vi.spyOn(api, 'get').mockResolvedValue({
    data: { success: true, data: challenge },
  })
  let finish!: (result: boolean) => void
  const verify = vi.fn(
    () =>
      new Promise<boolean>((resolve) => {
        finish = resolve
      })
  )
  render(
    <StrictMode>
      <CheckinSliderCaptcha onVerify={verify} />
    </StrictMode>
  )
  const slider = await screen.findByRole('slider', {
    name: 'Drag the slider to complete the puzzle',
  })
  expect(verify).not.toHaveBeenCalled()
  slider.focus()
  await user.keyboard('{ArrowRight}{ArrowRight}{Enter}')
  expect(verify).toHaveBeenCalledWith({ token: challenge.token, x: 2 })
  expect(
    screen
      .getByRole('group', { name: 'Captcha puzzle background' })
      .querySelector('[class*="index-module_tile__"]')
  ).toHaveStyle({ left: '2px' })
  expect(screen.getByText('Verifying...')).toBeInTheDocument()
  fireEvent.keyDown(slider, { key: 'Enter' })
  expect(verify).toHaveBeenCalledTimes(1)
  await act(async () => finish(true))
  expect(screen.getByText('Verification passed')).toBeInTheDocument()
})

it('replaces a failed puzzle before permitting another attempt', async () => {
  const user = userEvent.setup()
  let finishRefresh!: (result: {
    data: { success: boolean; data: typeof challenge }
  }) => void
  vi.spyOn(api, 'get')
    .mockResolvedValueOnce({ data: { success: true, data: challenge } })
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = resolve
        })
    )
  const verify = vi
    .fn()
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true)
  render(<CheckinSliderCaptcha onVerify={verify} />)
  const first = await screen.findByRole('slider')
  first.focus()
  await user.keyboard('{ArrowRight}{Enter}')
  await waitFor(() =>
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  )
  expect(verify).toHaveBeenCalledTimes(1)
  await act(async () =>
    finishRefresh({
      data: { success: true, data: { ...challenge, token: 'second-puzzle' } },
    })
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Verification failed')
  const retry = await screen.findByRole('slider')
  expect(retry).toHaveAttribute('aria-valuenow', '0')
  retry.focus()
  await user.keyboard('{ArrowRight}{Enter}')
  expect(verify).toHaveBeenLastCalledWith({ token: 'second-puzzle', x: 1 })
  expect(await screen.findByText('Verification passed')).toBeInTheDocument()
})

it('shows a retry action when the puzzle cannot load', async () => {
  const user = userEvent.setup()
  vi.spyOn(api, 'get')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ data: { success: true, data: challenge } })
  render(<CheckinSliderCaptcha onVerify={vi.fn()} />)
  expect(await screen.findByText('Failed to load captcha')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByRole('slider')).toHaveAttribute(
    'aria-valuenow',
    '0'
  )
})

it('opens verification before sending check-in and sends the chosen solution only on confirmation', async () => {
  const user = userEvent.setup()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  vi.spyOn(api, 'get').mockImplementation(async (url) => ({
    data: {
      success: true,
      data:
        url === '/api/user/checkin/captcha'
          ? challenge
          : {
              enabled: true,
              captcha_enabled: true,
              stats: {
                checked_in_today: false,
                total_checkins: 0,
                total_quota: 0,
                checkin_count: 0,
                records: [],
              },
            },
    },
  }))
  const post = vi.spyOn(api, 'post').mockResolvedValue({
    data: { success: true, data: { quota_awarded: 1000 } },
  })
  render(
    <QueryClientProvider client={client}>
      <CheckinCalendarCard
        checkinEnabled
        captchaEnabled
        turnstileEnabled={false}
        turnstileSiteKey=''
      />
    </QueryClientProvider>
  )
  await user.click(await screen.findByRole('button', { name: 'Check in now' }))
  const slider = await screen.findByRole('slider')
  expect(post).not.toHaveBeenCalled()
  slider.focus()
  await user.keyboard('{ArrowRight}{Enter}')
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(
      '/api/user/checkin',
      { captcha_token: challenge.token, captcha_x: 1 },
      { singleUseAuthorization: true }
    )
  )
  await waitFor(() =>
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  )
  client.clear()
})

it.each(['captcha_invalid', 'checkin_failed'])(
  'obtains a fresh Turnstile token after an unsuccessful attempt (%s)',
  async (code) => {
    const user = userEvent.setup()
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    let verifyTurnstile: (token: string) => void = () => {}
    window.turnstile = {
      render: (_element, options) => {
        verifyTurnstile = options.callback as (token: string) => void
      },
    }
    let puzzleNumber = 0
    vi.spyOn(api, 'get').mockImplementation(async (url) => ({
      data: {
        success: true,
        data:
          url === '/api/user/checkin/captcha'
            ? { ...challenge, token: `puzzle-${++puzzleNumber}` }
            : {
                enabled: true,
                captcha_enabled: true,
                stats: {
                  checked_in_today: false,
                  total_checkins: 0,
                  total_quota: 0,
                  checkin_count: 0,
                  records: [],
                },
              },
      },
    }))
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValueOnce({
        data: {
          success: false,
          code,
          message: 'Captcha verification failed',
        },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: { quota_awarded: 1000 } },
      })
    render(
      <QueryClientProvider client={client}>
        <CheckinCalendarCard
          checkinEnabled
          captchaEnabled
          turnstileEnabled
          turnstileSiteKey='test-key'
        />
      </QueryClientProvider>
    )
    await user.click(
      await screen.findByRole('button', { name: 'Check in now' })
    )
    await screen.findByText('Please complete the security check to continue.')
    await act(async () => verifyTurnstile('first-token'))
    const first = await screen.findByRole('slider')
    first.focus()
    await user.keyboard('{ArrowRight}{Enter}')
    await screen.findByText('Please complete the security check to continue.')
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    await act(async () => verifyTurnstile('fresh-token'))
    const second = await screen.findByRole('slider')
    second.focus()
    await user.keyboard('{ArrowRight}{Enter}')
    await waitFor(() =>
      expect(post).toHaveBeenLastCalledWith(
        '/api/user/checkin?turnstile=fresh-token',
        { captcha_token: 'puzzle-2', captcha_x: 1 },
        { singleUseAuthorization: true }
      )
    )
    await waitFor(() =>
      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    )
    client.clear()
  }
)

it('submits image coordinates from the real GoCaptcha mouse slider and blocks another drag while verifying', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({
    data: { success: true, data: challenge },
  })
  let finish!: (result: boolean) => void
  const verify = vi.fn(
    () =>
      new Promise<boolean>((resolve) => {
        finish = resolve
      })
  )
  render(<CheckinSliderCaptcha onVerify={verify} />)
  await screen.findByRole('slider')
  const puzzle = screen.getByRole('group', {
    name: 'Captcha puzzle background',
  })
  // The library has no accessible handle API; exercise its actual native drag
  // surface instead of mocking the component or invoking its private handler.
  const handle = puzzle.querySelector('[class*="gocaptcha-module_dragBlock__"]')
  const surface = puzzle.querySelector('[class*="gocaptcha-module_wrapper__"]')
  expect(handle).not.toBeNull()
  expect(surface).not.toBeNull()
  if (!handle || !surface) {
    throw new Error('GoCaptcha drag surface is unavailable')
  }
  fireEvent.mouseDown(handle, { clientX: 5 })
  fireEvent.mouseMove(surface, { clientX: 124 })
  fireEvent.mouseUp(handle, { clientX: 124 })
  expect(verify).toHaveBeenCalledWith({ token: challenge.token, x: 134 })
  expect(puzzle).toHaveAttribute('aria-disabled', 'true')
  expect(screen.getByRole('slider')).toBeDisabled()
  fireEvent.mouseDown(handle, { clientX: 5 })
  fireEvent.mouseMove(surface, { clientX: 243 })
  fireEvent.mouseUp(handle, { clientX: 243 })
  expect(verify).toHaveBeenCalledTimes(1)
  await act(async () => finish(true))
  expect(screen.getByRole('status')).toHaveTextContent('Verification passed')
})

it('keeps the image coordinate contract when the puzzle shrinks to a narrow container', async () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      return new DOMRect(
        0,
        0,
        this.getAttribute('data-slot') === 'slider-thumb' ? 12 : 160,
        44
      )
    }
  )
  vi.spyOn(api, 'get').mockResolvedValue({
    data: { success: true, data: { ...challenge, piece_x: 18 } },
  })
  const verify = vi.fn().mockResolvedValue(true)
  render(<CheckinSliderCaptcha onVerify={verify} />)
  await screen.findByRole('slider')
  const puzzle = screen.getByRole('group', {
    name: 'Captcha puzzle background',
  })
  const tile = puzzle.querySelector('[class*="index-module_tile__"]')
  expect(tile).not.toBeNull()
  await waitFor(() => expect(tile).toHaveStyle({ left: '9px', width: '26px' }))
  const handle = puzzle.querySelector('[class*="gocaptcha-module_dragBlock__"]')
  const surface = puzzle.querySelector('[class*="gocaptcha-module_wrapper__"]')
  expect(handle).not.toBeNull()
  expect(surface).not.toBeNull()
  if (!handle || !surface) {
    throw new Error('GoCaptcha drag surface is unavailable')
  }
  fireEvent.mouseDown(handle, { clientX: 0 })
  fireEvent.mouseMove(surface, { clientX: 100 })
  fireEvent.mouseUp(handle, { clientX: 100 })
  expect(verify).toHaveBeenCalledWith({ token: challenge.token, x: 268 })
})
