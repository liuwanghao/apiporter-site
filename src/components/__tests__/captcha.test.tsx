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
import { act, render, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, expect, it, vi } from 'vitest'

import { Captcha, type CaptchaHandle } from '../captcha'

const config = {
  provider: 'aliyun',
  turnstileSiteKey: '',
  aliyunRegion: 'cn',
  aliyunPrefix: 'test-prefix',
  aliyunSceneId: 'test-scene',
} as const

afterEach(() => {
  delete window.initAliyunCaptcha
  delete window.AliyunCaptchaConfig
  vi.useRealTimers()
})

it('waits for the SDK, then starts a new challenge after each successful verification', async () => {
  const init = vi.fn<NonNullable<Window['initAliyunCaptcha']>>()
  window.initAliyunCaptcha = init
  const ref = createRef<CaptchaHandle>()
  render(<Captcha ref={ref} {...config} />)

  const firstAttempt = ref.current?.execute()
  await waitFor(() => expect(init).toHaveBeenCalledTimes(1))
  const firstOptions = init.mock.calls[0][0]
  const firstInstance = { show: vi.fn(), destroyCaptcha: vi.fn() }
  firstOptions.getInstance(firstInstance)
  await waitFor(() => expect(firstInstance.show).toHaveBeenCalledOnce())
  firstOptions.success('first-proof')
  await expect(firstAttempt).resolves.toBe('first-proof')
  expect(firstInstance.destroyCaptcha).toHaveBeenCalledOnce()

  const secondAttempt = ref.current?.execute()
  await waitFor(() => expect(init).toHaveBeenCalledTimes(2))
  const secondOptions = init.mock.calls[1][0]
  const secondInstance = { show: vi.fn(), destroyCaptcha: vi.fn() }
  secondOptions.getInstance(secondInstance)
  await waitFor(() => expect(secondInstance.show).toHaveBeenCalledOnce())
  firstOptions.success('stale-proof')
  secondOptions.success('second-proof')
  await expect(secondAttempt).resolves.toBe('second-proof')
})

it('clears a cancelled challenge and releases a later attempt if initialization times out', async () => {
  vi.useFakeTimers()
  const init = vi.fn<NonNullable<Window['initAliyunCaptcha']>>()
  window.initAliyunCaptcha = init
  const ref = createRef<CaptchaHandle>()
  render(<Captcha ref={ref} {...config} />)

  const cancelled = ref.current?.execute()
  await act(async () => {
    await Promise.resolve()
  })
  const options = init.mock.calls[0][0]
  options.getInstance({ show: vi.fn() })
  options.onClose('userDismiss')
  await expect(cancelled).resolves.toBe('')

  const timedOut = ref.current?.execute()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000)
  })
  await expect(timedOut).resolves.toBe('')
})
