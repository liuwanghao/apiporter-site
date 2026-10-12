/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import type { TFunction } from 'i18next'

import type { RelayErrorPeriod } from './types'

const SOURCE_LABELS: Record<string, string> = {
  upstream: 'Upstream response',
  balance_preconsume: 'Balance pre-deduction failed',
  gateway: 'Gateway rejected',
}

const CATEGORY_LABELS: Record<string, string> = {
  insufficient_balance: 'Insufficient balance',
  invalid_parameter: 'Invalid parameter',
  authentication: 'Authentication error',
  rate_limit: 'Rate limited',
  upstream_unavailable: 'Upstream unavailable',
  gateway_error: 'Gateway error',
  content_blocked: 'Content blocked',
  other: 'Other',
}

export function sourceLabel(t: TFunction, source: string): string {
  return t(SOURCE_LABELS[source] ?? (source || 'Unknown'))
}

export function categoryLabel(t: TFunction, category: string): string {
  return t(CATEGORY_LABELS[category] ?? (category || 'Other'))
}

export function periodRange(period: RelayErrorPeriod): {
  start: number
  end: number
} {
  const end = Math.floor(Date.now() / 1000)
  if (period === 'today') {
    const now = new Date()
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime()
    return { start: Math.floor(start / 1000), end }
  }
  return { start: end - (period === '7d' ? 7 : 1) * 24 * 60 * 60, end }
}

export function formatRelayErrorTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp * 1000))
}
