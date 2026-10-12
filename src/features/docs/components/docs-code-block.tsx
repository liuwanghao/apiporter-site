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
import { Check, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

type DocsCodeBlockProps = {
  code: string
  label?: string
  className?: string
  compact?: boolean
}

export function DocsCodeBlock(props: DocsCodeBlockProps) {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard({ notify: false })
  const copied = copiedText === props.code

  if (props.compact) {
    return (
      <div
        className={cn(
          'border-border bg-muted/45 relative min-w-0 max-w-full overflow-hidden rounded-lg border',
          props.className
        )}
      >
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className='bg-muted/80 absolute top-2 right-2 z-10 size-9'
          aria-label={copied ? t('Copied') : t('Copy code')}
          onClick={() => void copyToClipboard(props.code)}
        >
          {copied ? <Check aria-hidden='true' /> : <Copy aria-hidden='true' />}
        </Button>
        <pre className='max-h-[34rem] w-full max-w-full overflow-auto p-4 pr-14 text-[13px] leading-6'>
          <code>{props.code}</code>
        </pre>
        <span className='sr-only' aria-live='polite'>
          {copied ? t('Copied to clipboard') : ''}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-border bg-card min-w-0 max-w-full overflow-hidden rounded-xl border shadow-xs',
        props.className
      )}
    >
      <div className='border-border bg-muted/45 flex min-h-11 items-center justify-between gap-3 border-b px-3'>
        <span className='text-muted-foreground text-xs font-semibold tracking-wide'>
          {props.label || t('Terminal')}
        </span>
        <Button
          type='button'
          variant='ghost'
          className='h-11 min-w-11 gap-2 px-3 text-xs'
          aria-label={copied ? t('Copied') : t('Copy code')}
          onClick={() => void copyToClipboard(props.code)}
        >
          {copied ? <Check aria-hidden='true' /> : <Copy aria-hidden='true' />}
          <span>{copied ? t('Copied') : t('Copy code')}</span>
        </Button>
      </div>
      <pre className='max-h-[34rem] w-full max-w-full overflow-auto p-4 text-[13px] leading-6'>
        <code>{props.code}</code>
      </pre>
      <span className='sr-only' aria-live='polite'>
        {copied ? t('Copied to clipboard') : ''}
      </span>
    </div>
  )
}
