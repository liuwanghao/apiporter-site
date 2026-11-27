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
  test('enables and saves a percentage gift together with existing tiers', async () => {
    const save = vi.fn<AxiosAdapter>(async (config) => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }))
    api.defaults.adapter = save
    const user = renderSettings('{"20":1}')
    const toggle = screen.getByRole('switch', {
      name: 'billing.rechargeGift.enablePercentage',
    })
    expect(toggle).not.toBeChecked()
    expect(
      screen.queryByRole('textbox', {
        name: 'billing.rechargeGift.percentageRate',
      })
    ).not.toBeInTheDocument()

    toggle.focus()
    await user.keyboard(' ')
    expect(toggle).toBeChecked()
    expect(
      await screen.findByRole('textbox', {
        name: 'billing.rechargeGift.percentageAbove (CNY)',
      })
    ).toHaveValue('500')
    expect(
      screen.getByRole('textbox', {
        name: 'billing.rechargeGift.percentageRate',
      })
    ).toHaveValue('10')

    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    await user.click(saveButton)
    await waitFor(() => expect(saveButton).toBeDisabled())
    expect(save).toHaveBeenCalledOnce()
    expect(JSON.parse(save.mock.calls[0][0].data)).toEqual({
      key: 'TopUpGiftTiers',
      value:
        '{"tiers":[{"min":20,"max":20,"gift":1}],"percentage":{"above":500,"rate":10}}',
    })
  })

  test('rejects an invalid rate and retains the rule fields for correction', async () => {
    const user = renderSettings(
      '{"tiers":[],"percentage":{"above":500.25,"rate":10.75}}'
    )
    expect(
      screen.getByRole('switch', {
        name: 'billing.rechargeGift.enablePercentage',
      })
    ).toBeChecked()
    const rate = screen.getByRole('textbox', {
      name: 'billing.rechargeGift.percentageRate',
    })
    expect(rate).toHaveValue('10.75')
    await user.clear(rate)
    await user.type(rate, '100.01')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(rate).toHaveAttribute('aria-invalid', 'true')
    expect(
      await screen.findByText('billing.rechargeGift.invalidPercentageRate')
    ).toBeVisible()
  })

  test('aligns the add-tier button to the start of its form row', () => {
    renderSettings('{"20":1}')

    expect(
      screen.getByRole('button', { name: 'billing.rechargeGift.add' })
    ).toHaveClass('justify-self-start')
  })

  test('saves a legacy exact tier and a newly added range in a single option update', async () => {
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
        name: 'billing.rechargeGift.minRecharge',
      })[1],
      '50'
    )
    await user.type(
      screen.getAllByRole('textbox', {
        name: 'billing.rechargeGift.maxRecharge',
      })[1],
      '99.99'
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
      value:
        '[{"min":20,"max":20,"gift":1.25},{"min":50,"max":99.99,"gift":3}]',
    })
  })

  test('marks inclusive ranges with a shared endpoint as overlapping', async () => {
    const user = renderSettings('{"20":1}')
    await user.click(
      screen.getByRole('button', { name: 'billing.rechargeGift.add' })
    )
    const amount = screen.getAllByRole('textbox', {
      name: 'billing.rechargeGift.minRecharge',
    })[1]
    await user.type(amount, '20')
    await user.type(
      screen.getAllByRole('textbox', {
        name: 'billing.rechargeGift.maxRecharge',
      })[1],
      '25'
    )
    await user.type(
      screen.getAllByRole('textbox', {
        name: 'billing.rechargeGift.giftCny',
      })[1],
      '2'
    )
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(
      await screen.findByText('billing.rechargeGift.overlap')
    ).toBeVisible()
    expect(amount).toHaveAttribute('aria-invalid', 'true')
  })

  test('marks a maximum below the minimum as invalid', async () => {
    const user = renderSettings('[{"min":10.25,"max":20.99,"gift":1}]')
    const maximum = screen.getByRole('textbox', {
      name: 'billing.rechargeGift.maxRecharge',
    })
    expect(maximum).toHaveValue('20.99')
    await user.clear(maximum)
    await user.type(maximum, '10.24')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(
      await screen.findByText('billing.rechargeGift.invalidRange')
    ).toBeVisible()
    expect(maximum).toHaveAttribute('aria-invalid', 'true')
  })

  test('loads decimal strings accepted by the stored option', () => {
    renderSettings('[{"min":"20.00","max":"49.99","gift":"1.250"}]')

    expect(
      screen.getByLabelText('billing.rechargeGift.minRecharge')
    ).toHaveValue('20')
    expect(
      screen.getByLabelText('billing.rechargeGift.maxRecharge')
    ).toHaveValue('49.99')
    expect(screen.getByLabelText('billing.rechargeGift.giftCny')).toHaveValue(
      '1.25'
    )
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
