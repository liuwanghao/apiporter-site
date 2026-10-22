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

import { test } from 'vitest'

import { buildGuideDocument } from '../guide-content.ts'

const ROOT_URL = 'https://gateway.example.com'
const V1_URL = `${ROOT_URL}/v1`

test('Claude walkthrough link opens the dedicated tutorial route', () => {
  const document = buildGuideDocument('claude-code', ROOT_URL, V1_URL)
  const walkthrough = document.sections
    .flatMap((section) => section.blocks)
    .find(
      (block) =>
        block.type === 'inline-link' && block.label.en === 'guided walkthrough'
    )
  assert.ok(walkthrough && walkthrough.type === 'inline-link')
  assert.equal(walkthrough.href, '/docs/claude-code/start')
})

const expectedSectionCounts = {
  codex: 4,
  'claude-code': 3,
  opencode: 5,
  'grok-build': 5,
  'gemini-cli': 4,
  seedance: 7,
  images: 4,
  'cc-switch': 3,
} as const

test('every published guide has route-specific sections', () => {
  for (const [slug, expectedCount] of Object.entries(expectedSectionCounts)) {
    const document = buildGuideDocument(slug, ROOT_URL, V1_URL)

    assert.equal(document.sections.length, expectedCount, slug)
    assert.equal(
      new Set(document.sections.map((section) => section.id)).size,
      expectedCount
    )
  }
})

test('generated examples use the active ApiPorter gateway', () => {
  const serialized = Object.keys(expectedSectionCounts)
    .map((slug) => buildGuideDocument(slug, ROOT_URL, V1_URL))
    .map((document) => JSON.stringify(document))
    .join('\n')

  assert.match(serialized, /https:\/\/gateway\.example\.com\/v1/)
  assert.match(serialized, /YOUR_APIPORTER_API_KEY/)
  assert.doesNotMatch(serialized, /modelflare\.dev/i)
  assert.doesNotMatch(serialized, /YOUR_MODELFLARE_API_KEY/)
})

test('Codex guide matches the reference document structure', () => {
  const document = buildGuideDocument(
    'codex',
    ROOT_URL,
    V1_URL,
    'https://docs.example.com'
  )
  const blocks = document.sections.flatMap((section) => section.blocks)
  const codeBlocks = blocks.filter((block) => block.type === 'code')
  const headingIds = blocks
    .filter((block) => block.type === 'heading')
    .map((block) => block.id)
    .filter(Boolean)

  assert.equal(document.toc?.length, 6)
  assert.deepEqual(headingIds, ['method-a', 'method-b'])
  assert.equal(codeBlocks.length, 21)
  assert.ok(codeBlocks.every((block) => block.compact))
  assert.equal(blocks.filter((block) => block.type === 'actions').length, 0)
  const quickCommands = codeBlocks
    .filter((block) =>
      block.code.includes('https://docs.example.com/install/codex')
    )
    .map((block) => block.code)
  assert.deepEqual(quickCommands, [
    'curl -fsSL https://docs.example.com/install/codex.sh | sh',
    'curl -fsSL https://docs.example.com/install/codex.sh | APIPORTER_ALLOW_ROOT=1 sh',
    'irm https://docs.example.com/install/codex.ps1 | iex',
  ])
})

test('the other seven guides match their reference section trees', () => {
  const expected = {
    'claude-code': { toc: 5, code: 18, headings: ['method-a', 'method-b'] },
    opencode: { toc: 5, code: 7, headings: [] },
    'grok-build': { toc: 5, code: 9, headings: [] },
    'gemini-cli': { toc: 4, code: 5, headings: [] },
    seedance: { toc: 7, code: 6, headings: [] },
    images: {
      toc: 11,
      code: 6,
      headings: [
        'gpt-entry-mode',
        'gpt-sync',
        'gpt-edit',
        'gpt-stream',
        'gemini-endpoints',
        'gemini-stream',
        'gemini-response',
      ],
    },
    'cc-switch': {
      toc: 5,
      code: 0,
      headings: ['cc-method-a', 'cc-method-b'],
    },
  } as const

  for (const [slug, shape] of Object.entries(expected)) {
    const document = buildGuideDocument(
      slug,
      ROOT_URL,
      V1_URL,
      'https://docs.example.com'
    )
    const blocks = document.sections.flatMap((section) => section.blocks)
    const codeBlocks = blocks.filter((block) => block.type === 'code')
    const headingIds = blocks
      .filter((block) => block.type === 'heading')
      .map((block) => block.id)
      .filter(Boolean)

    assert.equal(document.toc?.length, shape.toc, `${slug} toc`)
    assert.equal(codeBlocks.length, shape.code, `${slug} code blocks`)
    assert.deepEqual(headingIds, [...shape.headings], `${slug} headings`)
    assert.ok(
      codeBlocks.every((block) => block.compact),
      `${slug} compact code`
    )
    assert.equal(
      blocks.filter((block) => block.type === 'actions').length,
      0,
      `${slug} action rows`
    )
  }
})

test('Claude Code quick commands use the local installer routes', () => {
  const document = buildGuideDocument(
    'claude-code',
    ROOT_URL,
    V1_URL,
    'https://docs.example.com'
  )
  const codeBlocks = document.sections
    .flatMap((section) => section.blocks)
    .filter((block) => block.type === 'code')

  const quickCommands = codeBlocks
    .filter((block) =>
      block.code.includes('https://docs.example.com/install/claude')
    )
    .map((block) => block.code)
  assert.deepEqual(quickCommands, [
    'curl -fsSL https://docs.example.com/install/claude.sh | sh',
    'curl -fsSL https://docs.example.com/install/claude.sh | APIPORTER_ALLOW_ROOT=1 sh',
    'irm https://docs.example.com/install/claude.ps1 | iex',
  ])
})

test('unknown guide slugs return an empty document', () => {
  assert.deepEqual(buildGuideDocument('unknown', ROOT_URL, V1_URL), {
    sections: [],
  })
})
