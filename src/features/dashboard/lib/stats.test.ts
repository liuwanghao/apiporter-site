/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or (at your
option) any later version.
*/
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { QuotaDataItem } from '../types'
import { calculateCacheHitRate, calculateDashboardStats } from './stats'

describe('dashboard token statistics', () => {
  test('aggregates input, output, cache read, and cache creation tokens', () => {
    const rows: QuotaDataItem[] = [
      {
        created_at: 1,
        token_used: 100,
        input_tokens: 25,
        output_tokens: 10,
        cache_read_tokens: 60,
        cache_creation_tokens: 5,
      },
      {
        created_at: 2,
        token_used: 200,
        input_tokens: 50,
        output_tokens: 20,
        cache_read_tokens: 120,
        cache_creation_tokens: 10,
      },
    ]

    assert.deepEqual(calculateDashboardStats(rows), {
      totalQuota: 0,
      totalCount: 0,
      totalTokens: 300,
      inputTokens: 75,
      outputTokens: 30,
      cacheReadTokens: 180,
      cacheCreationTokens: 15,
    })
  })

  test('calculates cache read tokens over all input token categories', () => {
    assert.equal(
      calculateCacheHitRate({
        inputTokens: 75,
        cacheReadTokens: 180,
        cacheCreationTokens: 15,
      }),
      (180 / 270) * 100
    )
  })

  test('returns zero when no input token data is available', () => {
    assert.equal(
      calculateCacheHitRate({
        inputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
      }),
      0
    )
  })
})
