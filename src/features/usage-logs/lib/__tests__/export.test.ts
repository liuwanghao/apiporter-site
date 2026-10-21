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
import { test } from 'node:test'

import { api } from '@/lib/api'

import { downloadUsageLogsCsv } from '../export'

test('exports applied filters in one request and downloads the backend CSV', async () => {
  const originalAdapter = api.defaults.adapter
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    'document'
  )
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  const csv = new Blob(['\uFEFFTime,Token\r\n'], { type: 'text/csv' })
  let requests = 0
  let clicks = 0
  let removed = false
  let filename = ''
  api.defaults.adapter = async (config) => {
    requests += 1
    assert.equal(config.url, '/api/log/export')
    assert.equal(config.responseType, 'blob')
    assert.equal(config.params.p, undefined)
    assert.equal(config.params.page_size, undefined)
    assert.equal(config.params.model_name, 'gpt%')
    assert.equal(config.params.token_name, 'key')
    assert.equal(config.params.start_timestamp, 100)
    assert.equal(config.params.language, 'zh')
    assert.ok(config.params.timezone)
    return {
      data: csv,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/csv; charset=utf-8' },
      config,
    }
  }
  URL.createObjectURL = (blob) => {
    assert.equal(blob, csv)
    return 'blob:export'
  }
  URL.revokeObjectURL = () => {}
  const anchor = {
    href: '',
    download: '',
    click() {
      clicks += 1
      filename = this.download
    },
    remove() {
      removed = true
    },
  }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => anchor, body: { append: () => {} } },
  })
  try {
    await downloadUsageLogsCsv(
      {
        p: 5,
        page_size: 1,
        model_name: 'gpt%',
        token_name: 'key',
        start_timestamp: 100,
      },
      true,
      'zh'
    )
    assert.equal(requests, 1)
    assert.equal(clicks, 1)
    assert.equal(removed, true)
    assert.match(filename, /^usage-logs-.*\.csv$/)
  } finally {
    api.defaults.adapter = originalAdapter
    if (originalDocument) {
      Object.defineProperty(globalThis, 'document', originalDocument)
    } else {
      Reflect.deleteProperty(globalThis, 'document')
    }
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  }
})

test('self export rejects JSON business errors instead of downloading them', async () => {
  const originalAdapter = api.defaults.adapter
  let requests = 0
  api.defaults.adapter = async (config) => {
    requests += 1
    assert.equal(config.url, '/api/log/self/export')
    return {
      data: new Blob(['{"success":false}']),
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
    }
  }
  try {
    await assert.rejects(
      downloadUsageLogsCsv({}, false, 'en'),
      /Failed to export logs/
    )
    assert.equal(requests, 1)
  } finally {
    api.defaults.adapter = originalAdapter
  }
})

test('network failure rejects export so the button can show an error and reset', async () => {
  const originalAdapter = api.defaults.adapter
  api.defaults.adapter = async () => {
    throw new Error('offline')
  }
  try {
    await assert.rejects(downloadUsageLogsCsv({}, false, 'en'), /offline/)
  } finally {
    api.defaults.adapter = originalAdapter
  }
})
