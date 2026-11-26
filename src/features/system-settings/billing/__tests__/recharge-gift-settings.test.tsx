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
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AxiosAdapter } from 'axios'
import { useState } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { api } from '@/lib/api'

import { SettingsPageProvider } from '../../components/settings-page-context'
import { readRechargeGiftTiers } from '../recharge-gift-config'
import { RechargeGiftSettingsSection } from '../recharge-gift-settings-section'

const originalAdapter = api.defaults.adapter
afterEach(() => {
  api.defaults.adapter = originalAdapter
})

function TestPage(props: { savedOption: string }) {
  const [actionsContainer, setActionsContainer] =
    useState<HTMLDivElement | null>(null)
  return (
    <>
      <div ref={setActionsContainer} />
      <SettingsPageProvider actionsContainer={actionsContainer}>
        <RechargeGiftSettingsSection
          defaultValues={readRechargeGiftTiers(props.savedOption)}
        />
      </SettingsPageProvider>
    </>
  )
}

function renderSettings(savedOption: string) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <TestPage savedOption={savedOption} />
    </QueryClientProvider>
  )
  return userEvent.setup()
}

describe('recharge gift settings', () => {
  test('aligns the add-tier button to the start of its form row', () => {
    renderSettings('{"20":1}')

    expect(
      screen.getByRole('button', { name: 'billing.rechargeGift.add' })
    ).toHaveClass('justify-self-start')
  })

  test('saves an edited tier and a newly added tier in a single option update', async () => {
    const save = vi.fn<AxiosAdapter>(async (config) => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }))
    api.defaults.adapter = save
    const user = renderSettings('{"20":1}')
    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    expect(saveButton).toBeDisabled()

    const existingGift = screen.getByRole('textbox', {
      name: 'billing.rechargeGift.giftCny',
    })
    await user.clear(existingGift)
    await user.type(existingGift, '1.25')
    await user.click(
      screen.getByRole('button', { name: 'billing.rechargeGift.add' })
    )
    await user.type(
      screen.getAllByRole('textbox', {
        name: 'billing.rechargeGift.rechargeCny',
      })[1],
      '50'
    )
    await user.type(
      screen.getAllByRole('textbox', {
        name: 'billing.rechargeGift.giftCny',
      })[1],
      '3'
    )
    await user.click(saveButton)

    await waitFor(() => expect(saveButton).toBeDisabled())
    expect(save).toHaveBeenCalledTimes(1)
    expect(JSON.parse(save.mock.calls[0][0].data)).toEqual({
      key: 'TopUpGiftTiers',
      value: '{"20":1.25,"50":3}',
    })
  })

  test('marks a duplicate recharge amount and prevents saving it', async () => {
    const user = renderSettings('{"20":1}')
    await user.click(
      screen.getByRole('button', { name: 'billing.rechargeGift.add' })
    )
    const amount = screen.getAllByRole('textbox', {
      name: 'billing.rechargeGift.rechargeCny',
    })[1]
    await user.type(amount, '20')
    await user.type(
      screen.getAllByRole('textbox', {
        name: 'billing.rechargeGift.giftCny',
      })[1],
      '2'
    )
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(
      await screen.findByText('billing.rechargeGift.duplicate')
    ).toBeVisible()
    expect(amount).toHaveAttribute('aria-invalid', 'true')
  })

  test('removing the only tier leaves the gift schedule empty', async () => {
    const user = renderSettings('{"20":1}')
    await user.click(
      screen.getByRole('button', { name: 'billing.rechargeGift.remove' })
    )

    expect(screen.getByText('billing.rechargeGift.empty')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled()
  })
})
