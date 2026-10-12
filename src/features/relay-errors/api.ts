/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { api } from '@/lib/api'

import type {
  RelayErrorFilters,
  RelayErrorItem,
  RelayErrorPage,
  RelayErrorStats,
} from './types'

interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data: T
}

export async function fetchRelayErrors(
  filters: RelayErrorFilters,
  page: number,
  pageSize: number
): Promise<RelayErrorPage> {
  const response = await api.get<ApiEnvelope<RelayErrorPage>>(
    '/api/relay-errors',
    { params: { ...filters, p: page, page_size: pageSize } }
  )
  return response.data.data
}

export async function fetchRelayError(id: number): Promise<RelayErrorItem> {
  const response = await api.get<ApiEnvelope<RelayErrorItem>>(
    `/api/relay-errors/${id}`
  )
  return response.data.data
}

export async function fetchRelayErrorStats(
  startTimestamp: number,
  endTimestamp: number
): Promise<RelayErrorStats> {
  const response = await api.get<ApiEnvelope<RelayErrorStats>>(
    '/api/relay-errors/stats',
    { params: { start_timestamp: startTimestamp, end_timestamp: endTimestamp } }
  )
  return response.data.data
}
