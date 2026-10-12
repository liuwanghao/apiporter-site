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
import { Zap, ExternalLink, Gauge } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  getLatencyColorClass,
  openExternalSpeedTest,
} from '@/features/dashboard/lib/api-info'
import type { ApiInfoItem, PingStatus } from '@/features/dashboard/types'
import { getBgColorClass } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface ApiInfoItemProps {
  item: ApiInfoItem
  status: PingStatus
  onTest: (url: string) => void
}

export function ApiInfoItemComponent(props: ApiInfoItemProps) {
  const { t } = useTranslation()
  const item = props.item
  const status = props.status

  return (
    <div className='group border-border/50 bg-background/50 hover:border-primary/30 hover:bg-muted/40 relative flex items-center justify-between gap-3 rounded-md border p-3.5 transition-all duration-200 hover:shadow-2xs'>
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <span
          className={cn(
            'inline-block size-2.5 shrink-0 rounded-full shadow-xs',
            getBgColorClass(item.color)
          )}
        />

        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <div className='flex items-baseline gap-2'>
            <span className='text-foreground font-mono text-sm font-bold'>
              {item.route}
            </span>
            {item.description && (
              <span className='text-muted-foreground/80 truncate text-xs'>
                {item.description}
              </span>
            )}
          </div>
          <span className='text-muted-foreground/70 truncate font-mono text-[11px]'>
            {item.url}
          </span>
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        <div className='flex items-center'>
          {status.testing && (
            <StatusBadge
              label={t('Testing...')}
              variant='warning'
              className='animate-pulse text-[11px]'
              copyable={false}
            />
          )}
          {status.latency !== null && !status.testing && (
            <StatusBadge
              variant='success'
              label={`${status.latency}${t('ms')}`}
              className={cn(
                'font-mono text-[11px] font-semibold',
                getLatencyColorClass(status.latency)
              )}
              copyable={false}
            />
          )}
          {status.error && (
            <StatusBadge
              label={t('N/A')}
              variant='neutral'
              className='text-[11px]'
              copyable={false}
            />
          )}
        </div>

        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => props.onTest(item.url)}
            disabled={status.testing}
            className='hover:bg-primary/10 hover:text-primary size-8 rounded-md p-0'
            title={t('Test Latency')}
          >
            <Zap
              className={cn(
                'size-3.5',
                status.testing && 'animate-pulse text-amber-500'
              )}
            />
          </Button>

          <Button
            variant='ghost'
            size='sm'
            onClick={() => openExternalSpeedTest(item.url)}
            className='hover:bg-primary/10 hover:text-primary hidden size-8 rounded-md p-0 sm:inline-flex'
            title={t('External Speed Test')}
          >
            <Gauge className='size-3.5' aria-hidden='true' />
          </Button>

          <CopyButton
            value={item.url}
            variant='ghost'
            size='sm'
            className='hover:bg-primary/10 hover:text-primary size-8 rounded-md p-0'
            iconClassName='size-3.5'
            tooltip={t('Copy URL')}
            aria-label={t('Copy URL')}
          />

          <Button
            variant='ghost'
            size='sm'
            className='hover:bg-primary/10 hover:text-primary hidden size-8 rounded-md p-0 sm:inline-flex'
            title={t('Open in New Tab')}
            render={<a href={item.url} target='_blank' rel='noreferrer' />}
          >
            <ExternalLink className='size-3.5' aria-hidden='true' />
          </Button>
        </div>
      </div>
    </div>
  )
}
