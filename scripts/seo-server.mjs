import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distRoot = resolve(process.env.SEO_DIST || join(projectRoot, 'dist'))
const backendUrl = (
  process.env.SEO_BACKEND_URL ||
  process.env.VITE_API_BASE_URL ||
  'http://localhost:3000'
).replace(/\/$/, '')
const port = Number(process.env.SEO_PORT || 8080)

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
const publicPaths = new Set(['/', '/docs', '/pricing'])
const isPublicPath = (path) =>
  publicPaths.has(path) || path.startsWith('/docs/')
const languageFor = (request) => {
  const value = request.headers['accept-language'] || ''
  if (/\bja(?:-|,|;|$)/i.test(value)) return 'ja'
  if (/\bzh-(?:tw|hk|mo)/i.test(value)) return 'zhTW'
  if (/\bzh/i.test(value)) return 'zhCN'
  return 'en'
}

async function loadSeoConfig() {
  try {
    const response = await fetch(`${backendUrl}/api/status`, {
      signal: AbortSignal.timeout(1500),
    })
    if (!response.ok) return {}
    const data = (await response.json())?.data ?? {}
    return {
      title: data.seo_title?.trim(),
      description: data.seo_description?.trim(),
      keywords: data.seo_keywords?.trim(),
      image: data.seo_og_image?.trim(),
    }
  } catch {
    return {}
  }
}

function renderHead(pathname, seo, language) {
  const defaults = {
    en: {
      description:
        'ApiPorter provides AI API access, integration documentation, and model pricing for developers.',
      keywords:
        'ApiPorter, AI API, API gateway, Claude API, GPT API, Gemini API, AI model pricing',
    },
    zhCN: {
      description:
        'ApiPorter 为开发者提供 AI API 接入、配置文档与模型价格查询。',
      keywords:
        'ApiPorter, AI API, API 中转, API 接入, Claude API, GPT API, Gemini API, AI 模型价格',
    },
    zhTW: {
      description:
        'ApiPorter 為開發者提供 AI API 接入、設定文件與模型價格查詢。',
      keywords:
        'ApiPorter, AI API, API 中轉, API 接入, Claude API, GPT API, Gemini API, AI 模型價格',
    },
    ja: {
      description:
        'ApiPorter は開発者向けに AI API 接続、設定ドキュメント、モデル価格を提供します。',
      keywords:
        'ApiPorter, AI API, API ゲートウェイ, Claude API, GPT API, Gemini API, AI モデル価格',
    },
  }[language] || {
    description:
      'ApiPorter provides AI API access, integration documentation, and model pricing for developers.',
    keywords:
      'ApiPorter, AI API, API gateway, Claude API, GPT API, Gemini API, AI model pricing',
  }
  const title = seo.title || 'ApiPorter'
  const description = seo.description || defaults.description
  const keywords = seo.keywords || defaults.keywords
  const image =
    seo.image || 'https://www.apiporter.com/brand/apiporter-logo.png'
  const canonical = `https://www.apiporter.com${pathname === '/' ? '/' : pathname}`
  return `<title>${escapeHtml(title)}</title><meta name="title" content="${escapeHtml(title)}"><meta name="description" content="${escapeHtml(description)}"><meta name="keywords" content="${escapeHtml(keywords)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${escapeHtml(canonical)}"><meta data-apiporter-seo property="og:site_name" content="ApiPorter"><meta data-apiporter-seo property="og:title" content="${escapeHtml(title)}"><meta data-apiporter-seo property="og:description" content="${escapeHtml(description)}"><meta data-apiporter-seo property="og:url" content="${escapeHtml(canonical)}"><meta data-apiporter-seo property="og:type" content="website"><meta data-apiporter-seo property="og:image" content="${escapeHtml(image)}"><meta data-apiporter-seo name="twitter:card" content="summary"><meta data-apiporter-seo name="twitter:title" content="${escapeHtml(title)}"><meta data-apiporter-seo name="twitter:description" content="${escapeHtml(description)}"><meta data-apiporter-seo name="twitter:image" content="${escapeHtml(image)}">`
}

async function serve(request, response) {
  const url = new URL(request.url, 'http://localhost')
  const pathname = decodeURIComponent(url.pathname)
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405)
    response.end()
    return
  }
  const relative =
    pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const filePath = normalize(join(distRoot, relative))
  const insideDist =
    filePath === distRoot || filePath.startsWith(`${distRoot}/`)
  const target =
    insideDist && extname(filePath) ? filePath : join(distRoot, 'index.html')
  try {
    let body = await readFile(target)
    if (isPublicPath(pathname) && target.endsWith('index.html')) {
      body = Buffer.from(
        body
          .toString()
          .replace(
            '</head>',
            `${renderHead(pathname, await loadSeoConfig(), languageFor(request))}</head>`
          )
      )
    }
    response.writeHead(200, {
      'content-type': target.endsWith('.html')
        ? 'text/html; charset=utf-8'
        : 'application/octet-stream',
    })
    response.end(request.method === 'HEAD' ? undefined : body)
  } catch {
    response.writeHead(404)
    response.end('Not found')
  }
}

createServer((request, response) =>
  serve(request, response).catch(() => {
    response.writeHead(500)
    response.end('Internal server error')
  })
).listen(port, '0.0.0.0', () =>
  console.log(`SEO server listening on http://0.0.0.0:${port}`)
)
