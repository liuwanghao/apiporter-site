/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or (at your
option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import assert from 'node:assert/strict'

import { describe, test } from 'vitest'

const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { QueryClient, QueryClientProvider } =
  await import('@tanstack/react-query')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { LedgerDetailDialog } = await import('../index')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
})

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

describe('admin commission ledger detail layout', () => {
  test('uses the wide dialog and grouped detail sections', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    })

    queryClient.setQueryData(['admin-promotion', 'ledger-detail', 1], {
      success: true,
      data: {
        ledger: {
          id: 1,
          ledger_no: 'CL-1',
          referral_relation_id: 10,
          inviter_user_id: 1,
          invitee_user_id: 2,
          inviter_username: 'inviter',
          invitee_username: 'invitee',
          source_type: 'WALLET_USAGE',
          source_id: 'req-1',
          source_biz_no: '',
          currency: 'USD',
          consumption_amount: 1000,
          upstream_cost: 200,
          gross_profit: 800,
          commission_base_amount: 1000,
          commission_setting_version: 2,
          commission_rate_bps: 1000,
          commission_amount: 100,
          entry_type: 'CONSUMPTION_COMMISSION',
          status: 'CONFIRMED',
          occurred_at: 1700000000,
          created_at: 1700000000,
          updated_at: 1700000000,
        },
        relation: {
          id: 10,
          inviter_user_id: 1,
          invitee_user_id: 2,
          referral_code: 'REF',
          referral_type: 'ref',
          source: '',
          campaign_id: '',
          status: 'active',
          effective_from: 1700000000,
          change_reason: '',
          operator_id: 1,
          bound_at: 1700000000,
          created_at: 1700000000,
          updated_at: 1700000000,
        },
        reversals: [],
      },
    })

    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <LedgerDetailDialog ledgerId={1} onOpenChange={() => {}} />
          </I18nextProvider>
        </QueryClientProvider>
      )
    )

    const dialog = document.body.querySelector('[data-slot="dialog-content"]')
    assert.ok(dialog)
    assert.equal(dialog.classList.contains('max-w-[750px]'), true)
    assert.equal(dialog.classList.contains('sm:max-w-[750px]'), true)

    const layout = dialog.querySelector('[data-ledger-detail-layout]')
    assert.ok(layout)
    assert.ok(layout.querySelector('[data-ledger-financial-section]'))
    assert.ok(layout.querySelector('[data-ledger-identity-section]'))
    assert.ok(layout.querySelector('[data-ledger-lifecycle-section]'))
    assert.ok(layout.querySelector('[data-ledger-reversals-section]'))
    assert.equal(
      layout
        .querySelector('[data-ledger-financial-section] dl')
        ?.classList.contains('sm:grid-cols-3'),
      true
    )

    await act(async () => root.unmount())
    container.remove()
  })
})
