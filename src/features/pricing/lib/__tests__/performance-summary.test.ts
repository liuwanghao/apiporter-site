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
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { PerformanceGroup } from '@/features/performance-metrics/types'

import { summarizeModelPerformance } from '../performance-summary.ts'

function group(
  overrides: Partial<PerformanceGroup> & Pick<PerformanceGroup, 'group'>
): PerformanceGroup {
  return {
    avg_ttft_ms: 0,
    avg_latency_ms: 0,
    success_rate: Number.NaN,
    avg_tps: 0,
    series: [],
    ...overrides,
  }
}

describe('model performance summary', () => {
  test('averages group metrics and merges the latest latency buckets', () => {
    const summary = summarizeModelPerformance([
      group({
        group: 'default',
        avg_latency_ms: 80,
        avg_tps: 30,
        success_rate: 100,
        series: [
          {
            ts: 1,
            avg_ttft_ms: 20,
            avg_latency_ms: 70,
            success_rate: 100,
            avg_tps: 28,
          },
          {
            ts: 2,
            avg_ttft_ms: 22,
            avg_latency_ms: 90,
            success_rate: 100,
            avg_tps: 30,
          },
        ],
      }),
      group({
        group: 'vip',
        avg_latency_ms: 120,
        avg_tps: 50,
        success_rate: 98,
        series: [
          {
            ts: 1,
            avg_ttft_ms: 25,
            avg_latency_ms: 110,
            success_rate: 98,
            avg_tps: 45,
          },
        ],
      }),
    ])

    assert.equal(summary.avgLatencyMs, 100)
    assert.equal(summary.avgTps, 40)
    assert.equal(summary.successRate, 99)
    assert.deepEqual(summary.latencySeries, [
      { timestamp: 1, latencyMs: 90 },
      { timestamp: 2, latencyMs: 90 },
    ])
    assert.equal(summary.hasData, true)
  })

  test('returns an explicit empty summary when no metrics are available', () => {
    const summary = summarizeModelPerformance([])

    assert.equal(Number.isNaN(summary.avgLatencyMs), true)
    assert.equal(Number.isNaN(summary.avgTps), true)
    assert.equal(Number.isNaN(summary.successRate), true)
    assert.deepEqual(summary.latencySeries, [])
    assert.equal(summary.hasData, false)
  })
})
