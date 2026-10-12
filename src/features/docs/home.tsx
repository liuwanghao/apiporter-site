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
import {
  ArrowRight,
  BookOpen,
  Bot,
  Braces,
  Check,
  Code2,
  Copy,
  ImageIcon,
  KeyRound,
  Search,
  Settings2,
  Sparkles,
  SquareTerminal,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

import { resolveCodexApiBaseUrl } from './lib/codex-config'
import {
  DOC_GUIDES,
  filterGuideCatalog,
  resolveGuideBaseUrl,
  type DocsGuide,
  type GuideIconName,
} from './lib/guide-catalog'

const GUIDE_ICONS: Record<GuideIconName, LucideIcon> = {
  bot: Bot,
  braces: Braces,
  code: Code2,
  image: ImageIcon,
  settings: Settings2,
  sparkles: Sparkles,
  terminal: SquareTerminal,
  video: Video,
}

function ApiBaseUrl(props: { value: string }) {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard({ notify: false })
  const copied = copiedText === props.value

  return (
    <div className='border-border bg-background/85 flex min-w-0 items-center gap-3 rounded-xl border p-3 shadow-xs'>
      <div className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg'>
        <Braces className='size-5' aria-hidden='true' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-muted-foreground text-[11px] font-bold tracking-[0.13em] uppercase'>
          Base URL
        </p>
        <code className='mt-0.5 block truncate text-sm font-bold sm:text-base'>
          {props.value}
        </code>
      </div>
      <Button
        type='button'
        variant='ghost'
        size='icon-lg'
        className='min-h-11 min-w-11'
        aria-label={copied ? t('Copied') : t('Copy base URL')}
        onClick={() => void copyToClipboard(props.value)}
      >
        {copied ? <Check aria-hidden='true' /> : <Copy aria-hidden='true' />}
      </Button>
      <span className='sr-only' aria-live='polite'>
        {copied ? t('Copied to clipboard') : ''}
      </span>
    </div>
  )
}

function GuideCard(props: {
  guide: DocsGuide
  index: number
  apiBaseUrl: string
}) {
  const { t } = useTranslation()
  const Icon = GUIDE_ICONS[props.guide.icon]
  const baseUrl = resolveGuideBaseUrl(props.apiBaseUrl, props.guide.endpoint)

  return (
    <Link
      to='/docs/$guide'
      params={{ guide: props.guide.slug }}
      preload='intent'
      aria-label={t('Open {{title}}', { title: t(props.guide.title) })}
      className={cn(
        'group border-border bg-card focus-visible:ring-ring relative grid min-h-[300px] overflow-hidden rounded-2xl border p-5 shadow-sm outline-none transition duration-200 md:h-[180px] md:min-h-0 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.46fr)] md:gap-6',
        'hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_18px_45px_rgba(36,65,45,0.1)] focus-visible:ring-3',
        'motion-reduce:hover:translate-y-0',
        (props.guide.slug === 'codex' || props.guide.slug === 'claude-code') &&
          'rounded-b-none hover:translate-y-0'
      )}
    >
      <div className='flex min-w-0 flex-col'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex min-w-0 items-center gap-3'>
            <span className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl'>
              <Icon className='size-5' aria-hidden='true' />
            </span>
            <div className='min-w-0'>
              <p className='text-muted-foreground truncate text-xs font-semibold'>
                {t(props.guide.provider)}
              </p>
              <p className='text-foreground mt-0.5 truncate text-sm font-bold'>
                {t(props.guide.category)}
              </p>
            </div>
          </div>
          <span className='text-muted-foreground/55 font-mono text-xs font-bold'>
            {String(props.index + 1).padStart(2, '0')}
          </span>
        </div>

        <h2 className='mt-4 text-xl font-bold tracking-[-0.025em]'>
          {t(props.guide.title)}
        </h2>
        <p className='text-muted-foreground mt-2 line-clamp-2 max-w-3xl text-sm leading-6'>
          {t(props.guide.description)}
        </p>
      </div>

      <div className='border-border mt-5 flex min-w-0 flex-col border-t pt-4 md:mt-0 md:border-t-0 md:border-l md:pt-0 md:pl-6'>
        <div className='flex flex-nowrap gap-1.5 overflow-hidden'>
          {props.guide.protocols.map((protocol) => (
            <Badge
              key={protocol}
              variant='outline'
              className='bg-background/70 shrink-0 px-1.5 text-[10px]'
            >
              {t(protocol)}
            </Badge>
          ))}
        </div>

        <div className='border-border mt-2 divide-y border-y text-xs'>
          <div className='flex min-h-8 min-w-0 items-center justify-between gap-3 py-1.5'>
            <p className='text-muted-foreground font-semibold'>Base URL</p>
            <code className='block max-w-[65%] truncate text-right font-bold'>
              {baseUrl}
            </code>
          </div>
          <div className='flex min-h-8 min-w-0 items-center justify-between gap-3 py-1.5'>
            <p className='text-muted-foreground font-semibold'>
              {t('Example model')}
            </p>
            <code className='block max-w-[65%] truncate text-right font-bold'>
              {props.guide.exampleModel || t('Choose in the client')}
            </code>
          </div>
        </div>

        <div className='text-primary mt-auto flex min-h-9 items-end justify-between pt-2 text-sm font-bold'>
          <span>{t('View setup guide')}</span>
          <ArrowRight
            className='mb-0.5 size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none'
            aria-hidden='true'
          />
        </div>
      </div>
    </Link>
  )
}

function GuideTutorialLink(props: { slug: string }) {
  const { t } = useTranslation()
  if (props.slug !== 'codex' && props.slug !== 'claude-code') return null

  const title = t('{{product}} quick setup', {
    product: props.slug === 'codex' ? 'Codex' : 'Claude Code',
  })

  return (
    <Link
      to={
        props.slug === 'codex' ? '/docs/codex/start' : '/docs/claude-code/start'
      }
      preload='intent'
      aria-label={t('Start interactive tutorial: {{title}}', { title })}
      className='group border-border bg-card hover:bg-muted/50 focus-visible:ring-ring flex min-h-[72px] items-center gap-3 rounded-b-2xl border border-t-0 px-5 py-4 text-sm shadow-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-inset'
    >
      <BookOpen className='size-4 shrink-0' aria-hidden='true' />
      <span className='flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1'>
        <span className='bg-muted shrink-0 rounded-sm px-2 py-0.5 text-xs font-bold'>
          {t('Interactive tutorial')}
        </span>
        <span className='font-semibold'>{title}</span>
      </span>
      <ArrowRight
        className='size-4 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none'
        aria-hidden='true'
      />
    </Link>
  )
}

export function Docs() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const browserOrigin =
    typeof window === 'undefined'
      ? 'https://api.example.com'
      : window.location.origin
  const apiBaseUrl = resolveCodexApiBaseUrl(browserOrigin)
  const guides = useMemo(
    () => filterGuideCatalog(DOC_GUIDES, query, t),
    [query, t]
  )

  return (
    <PublicLayout showMainContainer={false}>
      <main id='main-content'>
        <section className='relative overflow-hidden'>
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,color-mix(in_srgb,var(--primary)_13%,transparent),transparent_27%),radial-gradient(circle_at_88%_32%,color-mix(in_srgb,var(--success)_11%,transparent),transparent_30%)]'
          />
          <div className='relative mx-auto grid w-full max-w-[1508px] gap-10 px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:items-end'>
            <div className='max-w-5xl'>
              <div className='text-primary flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase'>
                <span className='bg-primary size-2 rounded-[2px]' />
                CBAPI API {t('Documentation')}
              </div>
              <h1 className='public-page-title mt-5 max-w-5xl font-bold text-balance'>
                {t('Build with every model through one gateway')}
              </h1>
              <p className='public-page-lead text-muted-foreground mt-6 max-w-3xl'>
                {t(
                  'Choose a client or API workflow, connect a CBAPI key, and move from configuration to a verified request without leaving this site.'
                )}
              </p>
            </div>

            <div className='space-y-3 lg:pb-1'>
              <ApiBaseUrl value={apiBaseUrl} />
              <div className='grid grid-cols-2 gap-3'>
                <Button
                  size='lg'
                  className='min-h-11'
                  render={<Link to='/keys' />}
                >
                  <KeyRound aria-hidden='true' />
                  {t('Create API key')}
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='min-h-11'
                  render={<Link to='/pricing' />}
                >
                  <Sparkles aria-hidden='true' />
                  {t('Browse models')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby='docs-catalog-title'
          className='border-border bg-background/55 border-y'
        >
          <div className='mx-auto w-full max-w-[1508px] px-4 py-12 sm:px-6 sm:py-16'>
            <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
              <div>
                <p className='text-primary text-xs font-bold tracking-[0.16em] uppercase'>
                  {t('CBAPI API guides')}
                </p>
                <h2
                  id='docs-catalog-title'
                  className='public-section-title mt-2 font-bold'
                >
                  {t('Choose your integration path')}
                </h2>
                <p className='text-muted-foreground mt-2 text-sm sm:text-base'>
                  {t(
                    '{{count}} practical guides, all maintained inside CBAPI.',
                    {
                      count: DOC_GUIDES.length,
                    }
                  )}
                </p>
              </div>

              <div className='relative w-full lg:max-w-md'>
                <Search
                  className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
                  aria-hidden='true'
                />
                <Input
                  type='search'
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('Search guides, protocols, or models')}
                  aria-label={t('Search documentation')}
                  className='h-12 pr-12 pl-10'
                />
                {query && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-lg'
                    className='absolute top-1/2 right-0.5 min-h-11 min-w-11 -translate-y-1/2'
                    aria-label={t('Clear search')}
                    onClick={() => setQuery('')}
                  >
                    <X aria-hidden='true' />
                  </Button>
                )}
              </div>
            </div>

            {guides.length > 0 ? (
              <div className='mt-8 grid gap-4'>
                {guides.map((guide) => (
                  <div key={guide.slug} className='min-w-0'>
                    <GuideCard
                      guide={guide}
                      index={DOC_GUIDES.indexOf(guide)}
                      apiBaseUrl={apiBaseUrl}
                    />
                    <GuideTutorialLink slug={guide.slug} />
                  </div>
                ))}
              </div>
            ) : (
              <div className='border-border bg-card mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center'>
                <Search
                  className='text-muted-foreground size-7'
                  aria-hidden='true'
                />
                <h3 className='mt-4 text-lg font-bold'>
                  {t('No guides found')}
                </h3>
                <p className='text-muted-foreground mt-2 max-w-md text-sm leading-6'>
                  {t(
                    'Try a client name such as Codex, a protocol such as Responses API, or a model family.'
                  )}
                </p>
                <Button
                  type='button'
                  variant='outline'
                  className='mt-5 min-h-11'
                  onClick={() => setQuery('')}
                >
                  {t('Show all guides')}
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className='mx-auto grid w-full max-w-[1508px] gap-4 px-4 py-12 sm:px-6 md:grid-cols-3'>
          {[
            {
              to: '/keys' as const,
              label: 'API keys',
              description: 'Create and manage credentials for every guide.',
              icon: KeyRound,
            },
            {
              to: '/pricing' as const,
              label: 'Model catalog',
              description:
                'Confirm model availability and pricing before setup.',
              icon: Sparkles,
            },
            {
              to: '/usage-logs' as const,
              label: 'Usage logs',
              description: 'Verify requests, latency, routing, and errors.',
              icon: SquareTerminal,
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className='border-border bg-card hover:border-primary/30 focus-visible:ring-ring group flex min-h-24 items-center gap-4 rounded-xl border p-4 shadow-xs transition-colors outline-none focus-visible:ring-3'
              >
                <span className='bg-muted text-foreground flex size-11 shrink-0 items-center justify-center rounded-lg'>
                  <Icon className='size-5' aria-hidden='true' />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block font-bold'>{t(item.label)}</span>
                  <span className='text-muted-foreground mt-1 block text-xs leading-5'>
                    {t(item.description)}
                  </span>
                </span>
                <ArrowRight
                  className='text-muted-foreground size-4 transition-transform group-hover:translate-x-1'
                  aria-hidden='true'
                />
              </Link>
            )
          })}
        </section>
      </main>
      <Footer />
    </PublicLayout>
  )
}
