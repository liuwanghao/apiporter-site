/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

export interface RelayErrorItem {
  id: number
  created_at: number
  request_id: string
  upstream_request_id: string
  status_code: number
  source: string
  category: string
  error_type: string
  error_code: string
  error_message: string
  channel_id: number
  channel_name: string
  user_id: number
  username: string
  token_id: number
  token_name: string
  model_name: string
  client_ip: string
  request_path: string
  is_stream: boolean
  charged: boolean
  refunded: boolean
  billing_source: string
  retry_count: number
  details: string
}

export interface RelayErrorFilters {
  request_id?: string
  channel_id?: string
  channel?: string
  username?: string
  user_id?: string
  token_name?: string
  model_name?: string
  ip?: string
  request_path?: string
  status_code?: string
  source?: string
  charged?: string
  refunded?: string
}

export interface RelayErrorPage {
  page: number
  page_size: number
  total: number
  items: RelayErrorItem[]
}

export interface CountPoint {
  name: string
  count: number
}

export interface RelayErrorStats {
  today_errors: number
  yesterday_errors: number
  range_errors: number
  range_successes: number
  error_rate: number
  hourly: Array<{ timestamp: number; errors: number }>
  channels: Array<{
    channel_id: number
    channel_name: string
    successes: number
    errors: number
  }>
  categories: CountPoint[]
  status_codes: CountPoint[]
  sources: CountPoint[]
  models: CountPoint[]
}

export type RelayErrorPeriod = 'today' | '24h' | '7d'
