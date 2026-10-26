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
import { getUsers } from '@/features/users/api'
import type { User } from '@/features/users/types'
import { api } from '@/lib/api'
import { requireServerSuccess } from '@/lib/server-error-message'

import type {
  CommissionPartnerMembership,
  ApiResponse,
  CommissionSettlement,
} from '../promotion-partner/types'
import type {
  AdminApplicationPage,
  CommissionLedgerDetail,
  AdminLedgerPage,
  AdminReferralPage,
  AdminSettlementPage,
  AdminSettingVersionPage,
  CommissionSettings,
  CommissionSummary,
  ReferralRelation,
} from './types'

export async function getAdminSummary(
  inviterUserId?: number
): Promise<ApiResponse<CommissionSummary>> {
  const response = await api.get('/api/admin/promotion/commission/summary', {
    params: { inviter_user_id: inviterUserId },
  })
  return requireServerSuccess(response.data)
}

export async function getPromotionUsers(): Promise<User[]> {
  const users: User[] = []
  let page = 1
  while (true) {
    const response = requireServerSuccess(
      await getUsers({
        p: page,
        page_size: 100,
        sort_by: 'id',
        sort_order: 'asc',
      })
    )
    const items = response.data?.items ?? []
    users.push(...items)
    if (items.length === 0 || users.length >= (response.data?.total ?? 0)) {
      return users
    }
    page += 1
  }
}

export async function getApplications(
  params: Record<string, unknown> = {}
): Promise<AdminApplicationPage> {
  const response = await api.get('/api/admin/promotion/applications', {
    params,
  })
  return response.data
}

export async function reviewApplication(
  id: number,
  payload: { approve: boolean; reason: string }
): Promise<ApiResponse<unknown>> {
  const response = await api.post(
    `/api/admin/promotion/applications/${id}/review`,
    payload
  )
  return response.data
}

export async function setPartnerEnabled(
  userId: number,
  enabled: boolean
): Promise<ApiResponse<CommissionPartnerMembership>> {
  const response = await api.post(
    `/api/admin/promotion/partners/${userId}/status`,
    { enabled }
  )
  return response.data
}

export async function getReferrals(
  params: Record<string, unknown> = {}
): Promise<AdminReferralPage> {
  const response = await api.get('/api/admin/promotion/referrals', { params })
  return response.data
}

export async function setReferralEnabled(
  id: number,
  enabled: boolean,
  reason: string
): Promise<ApiResponse<ReferralRelation | { success: boolean }>> {
  const response = await api.post(
    `/api/admin/promotion/referrals/${id}/${enabled ? 'enable' : 'disable'}`,
    { reason }
  )
  return response.data
}

export async function getAdminLedger(
  params: Record<string, unknown> = {}
): Promise<AdminLedgerPage> {
  const response = await api.get('/api/admin/promotion/commission/ledger', {
    params,
  })
  return response.data
}

export async function getAdminLedgerDetail(
  id: number
): Promise<ApiResponse<CommissionLedgerDetail>> {
  const response = await api.get(`/api/admin/promotion/commission/ledger/${id}`)
  return response.data
}

export async function getAdminSettlements(
  params: Record<string, unknown> = {}
): Promise<AdminSettlementPage> {
  const response = await api.get(
    '/api/admin/promotion/commission/settlements',
    { params }
  )
  return response.data
}

export async function reviewSettlement(
  id: number,
  payload: { approve: boolean; reason: string; payment_method: string }
): Promise<ApiResponse<CommissionSettlement>> {
  const response = await api.post(
    `/api/admin/promotion/commission/settlements/${id}/review`,
    payload
  )
  return response.data
}

export async function getSettings(): Promise<ApiResponse<CommissionSettings>> {
  const response = await api.get('/api/admin/promotion/commission/settings')
  return response.data
}

export async function getSettingVersions(
  params: Record<string, unknown> = {}
): Promise<AdminSettingVersionPage> {
  const response = await api.get(
    '/api/admin/promotion/commission/settings/versions',
    { params }
  )
  return response.data
}

export async function updateSettings(payload: {
  minimumSettlementAmount: number
  commissionRateBps: number
  confirmationDays: number
}): Promise<ApiResponse<CommissionSettings>> {
  const response = await api.put('/api/admin/promotion/commission/settings', {
    minimum_settlement_amount: payload.minimumSettlementAmount,
    commission_rate_bps: payload.commissionRateBps,
    confirmation_days: payload.confirmationDays,
  })
  return response.data
}
