import { useLocation } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { getPage, renderHead } from '@/lib/public-pages'

export function PublicSeo() {
  const location = useLocation()
  const { i18n } = useTranslation()
  useEffect(() => {
    const preview =
      document
        .querySelector('meta[name="seo-preview"]')
        ?.getAttribute('content') !== 'false'
    const template = document.createElement('template')
    template.innerHTML = renderHead(
      getPage(location.pathname),
      preview,
      {},
      i18n.language
    )
    document.head
      .querySelectorAll(
        'title, meta[name="title"], meta[name="description"], meta[name="keywords"], meta[name="robots"], link[rel="canonical"], [data-apiporter-seo]'
      )
      .forEach((node) => node.remove())
    document.head.append(template.content)
    document.querySelector('#public-fallback')?.remove()
  }, [location.pathname, i18n.language])
  // 首页使用 iframe 渲染 landing page，不需要额外的可见 SEO 内容
  // pricing 页面已有完整的模型列表，不需要 fallback 内容
  return null
}
