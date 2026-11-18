import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { publicPages } from '../src/lib/public-pages'

const dist = resolve('dist')
const manifest = JSON.parse(
  readFileSync(resolve(dist, 'seo-manifest.json'), 'utf8')
)
assert.equal(manifest.preview, false, 'Production build must not be a preview')

const files = publicPages.map((page) => ({
  path: page.path === '/' ? 'index.html' : `${page.path.slice(1)}/index.html`,
  index: true,
}))
files.push(
  { path: 'app.html', index: false },
  { path: '404.html', index: false }
)

for (const file of files) {
  const html = readFileSync(resolve(dist, file.path), 'utf8')
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) =>
    Object.fromEntries(
      [...match[0].matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map((attr) => [
        attr[1].toLowerCase(),
        attr[2].toLowerCase(),
      ])
    )
  )
  assert(
    meta.some((tag) => tag.name === 'seo-preview' && tag.content === 'false'),
    `${file.path}: missing production seo-preview marker`
  )
  const robots = meta.filter((tag) =>
    ['robots', 'googlebot'].includes(tag.name)
  )
  const blocksIndexing = (content = '') => /\b(?:noindex|none)\b/.test(content)
  if (file.index) {
    assert(
      robots.some(
        (tag) => tag.name === 'robots' && /\bindex\b/.test(tag.content)
      ),
      `${file.path}: missing index directive`
    )
    assert(
      robots.every((tag) => !blocksIndexing(tag.content)),
      `${file.path}: public page has a noindex directive`
    )
  } else {
    assert(
      robots.some(
        (tag) => tag.name === 'robots' && blocksIndexing(tag.content)
      ),
      `${file.path}: private or error page must remain noindex`
    )
  }
}
