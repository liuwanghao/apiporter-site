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
import type { PerformanceGroup } from '@/features/performance-metrics/types'

export interface ModelPerformanceSummary {
  avgLatencyMs: number
  avgTps: number
  successRate: number
  latencySeries: Array<{ timestamp: number; latencyMs: number }>
  hasData: boolean
}

function average(values: number[]): number {
  if (values.length === 0) return Number.NaN
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/**
 * Normalizes group-level performance data into the shared values used by the
 * model plaza and the model-details drawer.
 */
export function summarizeModelPerformance(
  groups: readonly PerformanceGroup[]
): ModelPerformanceSummary {
  const latencyValues = groups
    .map((group) => group.avg_latency_ms)
    .filter((value) => Number.isFinite(value) && value > 0)
  const tpsValues = groups
    .map((group) => group.avg_tps)
    .filter((value) => Number.isFinite(value) && value > 0)
  const successRates = groups
    .map((group) => group.success_rate)
    .filter((value) => Number.isFinite(value) && value >= 0)

  const latencyByTimestamp = new Map<number, number[]>()
  for (const group of groups) {
    for (const point of group.series ?? []) {
      if (!Number.isFinite(point.ts)) continue
      if (!Number.isFinite(point.avg_latency_ms) || point.avg_latency_ms <= 0) {
        continue
      }
      const values = latencyByTimestamp.get(point.ts) ?? []
      values.push(point.avg_latency_ms)
      latencyByTimestamp.set(point.ts, values)
    }
  }

  const latencySeries = [...latencyByTimestamp.entries()]
    .sort(([left], [right]) => left - right)
    .map(([timestamp, values]) => ({
      timestamp,
      latencyMs: average(values),
    }))
    .slice(-8)

  return {
    avgLatencyMs: average(latencyValues),
    avgTps: average(tpsValues),
    successRate: average(successRates),
    latencySeries,
    hasData:
      latencyValues.length > 0 ||
      tpsValues.length > 0 ||
      successRates.length > 0,
  }
}
