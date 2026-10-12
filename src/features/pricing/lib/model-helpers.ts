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
import { EXCLUDED_GROUPS, FILTER_ALL, QUOTA_TYPE_VALUES } from '../constants'
import type { PricingModel } from '../types'

// ----------------------------------------------------------------------------
// Model Helper Utilities
// ----------------------------------------------------------------------------

/**
 * Get available groups for a model
 */
export function getAvailableGroups(
  model: PricingModel,
  usableGroup: Record<string, { desc: string; ratio: number }>
): string[] {
  const modelEnableGroups = Array.isArray(model.enable_groups)
    ? model.enable_groups
    : []

  return Object.keys(usableGroup)
    .filter((g) => !EXCLUDED_GROUPS.includes(g))
    .filter((g) => modelEnableGroups.includes(g))
}

/**
 * Read a configured group ratio while preserving valid zero ratios.
 */
export function getConfiguredGroupRatio(
  groupRatio: Record<string, number>,
  group: string
): number {
  const ratio = groupRatio[group]
  return typeof ratio === 'number' && Number.isFinite(ratio) ? ratio : 1
}

export type PricingComparisonRow =
  | {
      kind: 'base'
      key: 'base'
      ratio: 1
      discountRate: 0
    }
  | {
      kind: 'group'
      key: string
      group: string
      ratio: number
      discountRate: number
    }

/**
 * Build pricing rows with an optional base-price benchmark.
 *
 * Discount rate is the percentage saved against the base price, so a 0.6x
 * group multiplier becomes a 40% discount. Values above 1 remain negative to
 * make a surcharge visible instead of presenting it as a discount.
 */
export function getPricingComparisonRows(
  groups: string[],
  groupRatio: Record<string, number>,
  includeBasePrice = false
): PricingComparisonRow[] {
  const rows: PricingComparisonRow[] = groups.map((group) => {
    const ratio = getConfiguredGroupRatio(groupRatio, group)
    const discountRate = Number((1 - ratio).toFixed(6))

    return {
      kind: 'group',
      key: group,
      group,
      ratio,
      discountRate,
    }
  })

  rows.sort((left, right) => left.ratio - right.ratio)

  if (includeBasePrice) {
    rows.unshift({ kind: 'base', key: 'base', ratio: 1, discountRate: 0 })
  }

  return rows
}

export function createDiscountRateFormatter(
  locale?: string
): Intl.NumberFormat {
  const normalizedLocale = locale?.replaceAll('_', '-') || undefined
  const options: Intl.NumberFormatOptions = {
    style: 'percent',
    maximumFractionDigits: 2,
  }

  try {
    return new Intl.NumberFormat(normalizedLocale, options)
  } catch {
    return new Intl.NumberFormat(undefined, options)
  }
}

export function formatDiscountRateLabel(
  formatter: Intl.NumberFormat,
  discountRate: number
): string {
  return `${formatter.format(discountRate)} off`
}

/**
 * Resolve the group ratio used by model square summary prices.
 *
 * When no specific group is selected, the model square shows the best price
 * available to the viewer. When a group filter is active, it shows that
 * group's price instead.
 */
export function getDisplayGroupRatio(
  model: PricingModel,
  selectedGroup?: string
): number {
  const modelEnableGroups = Array.isArray(model.enable_groups)
    ? model.enable_groups
    : []
  const groupRatio = model.group_ratio || {}

  if (
    selectedGroup &&
    selectedGroup !== FILTER_ALL &&
    modelEnableGroups.includes(selectedGroup)
  ) {
    return getConfiguredGroupRatio(groupRatio, selectedGroup)
  }

  if (modelEnableGroups.length === 0) {
    return 1
  }

  let minRatio = Number.POSITIVE_INFINITY

  for (const group of modelEnableGroups) {
    const ratio = groupRatio[group]
    if (
      typeof ratio === 'number' &&
      Number.isFinite(ratio) &&
      ratio < minRatio
    ) {
      minRatio = ratio
    }
  }

  return minRatio === Number.POSITIVE_INFINITY ? 1 : minRatio
}

/**
 * Replace model placeholder in endpoint path
 */
export function replaceModelInPath(path: string, modelName: string): string {
  return path.replaceAll('{model}', modelName)
}

/**
 * Check if model is token-based pricing
 */
export function isTokenBasedModel(model: PricingModel): boolean {
  return model.quota_type === QUOTA_TYPE_VALUES.TOKEN
}
