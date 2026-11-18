import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterEach, beforeEach, expect, test } from 'vitest'

const project = resolve(import.meta.dirname, '../../..')
let workspace: string

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'apiporter-public-seo-'))
  mkdirSync(join(workspace, 'dist'))
  writeFileSync(
    join(workspace, 'dist/index.html'),
    readFileSync(join(project, 'index.html'), 'utf8')
  )
})

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true })
})

function render(indexable?: string) {
  const env = { ...process.env }
  delete env.SEO_INDEXABLE
  if (indexable !== undefined) env.SEO_INDEXABLE = indexable
  const result = spawnSync(
    'bun',
    [join(project, 'scripts/render-public-pages.ts')],
    { cwd: workspace, env, encoding: 'utf8', timeout: 10000 }
  )
  expect(result.status, result.stderr).toBe(0)
}

function check() {
  return spawnSync('bun', [join(project, 'scripts/check-public-seo.ts')], {
    cwd: workspace,
    encoding: 'utf8',
    timeout: 10000,
  })
}

test('production output allows public indexing and keeps private pages excluded', () => {
  render('true')
  const result = check()
  expect(result.status, result.stderr).toBe(0)
})

test.each([undefined, 'false'])(
  'preview output with SEO_INDEXABLE=%s is rejected for production',
  (indexable) => {
    render(indexable)
    const result = check()
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('preview')
  }
)

test('a conflicting Googlebot noindex directive blocks an otherwise indexable release', () => {
  render('true')
  const path = join(workspace, 'dist/docs/index.html')
  writeFileSync(
    path,
    readFileSync(path, 'utf8').replace(
      '</head>',
      '<meta content="noindex" name="googlebot"></head>'
    )
  )
  const result = check()
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain('docs/index.html')
})

test('a missing preview marker blocks a release that would change indexing after hydration', () => {
  render('true')
  const path = join(workspace, 'dist/pricing/index.html')
  writeFileSync(
    path,
    readFileSync(path, 'utf8').replace(
      '<meta name="seo-preview" content="false">',
      ''
    )
  )
  const result = check()
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain('pricing/index.html')
})

test('an indexable private app shell blocks the release', () => {
  render('true')
  const path = join(workspace, 'dist/app.html')
  writeFileSync(
    path,
    readFileSync(path, 'utf8').replace('noindex, nofollow', 'index, follow')
  )
  const result = check()
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain('app.html')
})
