/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import assert from 'node:assert/strict'

import type { TFunction } from 'i18next'
import { describe, test } from 'vitest'

import { formatRelayErrorTime, periodRange, sourceLabel } from '../lib'

describe('relay error presentation helpers', () => {
  test('formats a relay error timestamp with date and time', () => {
    const value = formatRelayErrorTime(Date.UTC(2026, 7, 20, 7, 49, 1) / 1000)

    assert.match(value, /2026/)
    assert.match(value, /07:49:01|15:49:01/)
  })

  test('builds a seven-day range ending at now', () => {
    const before = Math.floor(Date.now() / 1000)
    const range = periodRange('7d')
    const after = Math.floor(Date.now() / 1000)

    assert.ok(range.end >= before && range.end <= after)
    assert.equal(range.end - range.start, 7 * 24 * 60 * 60)
  })

  test('maps known source labels and preserves unknown values', () => {
    const translate = ((key: string) =>
      `translated:${key}`) as unknown as TFunction

    assert.equal(
      sourceLabel(translate, 'upstream'),
      'translated:Upstream response'
    )
    assert.equal(sourceLabel(translate, 'custom'), 'translated:custom')
  })
})
