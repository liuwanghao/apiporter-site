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
import { toast } from 'sonner'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { openCustomerSupport } from '../customer-support'

afterEach(() => vi.unstubAllGlobals())

describe('footer customer support', () => {
  test('opens the existing widget after its SDK is ready', async () => {
    let opened = false
    vi.stubGlobal('window', {
      Cloudbridge: {
        open: async () => {
          opened = true
        },
        status: () => ({ open: opened }),
      },
    })
    const error = vi.spyOn(toast, 'error')

    await openCustomerSupport()

    expect(opened).toBe(true)
    expect(error).not.toHaveBeenCalled()
  })

  test.each(['missing', 'unavailable', 'rejected'])(
    'shows retry feedback when the SDK is %s',
    async (state) => {
      vi.stubGlobal('window', {
        Cloudbridge:
          state === 'missing'
            ? undefined
            : {
                open: async () => {
                  if (state === 'rejected') throw new Error('network')
                },
                status: () => ({ open: false }),
              },
      })
      const error = vi
        .spyOn(toast, 'error')
        .mockImplementation(() => 'support-error')

      await expect(openCustomerSupport()).resolves.toBeUndefined()

      expect(error).toHaveBeenCalledWith('Please try again later.')
    }
  )
})
