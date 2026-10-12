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
export type ReferralType = 'aff' | 'ref'

export type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
}

export type PageData<T> = {
  items: T[]
  total: number
  page: number
  page_size: number
}

export type CommissionPartnerApplication = {
  id: number
  user_id: number
  username?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  partner_status?: 'ACTIVE' | 'DISABLED'
  contact_email: string
  apply_reason: string
  review_reason: string
  reviewer_id: number
  reviewer_username?: string
  reviewed_at?: number | null
  created_at: number
  updated_at: number
}

export type CommissionPartnerMembership = {
  id: number
  user_id: number
  application_id?: number | null
  status: 'ACTIVE' | 'DISABLED'
  effective_from: number
  effective_to?: number | null
  created_by: number
  created_at: number
  updated_at: number
}

export type PartnerState = {
  application?: CommissionPartnerApplication | null
  membership?: CommissionPartnerMembership | null
  settings?: CommissionSettings | null
}

export type CommissionSettings = {
  version: number
  currency: string
  timezone: string
  settlement_cycle: string
  minimum_settlement_amount: number
  commission_rate_bps: number
  confirmation_days: number
}

export type CommissionSummary = {
  invitee_count: number
  consumption_amount: number
  estimated_amount: number
  confirmed_amount: number
  settled_amount: number
  paid_amount: number
  reversal_amount: number
}

export type CommissionInvitee = {
  relation_id: number
  invitee_user_id: number
  username: string
  display_name: string
  registered_at: number
  bound_at: number
  status: string
  consumption_amount: number
  commission_amount: number
}

export type CommissionLedger = {
  id: number
  ledger_no: string
  referral_relation_id: number
  inviter_user_id: number
  invitee_user_id: number
  inviter_username?: string
  invitee_username?: string
  source_type: string
  source_id: string
  source_biz_no: string
  currency: string
  consumption_amount: number
  upstream_cost: number
  gross_profit: number
  commission_base_amount: number
  commission_setting_version: number
  commission_rate_bps: number
  commission_amount: number
  entry_type: string
  status: string
  estimated_at?: number | null
  confirm_after?: number | null
  confirmed_at?: number | null
  settled_at?: number | null
  paid_at?: number | null
  settlement_id?: number | null
  occurred_at: number
  created_at: number
  updated_at: number
}

export type CommissionSettlement = {
  id: number
  settlement_no: string
  user_id: number
  username?: string
  currency: string
  period_start: number
  period_end: number
  commission_amount: number
  adjustment_amount: number
  final_amount: number
  status: string
  creator_id: number
  reviewer_id: number
  payer_id: number
  creator_username?: string
  reviewer_username?: string
  payer_username?: string
  review_reason: string
  reviewed_at?: number | null
  paid_at?: number | null
  payment_method: string
  payment_reference: string
  payment_note: string
  created_at: number
  updated_at: number
}

export type PaginationParams = {
  p?: number
  page_size?: number
  status?: string
  entry_type?: string
  occurred_from?: number
  occurred_to?: number
}
