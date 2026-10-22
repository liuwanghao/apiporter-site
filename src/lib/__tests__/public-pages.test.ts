import assert from 'node:assert/strict'

import { test } from 'vitest'

import {
  publicPages,
  getPage,
  renderPageBody,
  renderHead,
} from '../public-pages'

test('known public paths have unique canonical metadata and full guide content', () => {
  assert.match(getPage('/').title, /ApiPorter/)
  assert.equal(
    getPage('/docs/codex').canonical,
    'https://www.apiporter.com/docs/codex'
  )
  assert.match(renderPageBody(getPage('/docs/codex')), /<pre>/)
  assert.match(renderPageBody(getPage('/')), /href="\/docs"/)
  assert.equal(
    new Set(publicPages.map((p) => p.canonical)).size,
    publicPages.length
  )
})
test('pricing runtime introduction uses a section heading without positional directions', () => {
  const html = renderPageBody(getPage('/pricing'), true)
  assert.doesNotMatch(html, /<h1>|下方模型目录/)
  assert.match(html, /<h2>/)
})

test('private and unknown paths are not indexable', () => {
  for (const path of ['/sign-in', '/docs/not-real', '/pricing/not-real']) {
    assert.equal(getPage(path).index, false)
  }
})
test('preview stays noindex and explicit indexable public builds have structured metadata', () => {
  assert.match(renderHead(getPage('/'), true), /noindex, nofollow/)
  assert.match(renderHead(getPage('/'), false), /index, follow/)
  assert.match(renderHead(getPage('/'), false), /application\/ld\+json/)
})
