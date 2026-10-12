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

import type { PricingModel, PricingVendor } from '../../types.ts'
import {
  getModelWorkspaceView,
  resolveWorkspaceModel,
} from '../model-workspace.ts'

function createModel(id: number, modelName: string): PricingModel {
  return {
    id,
    model_name: modelName,
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 1,
    enable_groups: ['default'],
  }
}

describe('model plaza workspace', () => {
  const models = [createModel(1, 'alpha'), createModel(2, 'beta')]

  test('defaults to the first model shown under the first provider', () => {
    const providerModels = [
      { ...createModel(1, 'alpha'), vendor_id: 2, vendor_name: 'Second' },
      { ...createModel(2, 'zulu'), vendor_id: 1, vendor_name: 'First' },
    ]
    const vendors: PricingVendor[] = [
      { id: 1, name: 'First' },
      { id: 2, name: 'Second' },
    ]

    assert.equal(
      resolveWorkspaceModel(providerModels, null, vendors)?.model_name,
      'zulu'
    )
  })

  test('shows the first filtered model by default', () => {
    assert.equal(resolveWorkspaceModel(models, null)?.model_name, 'alpha')
  })

  test('keeps an explicit selection when it remains visible', () => {
    assert.equal(resolveWorkspaceModel(models, 'beta')?.model_name, 'beta')
  })

  test('falls back to the first filtered model when a selection disappears', () => {
    assert.equal(resolveWorkspaceModel(models, 'missing')?.model_name, 'alpha')
  })

  test('does not select a model when the filtered catalog is empty', () => {
    assert.equal(resolveWorkspaceModel([], 'alpha'), null)
  })

  test('prompts for a model while filtered models remain available', () => {
    assert.equal(
      getModelWorkspaceView({
        hasSelectedModel: false,
        filteredModelCount: 2,
      }),
      'selection'
    )
  })

  test('shows an empty result when no filtered models remain', () => {
    assert.equal(
      getModelWorkspaceView({
        hasSelectedModel: false,
        filteredModelCount: 0,
      }),
      'empty-results'
    )
  })

  test('keeps the selected model pricing as the primary workspace state', () => {
    assert.equal(
      getModelWorkspaceView({
        hasSelectedModel: true,
        filteredModelCount: 1,
      }),
      'pricing'
    )
  })

  test('shows the catalog empty state when no models are configured', () => {
    assert.equal(
      getModelWorkspaceView({
        hasSelectedModel: false,
        filteredModelCount: 0,
      }),
      'empty-results'
    )
  })
})
