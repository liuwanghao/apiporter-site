import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { QuotaDataItem } from '../types'
import { processChartData, processUserChartData } from './charts'

describe('dashboard consumption distribution', () => {
  test('aggregates quota per model independently of call counts', () => {
    const rows: QuotaDataItem[] = [
      { created_at: 1000, model_name: 'alpha', quota: 150, count: 2 },
      { created_at: 2000, model_name: 'beta', quota: 300, count: 20 },
      { created_at: 3000, model_name: 'alpha', quota: 250, count: 3 },
      { created_at: 3000, model_name: 'unused', quota: 0, count: 1 },
    ]

    const charts = processChartData(rows, 'day')

    assert.deepEqual(charts.spec_quota_pie.data[0].values, [
      { type: 'alpha', value: 400 },
      { type: 'beta', value: 300 },
    ])
    assert.deepEqual(charts.spec_pie.data[0].values, [
      { type: 'beta', value: 20 },
      { type: 'alpha', value: 5 },
      { type: 'unused', value: 1 },
    ])
    assert.equal(charts.spec_quota_pie.title.text, 'Quota Distribution')
    assert.equal(charts.spec_line.data[0].values.length > 0, true)
    assert.equal(charts.spec_area.data[0].values.length > 0, true)
  })

  test('shows the quota empty state without changing call-count data', () => {
    const charts = processChartData([
      { created_at: 1000, model_name: 'alpha', quota: 0, count: 2 },
    ])

    assert.deepEqual(charts.spec_quota_pie.data[0].values, [])
    assert.equal(charts.spec_quota_pie.title.subtext, 'No data available')
    assert.deepEqual(charts.spec_pie.data[0].values, [
      { type: 'alpha', value: 2 },
    ])

    const emptyCharts = processChartData([])
    assert.deepEqual(emptyCharts.spec_quota_pie.data[0].values, [])
    assert.equal(emptyCharts.spec_quota_pie.title.text, 'Quota Distribution')
    assert.equal(emptyCharts.spec_quota_pie.title.subtext, 'No data available')
  })

  test('retains user quota aggregation across multiple rows', () => {
    const charts = processUserChartData([
      { created_at: 1000, username: 'alice', quota: 150 },
      { created_at: 1000, username: 'alice', quota: 250 },
    ])

    assert.deepEqual(charts.spec_user_rank.data[0].values[0].rawQuota, 400)
    assert.equal(charts.spec_user_trend.data[0].values[0].rawQuota, 400)
  })
})
