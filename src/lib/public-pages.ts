import { DOC_GUIDES } from '../features/docs/lib/guide-catalog'
import {
  buildGuideDocument,
  type GuideContentBlock,
} from '../features/docs/lib/guide-content'
import guideTranslations from './public-guide-translations.json'

export const origin = 'https://cbapi.ai'
export type PublicPage = {
  path: string
  title: string
  description: string
  canonical: string
  index: boolean
  guide?: string
}
export type SeoConfig = {
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  seoOgImage?: string
}
const LOCALIZED_SEO_DEFAULTS = {
  en: {
    description: 'CBAPI provides AI API access, integration documentation, and model pricing for developers.',
    keywords: 'CBAPI, AI API, API gateway, Claude API, GPT API, Gemini API, AI model pricing',
  },
  zhCN: {
    description: 'CBAPI 为开发者提供 AI API 接入、配置文档与模型价格查询。',
    keywords: 'CBAPI, AI API, API 中转, API 接入, Claude API, GPT API, Gemini API, AI 模型价格',
  },
  zhTW: {
    description: 'CBAPI 為開發者提供 AI API 接入、設定文件與模型價格查詢。',
    keywords: 'CBAPI, AI API, API 中轉, API 接入, Claude API, GPT API, Gemini API, AI 模型價格',
  },
  ja: {
    description: 'CBAPI は開発者向けに AI API 接続、設定ドキュメント、モデル価格を提供します。',
    keywords: 'CBAPI, AI API, API ゲートウェイ, Claude API, GPT API, Gemini API, AI モデル価格',
  },
} as const
const page = (
  path: string,
  title: string,
  description: string,
  guide?: string
): PublicPage => ({
  path,
  title,
  description,
  canonical: origin + path,
  index: true,
  guide,
})
export const publicPages: PublicPage[] = [
  page(
    '/',
    'CBAPI',
    'CBAPI 为开发者提供统一的 AI API 中转服务，支持 Claude、GPT、Gemini 等主流模型。提供接入文档、实时价格与账户管理。'
  ),
  page(
    '/pricing',
    'CBAPI',
    '查询 CBAPI 当前公开模型和价格。模型可用性、计费单位与账户分组价格以实时页面及实际用量记录为准。'
  ),
  page(
    '/docs',
    'CBAPI',
    '查阅 CBAPI 的 Codex、Claude Code 和其他工具接入指南，了解端点、API Key 配置与验证步骤。'
  ),
  ...DOC_GUIDES.map((guide) =>
    page(
      `/docs/${guide.slug}`,
      `${(guideTranslations as Record<string, string>)[guide.title] || guide.title}｜CBAPI`,
      (
        (guideTranslations as Record<string, string>)[guide.description] ||
        guide.description
      ).replaceAll('CBAPI', 'CBAPI'),
      guide.slug
    )
  ),
  page(
    '/docs/codex/start',
    'Codex 交互式接入教程｜CBAPI',
    '按照已有 Codex 指南配置端点和 API Key，再通过交互式步骤验证连接。',
    'codex'
  ),
  page(
    '/docs/claude-code/start',
    'Claude Code 交互式接入教程｜CBAPI',
    '按照已有 Claude Code 指南配置端点和 API Key，再通过交互式步骤验证连接。',
    'claude-code'
  ),
]
export function getPage(pathname: string): PublicPage {
  const path = pathname.replace(/\/+$/, '') || '/'
  return (
    publicPages.find((item) => item.path === path) ?? {
      path,
      title: 'CBAPI',
      description: 'CBAPI 开发者平台',
      canonical: origin + path,
      index: false,
    }
  )
}
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
function blockHtml(block: GuideContentBlock): string {
  const e = escapeHtml
  switch (block.type) {
    case 'code':
      return `<pre><code>${e(block.code)}</code></pre>`
    case 'heading':
      return `<h3>${e(block.text.zh)}</h3>`
    case 'paragraph':
    case 'label':
    case 'note':
      return `<p>${e(block.text.zh)}</p>`
    case 'inline-link':
      return `<p>${e(block.before.zh)}<a href="${e(block.href)}">${e(block.label.zh)}</a>${e(block.after.zh)}</p>`
    case 'list':
      return `<ul>${block.items.map((item) => `<li>${e(item.zh)}</li>`).join('')}</ul>`
    case 'table':
      return `<table><thead><tr>${block.headers.map((item) => `<th>${e(item.zh)}</th>`).join('')}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((item) => `<td>${e(item.zh)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    case 'actions':
      return '<p><a href="/keys">创建 API Key</a> · <a href="/pricing">查看模型价格</a></p>'
  }
}
export function renderPageBody(item: PublicPage, runtime = false): string {
  const e = escapeHtml
  let content = `<h1>${e(item.title)}</h1><p>${e(item.description)}</p>`
  if (item.guide) {
    const doc = buildGuideDocument(item.guide, origin, `${origin}/v1`, origin)
    if (doc.lead) content += `<p>${e(doc.lead.zh)}</p>`
    content += (doc.leadItems ?? [])
      .map((text) => `<p>${e(text.zh)}</p>`)
      .join('')
    if (doc.leadAfter) content += `<p>${e(doc.leadAfter.zh)}</p>`
    content += doc.sections
      .map(
        (section) =>
          `<section id="${e(section.id)}"><h2>${e(section.title.zh)}</h2>${section.blocks.map(blockHtml).join('')}</section>`
      )
      .join('')
  } else if (item.path === '/docs') {
    content += `<ul>${publicPages
      .filter((entry) => entry.guide)
      .map(
        (entry) =>
          `<li><a href="${entry.path}">${e(entry.title)}</a><p>${e(entry.description)}</p></li>`
      )
      .join('')}</ul>`
  } else if (item.path === '/pricing') {
    content +=
      '<h2>如何核对费用</h2><p>请在页面中的模型目录确认模型名称、输入与输出费用以及适用单位。账户分组、缓存及附加工具费用可能影响最终费用；请同时核对账户设置与用量记录。未显示价格的模型不表示免费或可用。</p>'
  } else {
    content +=
      '<h2>开始接入</h2><ol><li>在文档中选择你的工具与协议。</li><li>登录账户，创建并妥善保存 API Key。</li><li>核对可用模型与价格后，按指南验证连接。</li></ol><p>本站首页演示界面中的模型与费用占位信息不构成实际服务或价格承诺。</p>'
  }
  if (runtime && item.path === '/pricing') {
    content = content
      .replaceAll('<h2>', '<h3>')
      .replaceAll('</h2>', '</h3>')
      .replaceAll('<h1>', '<h2>')
      .replaceAll('</h1>', '</h2>')
  }
  return `<article lang="zh-CN">${content}<nav aria-label="公开页面"><a href="/">CBAPI</a> · <a href="/docs">接入文档</a> · <a href="/pricing">模型价格</a> · <a href="/about">关于</a> · <a href="/sign-up">开始接入</a></nav></article>`
}
export function renderHead(
  item: PublicPage,
  preview = true,
  seoConfig: SeoConfig = {},
  language = 'zhCN'
): string {
  const e = escapeHtml
  const localized = LOCALIZED_SEO_DEFAULTS[language as keyof typeof LOCALIZED_SEO_DEFAULTS] ?? LOCALIZED_SEO_DEFAULTS.zhCN
  const keywords = seoConfig.seoKeywords?.trim() || localized.keywords
  const title = seoConfig.seoTitle?.trim() || item.title
  const description = seoConfig.seoDescription?.trim() || (language === 'en' ? localized.description : item.description)
  const image = seoConfig.seoOgImage?.trim() || `${origin}/logo.png`
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: item.canonical,
    description,
    isPartOf: { '@type': 'WebSite', name: 'CBAPI', url: origin },
  }
  return `<title>${e(title)}</title><meta name="title" content="${e(title)}"><meta name="description" content="${e(description)}"><meta name="keywords" content="${e(keywords)}"><meta name="robots" content="${preview || !item.index ? 'noindex, nofollow' : 'index, follow'}"><link rel="canonical" href="${e(item.canonical)}"><meta data-cbapi-seo property="og:site_name" content="CBAPI"><meta data-cbapi-seo property="og:title" content="${e(title)}"><meta data-cbapi-seo property="og:description" content="${e(description)}"><meta data-cbapi-seo property="og:url" content="${e(item.canonical)}"><meta data-cbapi-seo property="og:type" content="website"><meta data-cbapi-seo property="og:image" content="${e(image)}"><meta data-cbapi-seo name="twitter:card" content="summary"><meta data-cbapi-seo name="twitter:title" content="${e(title)}"><meta data-cbapi-seo name="twitter:description" content="${e(description)}"><meta data-cbapi-seo name="twitter:image" content="${e(image)}"><script data-cbapi-seo type="application/ld+json">${JSON.stringify({ ...schema, name: title, description }).replaceAll('<', '\\u003c')}</script>`
}
