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
import type { TFunction } from 'i18next'

import {
  formatBillingCurrencyFromUSD,
  getCurrencyDisplay,
} from '@/lib/currency'

import type { PaginationParams } from './types'

export const COMMISSION_USD_SCALE = 1_000_000

export function formatFen(
  value?: number | null,
  locale?: string,
  currency = 'CNY'
): string {
  const amount = Number.isFinite(value) ? Number(value) / 100 : 0
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format commission amounts stored by the backend as USD micro-units.
 *
 * Commission accounting remains fixed to USD, while the UI follows the
 * system currency display setting. Billing formatting is used intentionally so
 * money never falls back to the token display mode.
 */
export function formatCommissionAmount(
  value?: number | null,
  locale?: string
): string {
  if (value == null || !Number.isFinite(value)) return '-'

  const amountUSD = value / COMMISSION_USD_SCALE

  return formatBillingCurrencyFromUSD(amountUSD, {
    locale,
    abbreviate: false,
  })
}

function getCommissionDisplayRates(): {
  usdExchangeRate: number
  displayExchangeRate: number
  displayType: string
} {
  const { config } = getCurrencyDisplay()
  const usdExchangeRate =
    config.usdExchangeRate > 0 && Number.isFinite(config.usdExchangeRate)
      ? config.usdExchangeRate
      : 1
  const customExchangeRate =
    config.customCurrencyExchangeRate > 0 &&
    Number.isFinite(config.customCurrencyExchangeRate)
      ? config.customCurrencyExchangeRate
      : 1

  let displayExchangeRate = 1
  if (config.quotaDisplayType === 'CNY') {
    displayExchangeRate = usdExchangeRate
  } else if (config.quotaDisplayType === 'CUSTOM') {
    displayExchangeRate = customExchangeRate
  }

  return {
    usdExchangeRate,
    displayExchangeRate,
    displayType: config.quotaDisplayType,
  }
}

function commissionDisplayFractionDigits(value: number): number {
  return Math.abs(value) >= 1 ? 2 : 4
}

/** Convert backend USD micro-units to the configured monetary display amount. */
export function commissionUnitsToDisplayAmount(value?: number | null): number {
  if (value == null || !Number.isFinite(value)) return 0
  const { displayExchangeRate } = getCommissionDisplayRates()
  return (value / COMMISSION_USD_SCALE) * displayExchangeRate
}

/** Format a commission amount for an editable monetary input. */
export function formatCommissionInputAmount(value?: number | null): string {
  const amount = commissionUnitsToDisplayAmount(value)
  const digits = commissionDisplayFractionDigits(amount)
  return amount.toFixed(digits).replace(/\.?0+$/, '')
}

/** Convert an editable display amount back to backend USD micro-units. */
export function commissionDisplayAmountToUnits(value: string): number {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return Number.NaN
  const { displayExchangeRate } = getCommissionDisplayRates()
  const rawUnits = (amount / displayExchangeRate) * COMMISSION_USD_SCALE

  const target = Number(amount.toFixed(commissionDisplayFractionDigits(amount)))
  const candidates = [
    Math.floor(rawUnits),
    Math.round(rawUnits),
    Math.ceil(rawUnits),
  ]
  const matchingCandidate = candidates.find((candidate) => {
    const candidateAmount = commissionUnitsToDisplayAmount(candidate)
    return (
      Number(
        candidateAmount.toFixed(
          commissionDisplayFractionDigits(candidateAmount)
        )
      ) === target
    )
  })
  return matchingCandidate ?? Math.round(rawUnits)
}

export function yuanToFen(value: string): number {
  const normalized = value.trim()
  if (!/^[-+]?\d+(\.\d{0,2})?$/.test(normalized)) return Number.NaN
  const sign = normalized.startsWith('-') ? -1 : 1
  const unsigned = normalized.replace(/^[-+]/, '')
  const [yuan, decimal = ''] = unsigned.split('.')
  return sign * (Number(yuan) * 100 + Number(decimal.padEnd(2, '0')))
}

export function fenToYuan(value?: number | null): string {
  return ((value ?? 0) / 100).toFixed(2)
}

export function formatTimestamp(
  value?: number | null,
  locale?: string
): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value * 1000))
}

export function formatDate(value?: number | null, locale?: string): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value * 1000))
}

export function getLedgerDateRangeParams(
  from?: Date,
  to?: Date
): Pick<PaginationParams, 'occurred_from' | 'occurred_to'> {
  const params: Pick<PaginationParams, 'occurred_from' | 'occurred_to'> = {}
  if (from) {
    const start = new Date(from)
    start.setHours(0, 0, 0, 0)
    params.occurred_from = Math.floor(start.getTime() / 1000)
  }
  if (to) {
    const end = new Date(to)
    end.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() + 1)
    params.occurred_to = Math.floor(end.getTime() / 1000)
  }
  return params
}

export function referralTypeLabel(type: string, t: TFunction): string {
  if (type === 'aff') return t('Friend invitation')
  if (type === 'ref') return t('Promotion partner')
  return type || '-'
}

export function commissionEntryLabel(type: string, t: TFunction): string {
  if (type === 'CONSUMPTION_COMMISSION') return t('Consumption commission')
  if (type === 'REFUND_REVERSAL') return t('Refund reversal')
  if (type === 'MANUAL_ADJUSTMENT') return t('Manual adjustment')
  if (type === 'SETTLEMENT_ADJUSTMENT') return t('Settlement adjustment')
  return type || '-'
}

export function statusLabel(status: string, t: TFunction): string {
  const labels: Record<string, string> = {
    PENDING: t('Pending'),
    APPROVED: t('Approved'),
    REJECTED: t('Rejected'),
    ACTIVE: t('Active'),
    DISABLED: t('Disabled'),
    ESTIMATED: t('Estimated'),
    CONFIRMED: t('Confirmed'),
    SETTLED: t('Settled'),
    PAID: t('Paid'),
    REVERSED: t('Reversed'),
    CANCELLED: t('Cancelled'),
    active: t('Active'),
    disabled: t('Disabled'),
  }
  return labels[status] ?? status ?? '-'
}

export function statusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (['ACTIVE', 'APPROVED', 'CONFIRMED', 'PAID', 'active'].includes(status)) {
    return 'default'
  }
  if (['REJECTED', 'DISABLED', 'REVERSED', 'disabled'].includes(status)) {
    return 'destructive'
  }
  if (['PENDING', 'ESTIMATED'].includes(status)) return 'secondary'
  return 'outline'
}
