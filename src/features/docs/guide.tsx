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
import { Link } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, Braces, Rocket } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { PublicLegalFooter } from '@/components/layout/components/public-legal-footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { IntegrationGuideContent } from './components/integration-guide-content'
import { resolveCodexApiBaseUrl } from './lib/codex-config'
import { resolveGuideBaseUrl, type DocsGuide } from './lib/guide-catalog'
import type { GuideTocItem } from './lib/guide-content'
import { useGuideDocument } from './lib/use-guide-document'

function SectionLinks(props: {
  compact?: boolean
  items: readonly GuideTocItem[]
  localize: ReturnType<typeof useGuideDocument>['localize']
}) {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t('On this page')}
      className={
        props.compact
          ? 'flex min-w-max items-center gap-1'
          : 'flex flex-col gap-1'
      }
    >
      {props.items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={
            props.compact
              ? 'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-2'
              : `text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring rounded-lg py-2 pr-3 text-sm leading-5 transition-colors outline-none focus-visible:ring-2 ${item.depth === 2 ? 'pl-6' : 'pl-3'}`
          }
        >
          {props.localize(item.text)}
        </a>
      ))}
    </nav>
  )
}

export function GuideDocs(props: { guide: DocsGuide }) {
  const { t } = useTranslation()
  const browserOrigin =
    typeof window === 'undefined'
      ? 'https://api.example.com'
      : window.location.origin
  const apiBaseUrl = resolveCodexApiBaseUrl(browserOrigin)
  const guideBaseUrl = resolveGuideBaseUrl(apiBaseUrl, props.guide.endpoint)
  const rootUrl = resolveGuideBaseUrl(apiBaseUrl, 'root')
  const v1Url = resolveGuideBaseUrl(apiBaseUrl, 'v1')
  const { document, localize } = useGuideDocument(
    props.guide.slug,
    rootUrl,
    v1Url,
    browserOrigin
  )
  const tocItems =
    document.toc ||
    document.sections.map((section) => ({
      id: section.id,
      text: section.title,
    }))
  return (
    <PublicLayout showMainContainer={false}>
      <main
        id='main-content'
        className='mx-auto w-full max-w-[1280px] px-4 pt-20 pb-20 sm:px-6 lg:px-8'
      >
        <div className='border-border flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between'>
          <Link
            to='/docs'
            className='text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-3 text-sm font-bold outline-none focus-visible:ring-2'
          >
            <ArrowLeft className='size-4' aria-hidden='true' />
            <span>{t('Back to documentation')}</span>
          </Link>
          <div className='flex flex-wrap gap-2'>
            {props.guide.slug === 'claude-code' ? (
              <Button render={<Link to='/docs/claude-code/start' />}>
                <Rocket aria-hidden='true' />
                {t('Start interactive tutorial')}
              </Button>
            ) : null}
          </div>
        </div>

        <header className='border-border border-b py-10 sm:py-12'>
          <div className='text-primary flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase'>
            <span className='bg-primary/10 inline-flex size-6 items-center justify-center rounded-md'>
              <Braces className='size-3.5' aria-hidden='true' />
            </span>
            {t('ApiPorter API integration documentation')}
          </div>
          <h1 className='mt-5 text-4xl font-bold tracking-[-0.045em] text-balance sm:text-5xl md:text-6xl'>
            {t(props.guide.title)}
          </h1>
          <p className='text-muted-foreground mt-5 max-w-3xl text-base leading-7 sm:text-lg'>
            {t(props.guide.description)}
          </p>
          <div className='mt-8 grid gap-3 sm:grid-cols-2'>
            <div className='border-border bg-muted/35 rounded-lg border px-4 py-3'>
              <p className='text-muted-foreground text-xs font-semibold'>
                Base URL
              </p>
              <code className='mt-1 block text-sm leading-5 font-semibold break-all'>
                {guideBaseUrl}
              </code>
            </div>
            {props.guide.exampleModel ? (
              <div className='border-border bg-muted/35 rounded-lg border px-4 py-3'>
                <p className='text-muted-foreground text-xs font-semibold'>
                  {t('Example model')}
                </p>
                <code className='mt-1 block text-sm font-semibold'>
                  {props.guide.exampleModel}
                </code>
              </div>
            ) : null}
          </div>
          <div className='mt-5'>
            <p className='text-muted-foreground text-xs font-semibold'>
              {t('Compatible protocols')}
            </p>
            <div className='mt-2 flex flex-wrap gap-2'>
              {props.guide.protocols.map((protocol) => (
                <Badge key={protocol} variant='outline'>
                  {t(protocol)}
                </Badge>
              ))}
            </div>
          </div>
        </header>

        <div className='border-border overflow-x-auto border-b py-2 xl:hidden'>
          <SectionLinks compact items={tocItems} localize={localize} />
        </div>

        <div className='mt-10 grid gap-12 xl:grid-cols-[minmax(0,880px)_200px] xl:justify-between'>
          <article className='min-w-0'>
            {document.lead || document.leadItems || document.leadAfter ? (
              <div className='text-muted-foreground border-border mb-14 space-y-4 border-b pb-10 text-base leading-8'>
                {document.lead ? <p>{localize(document.lead)}</p> : null}
                {document.leadItems ? (
                  <ul className='space-y-2 pl-6'>
                    {document.leadItems.map((item) => (
                      <li key={item.en} className='list-disc'>
                        {localize(item)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {document.leadAfter ? (
                  <p>{localize(document.leadAfter)}</p>
                ) : null}
              </div>
            ) : null}
            <IntegrationGuideContent
              slug={props.guide.slug}
              rootUrl={rootUrl}
              v1Url={v1Url}
              siteUrl={browserOrigin}
            />
          </article>

          <aside className='hidden xl:block'>
            <div className='sticky top-20 space-y-3'>
              <p className='text-foreground px-3 text-xs font-bold tracking-[0.12em] uppercase'>
                {t('On this page')}
              </p>
              <SectionLinks items={tocItems} localize={localize} />
            </div>
          </aside>
        </div>
      </main>
      <PublicLegalFooter />
    </PublicLayout>
  )
}

export function GuideNotFound() {
  const { t } = useTranslation()

  return (
    <PublicLayout showMainContainer={false}>
      <main
        id='main-content'
        className='flex min-h-[70vh] items-center justify-center px-4 pt-20 pb-16'
      >
        <div className='border-border bg-card w-full max-w-xl rounded-2xl border p-8 text-center shadow-sm'>
          <BookOpen
            className='text-primary mx-auto size-8'
            aria-hidden='true'
          />
          <h1 className='mt-5 text-2xl font-bold'>{t('Guide not found')}</h1>
          <p className='text-muted-foreground mt-3 leading-7'>
            {t(
              'This guide is not available. Return to the documentation home to choose a supported integration.'
            )}
          </p>
          <Button className='mt-6 min-h-11' render={<Link to='/docs' />}>
            <ArrowLeft aria-hidden='true' />
            {t('Back to documentation')}
          </Button>
        </div>
      </main>
    </PublicLayout>
  )
}
