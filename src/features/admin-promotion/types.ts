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
import type {
  ApiResponse,
  CommissionLedger,
  CommissionPartnerApplication,
  CommissionPartnerMembership,
  CommissionSettlement,
  CommissionSummary,
  PageData,
  ReferralType,
} from '../promotion-partner/types'

export type {
  ApiResponse,
  CommissionLedger,
  CommissionSettlement,
  CommissionSummary,
  PageData,
  ReferralType,
}

export type AdminApplication = CommissionPartnerApplication

export type ReferralRelation = {
  id: number
  inviter_user_id: number
  invitee_user_id: number
  inviter_username?: string
  invitee_username?: string
  referral_code: string
  referral_type: ReferralType
  source: string
  campaign_id: string
  status: string
  effective_from: number
  effective_to?: number | null
  superseded_relation_id?: number | null
  change_reason: string
  operator_id: number
  operator_username?: string
  bound_at: number
  created_at: number
  updated_at: number
}

export type AdminPartnerState = {
  application?: AdminApplication | null
  membership?: CommissionPartnerMembership | null
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

export type CommissionSettingVersion = CommissionSettings & {
  id: number
  setting_id: number
  effective_at: number
  created_by: number
  created_by_username?: string
  created_at: number
}

export type CommissionReversal = {
  id: number
  original_ledger_id: number
  reversal_ledger_id: number
  reason: string
  source_type: string
  source_id: string
  amount: number
  operator_id: number
  created_at: number
}

export type CommissionLedgerDetail = {
  ledger: CommissionLedger
  relation?: ReferralRelation | null
  reversals: CommissionReversal[]
}

export type AdminApplicationPage = ApiResponse<PageData<AdminApplication>>
export type AdminReferralPage = ApiResponse<PageData<ReferralRelation>>
export type AdminLedgerPage = ApiResponse<PageData<CommissionLedger>>
export type AdminSettlementPage = ApiResponse<PageData<CommissionSettlement>>
export type AdminSettingVersionPage = ApiResponse<
  PageData<CommissionSettingVersion>
>
