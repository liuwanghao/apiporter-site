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

import type {
  ApiResponse,
  CommissionInvitee,
  CommissionLedger,
  CommissionPartnerApplication,
  CommissionSettlement,
  CommissionSummary,
  PageData,
  PaginationParams,
  PartnerState,
} from './types'

export async function getPartnerState(): Promise<ApiResponse<PartnerState>> {
  const response = await api.get('/api/commission/partner')
  return response.data
}

export async function applyForPartner(payload: {
  reason: string
  contactEmail: string
}): Promise<ApiResponse<CommissionPartnerApplication>> {
  const response = await api.post('/api/commission/partner/applications', {
    reason: payload.reason,
    contact_email: payload.contactEmail,
  })
  return response.data
}

export async function getCommissionSummary(): Promise<
  ApiResponse<CommissionSummary>
> {
  const response = await api.get('/api/commission/summary')
  return response.data
}

export async function getCommissionInvitees(
  params: PaginationParams
): Promise<ApiResponse<PageData<CommissionInvitee>>> {
  const response = await api.get('/api/commission/invitees', { params })
  return response.data
}

export async function getCommissionLedger(
  params: PaginationParams
): Promise<ApiResponse<PageData<CommissionLedger>>> {
  const response = await api.get('/api/commission/ledger', { params })
  return response.data
}

export async function getCommissionSettlements(
  params: PaginationParams
): Promise<ApiResponse<PageData<CommissionSettlement>>> {
  const response = await api.get('/api/commission/settlements', { params })
  return response.data
}

export async function requestCommissionSettlement(payload: {
  amount: number
  currency: string
}): Promise<ApiResponse<CommissionSettlement>> {
  const response = await api.post('/api/commission/settlements', payload)
  return response.data
}
