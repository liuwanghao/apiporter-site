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
  CircleAlert,
  CircleCheck,
  Info,
  KeyRound,
  Route as RouteIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import type { GuideContentBlock } from '../lib/guide-content'
import {
  type LocalizeGuideText,
  useGuideDocument,
} from '../lib/use-guide-document'
import { DocsCodeBlock } from './docs-code-block'

type IntegrationGuideContentProps = {
  slug: string
  rootUrl: string
  v1Url: string
  siteUrl?: string
}

function GuideAction(props: {
  action: 'codex-app' | 'keys' | 'models' | 'usage'
}) {
  const { t } = useTranslation()

  if (props.action === 'codex-app') {
    return (
      <Button
        size='lg'
        variant='outline'
        render={
          <a
            href='https://developers.openai.com/codex/app'
            target='_blank'
            rel='noreferrer'
          />
        }
      >
        {t('Download Codex App')}
        <ArrowRight aria-hidden='true' />
      </Button>
    )
  }

  if (props.action === 'keys') {
    return (
      <Button size='lg' render={<Link to='/keys' />}>
        <KeyRound aria-hidden='true' />
        {t('Create API key')}
      </Button>
    )
  }

  if (props.action === 'models') {
    return (
      <Button size='lg' variant='outline' render={<Link to='/pricing' />}>
        {t('Browse models')}
        <ArrowRight aria-hidden='true' />
      </Button>
    )
  }

  return (
    <Button size='lg' variant='outline' render={<Link to='/usage-logs' />}>
      <RouteIcon aria-hidden='true' />
      {t('Open usage logs')}
    </Button>
  )
}

