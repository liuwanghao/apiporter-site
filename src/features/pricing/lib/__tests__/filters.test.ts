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

import { describe, test } from 'vitest'

import {
  ENDPOINT_TYPES,
  FILTER_ALL,
  QUOTA_TYPES,
  SORT_OPTIONS,
} from '../../constants.ts'
import type { PricingModel } from '../../types.ts'
import { filterModelsForProviderNavigation } from '../filters.ts'

const models: PricingModel[] = [
  {
    id: 1,
    model_name: 'gpt-4.1',
    vendor_name: 'OpenAI',
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 4,
    enable_groups: ['default'],
    tags: 'chat tools',
  },
  {
    id: 2,
    model_name: 'claude-sonnet',
    vendor_name: 'Anthropic',
    quota_type: 0,
    model_ratio: 1.5,
    completion_ratio: 5,
    enable_groups: ['default'],
    tags: 'chat reasoning',
  },
]

const baseFilters = {
  search: '',
  vendor: 'OpenAI',
  group: FILTER_ALL,
  quotaType: QUOTA_TYPES.ALL,
  endpointType: ENDPOINT_TYPES.ALL,
  tag: FILTER_ALL,
  sortBy: SORT_OPTIONS.NAME,
}

describe('provider navigation filters', () => {
  test('keeps every provider available after selecting one provider', () => {
    const result = filterModelsForProviderNavigation(models, baseFilters)

    assert.deepEqual(
      result.map((model) => model.vendor_name),
      ['Anthropic', 'OpenAI']
    )
  })

  test('still applies non-provider filters to the provider model tree', () => {
    const result = filterModelsForProviderNavigation(models, {
      ...baseFilters,
      search: 'claude',
    })

    assert.deepEqual(
      result.map((model) => model.model_name),
      ['claude-sonnet']
    )
  })
})
