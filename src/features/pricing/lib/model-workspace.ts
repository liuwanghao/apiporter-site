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
import type { PricingModel, PricingVendor } from '../types'

export type ModelWorkspaceView = 'pricing' | 'selection' | 'empty-results'

export function getProviderModels(
  models: PricingModel[],
  vendor: PricingVendor
): PricingModel[] {
  return models.filter(
    (model) =>
      model.vendor_name === vendor.name ||
      (model.vendor_id != null && model.vendor_id === vendor.id)
  )
}

/**
 * Keep an explicit selection when possible, otherwise show the first model in
 * the current filtered order so the plaza never opens on an empty workspace.
 */
export function resolveWorkspaceModel(
  models: PricingModel[],
  selectedModelName: string | null,
  vendors: PricingVendor[] = []
): PricingModel | null {
  if (selectedModelName) {
    const selectedModel = models.find(
      (model) => model.model_name === selectedModelName
    )
    if (selectedModel) return selectedModel
  }

  for (const vendor of vendors) {
    const firstProviderModel = getProviderModels(models, vendor)[0]
    if (firstProviderModel) return firstProviderModel
  }

  return models[0] ?? null
}

export function getModelWorkspaceView(options: {
  hasSelectedModel: boolean
  filteredModelCount: number
}): ModelWorkspaceView {
  if (options.hasSelectedModel) return 'pricing'
  return options.filteredModelCount === 0 ? 'empty-results' : 'selection'
}