function ContentBlock(props: {
  block: GuideContentBlock
  localize: LocalizeGuideText
  compactLayout?: boolean
}) {
  const { block, compactLayout, localize } = props

  switch (block.type) {
    case 'paragraph':
      return (
        <p
          className={cn(
            'text-muted-foreground text-[15px] sm:text-base',
            compactLayout ? 'my-2 leading-[26px]' : 'leading-7'
          )}
        >
          {localize(block.text)}
        </p>
      )
    case 'label':
      return (
        <p className='text-foreground my-2 text-base leading-[26px] font-semibold'>
          {localize(block.text)}
        </p>
      )
    case 'inline-link':
      return (
        <p
          className={cn(
            'text-muted-foreground text-[15px] sm:text-base',
            compactLayout ? 'my-2 leading-[26px]' : 'leading-7'
          )}
        >
          {localize(block.before)}
          <a
            href={block.href}
            target={block.external ? '_blank' : undefined}
            rel={block.external ? 'noreferrer' : undefined}
            className='text-foreground decoration-primary/60 hover:text-primary font-semibold underline underline-offset-4 transition-colors'
          >
            {localize(block.label)}
          </a>
          {localize(block.after)}
        </p>
      )
    case 'heading':
      if (block.level === 4) {
        return (
          <h4
            id={block.id}
            className={cn(
              'text-foreground scroll-mt-24 text-base font-bold',
              compactLayout ? 'mt-6 mb-2' : 'pt-2'
            )}
          >
            {localize(block.text)}
          </h4>
        )
      }
      return (
        <h3
          id={block.id}
          className={cn(
            'text-foreground scroll-mt-24 font-bold tracking-[-0.015em]',
            compactLayout ? 'mt-9 mb-2 text-xl' : 'pt-2 text-lg'
          )}
        >
          {localize(block.text)}
        </h3>
      )
    case 'code':
      return (
        <DocsCodeBlock
          code={block.code}
          label={block.label}
          compact={block.compact}
          className={compactLayout ? 'my-2' : undefined}
        />
      )
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul'
      return (
        <List
          className={cn(
            'text-muted-foreground space-y-2 pl-6 text-[15px] leading-7 sm:text-base',
            block.ordered ? 'list-decimal' : 'list-disc'
          )}
        >
          {block.items.map((item) => (
            <li key={item.en}>{localize(item)}</li>
          ))}
        </List>
      )
    }
    case 'note': {
      let Icon = Info
      if (block.tone === 'success') Icon = CircleCheck
      if (block.tone === 'warning') Icon = CircleAlert
      return (
        <Alert
          className={cn(
            'p-4',
            compactLayout && 'my-2',
            block.tone === 'success' && 'border-success/25 bg-success/5',
            block.tone === 'warning' && 'border-warning/30 bg-warning/5'
          )}
        >
          <Icon aria-hidden='true' />
          {block.title ? (
            <AlertTitle>{localize(block.title)}</AlertTitle>
          ) : null}
          <AlertDescription>{localize(block.text)}</AlertDescription>
        </Alert>
      )
    }
    case 'table':
      return (
        <div className='border-border overflow-x-auto rounded-xl border'>
          <Table>
            <TableHeader>
              <TableRow>
                {block.headers.map((header) => (
                  <TableHead key={localize(header)} className='px-4'>
                    {localize(header)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.rows.map((row) => (
                <TableRow key={row.map((cell) => cell.en).join('|')}>
                  {row.map((cell) => (
                    <TableCell
                      key={cell.en}
                      className={cn(
                        'px-4 leading-6 whitespace-normal',
                        cell === row[0]
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground'
                      )}
                    >
                      {localize(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    case 'actions':
      return (
        <div className='flex flex-wrap gap-3'>
          {block.actions.map((action) => (
            <GuideAction key={action} action={action} />
          ))}
        </div>
      )
  }
}

function getBlockKey(block: GuideContentBlock): string {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'label':
      return `${block.type}-${block.text.en}`
    case 'inline-link':
      return `inline-link-${block.label.en}-${block.href}`
    case 'code':
      return `code-${block.label || ''}-${block.code}`
    case 'list':
      return `list-${block.items.map((item) => item.en).join('|')}`
    case 'note':
      return `note-${block.title?.en || block.text.en}`
    case 'table':
      return `table-${block.headers.map((header) => header.en).join('|')}`
    case 'actions':
      return `actions-${block.actions.join('|')}`
  }
}

function getKeyedBlocks(blocks: readonly GuideContentBlock[]) {
  const occurrences = new Map<string, number>()

  return blocks.map((block) => {
    const baseKey = getBlockKey(block)
    const occurrence = (occurrences.get(baseKey) || 0) + 1
    occurrences.set(baseKey, occurrence)

    return {
      block,
      key: `${baseKey}-${occurrence}`,
    }
  })
}

export function IntegrationGuideContent(props: IntegrationGuideContentProps) {
  const { document, localize } = useGuideDocument(
    props.slug,
    props.rootUrl,
    props.v1Url,
    props.siteUrl
  )
  const compactLayout = true

  return (
    <div
      className={cn(
        'max-w-full min-w-0',
        compactLayout ? 'space-y-0' : 'space-y-16'
      )}
    >
      {document.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className={cn(
            'border-border max-w-full min-w-0 scroll-mt-24 border-b last:border-b-0 last:pb-0',
            section.level === 3
              ? 'border-b-0 pt-8 pb-2'
              : 'pt-14 pb-8 first:pt-0'
          )}
        >
          <div
            className={cn(
              compactLayout ? 'mb-[22px]' : 'space-y-2',
              section.level === 3 && 'mb-3'
            )}
          >
            {section.eyebrow ? (
              <p className='text-primary text-xs font-bold tracking-[0.16em] uppercase'>
                {localize(section.eyebrow)}
              </p>
            ) : null}
            {section.level === 3 ? (
              <h3 className='text-foreground text-xl font-bold tracking-[-0.015em]'>
                {localize(section.title)}
              </h3>
            ) : (
              <h2 className='text-foreground text-2xl font-bold tracking-[-0.025em] md:text-[28px]'>
                {localize(section.title)}
              </h2>
            )}
          </div>

          {getKeyedBlocks(section.blocks).map(({ block, key }) => (
            <ContentBlock
              key={`${section.id}-${key}`}
              block={block}
              localize={localize}
              compactLayout={compactLayout}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
