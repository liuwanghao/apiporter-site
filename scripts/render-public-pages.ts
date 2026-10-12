import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import {
  publicPages,
  getPage,
  renderHead,
  renderPageBody,
  origin,
} from '../src/lib/public-pages'

const dist = resolve('dist')
const preview = process.env.SEO_INDEXABLE !== 'true'
const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replaceAll(/<meta\s+name="(?:title|description|robots)"[^>]*>/g, '')
const htmlFor = (path: string, content = '') =>
  template
    .replace('<html lang="en">', '<html lang="zh-CN">')
    .replace(
      '</head>',
      `${renderHead(getPage(path), preview)}<meta name="seo-preview" content="${preview}"></head>`
    )
    .replace(
      '<body>',
      `<body><div id="public-fallback" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">${content}</div>`
    )
writeFileSync(resolve(dist, 'app.html'), htmlFor('/sign-in'))
for (const page of publicPages) {
  const target = resolve(
    dist,
    page.path === '/' ? 'index.html' : `.${page.path}/index.html`
  )
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, htmlFor(page.path, renderPageBody(page)))
}
writeFileSync(
  resolve(dist, '404.html'),
  htmlFor(
    '/404',
    '<main><h1>404 · 页面不存在</h1><p><a href="/">返回 CBAPI 首页</a></p></main>'
  )
)
writeFileSync(
  resolve(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`
)
writeFileSync(
  resolve(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPages.map((page) => `<url><loc>${page.canonical}</loc></url>`).join('')}</urlset>`
)
writeFileSync(
  resolve(dist, 'seo-manifest.json'),
  JSON.stringify(
    { preview, pages: publicPages.map((page) => page.path) },
    null,
    2
  )
)
