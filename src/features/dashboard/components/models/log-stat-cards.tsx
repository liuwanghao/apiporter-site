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
import { CircleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IconBadge } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { useModelStatCardsConfig } from '@/features/dashboard/hooks/use-dashboard-config'
import {
  buildQueryParams,
  calculateCacheHitRate,
  calculateDashboardStats,
  getDefaultDays,
} from '@/features/dashboard/lib'
import type {
  QuotaDataItem,
  DashboardFilters,
} from '@/features/dashboard/types'
import { toIntlLocale } from '@/i18n/languages'
import { formatCompactNumber, formatNumber, formatQuota } from '@/lib/format'
import { computeTimeRange } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

interface LogStatCardsProps {
  filters?: DashboardFilters
  onDataUpdate?: (data: QuotaDataItem[], loading: boolean) => void
}

interface DashboardStats {
  totalQuota: number
  totalCount: number
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
}

const MAX_INLINE_STAT_CHARS = 9

function formatStatNumber(value: number, locale: Intl.LocalesArgument) {
  const fullValue = formatNumber(value, locale)
  const displayValue =
    fullValue.length > MAX_INLINE_STAT_CHARS
      ? formatCompactNumber(value, locale)
      : fullValue

  return {
    displayValue,
    fullValue,
  }
}

function formatDashboardTokens(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  return value.toLocaleString()
}

function TokenStatistics(props: {
  t: (key: string) => string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
}) {
  const cacheRate = calculateCacheHitRate(props)

  return (
    <div className='mt-auto grid min-w-0 grid-cols-2 gap-2 pt-5 text-xs tabular-nums sm:grid-cols-3'>
      <div className='border-border/60 bg-muted/35 rounded-md border p-2.5'>
        <div className='text-muted-foreground text-[10px] font-medium uppercase'>
          {props.t('Input')}
        </div>
        <div className='text-foreground mt-1 truncate font-mono text-sm font-semibold'>
          {formatDashboardTokens(props.inputTokens)}
        </div>
      </div>
      <div className='border-border/60 bg-muted/35 rounded-md border p-2.5'>
        <div className='text-muted-foreground text-[10px] font-medium uppercase'>
          {props.t('Output')}
        </div>
        <div className='text-foreground mt-1 truncate font-mono text-sm font-semibold'>
          {formatDashboardTokens(props.outputTokens)}
        </div>
      </div>
      <div className='border-border/60 bg-muted/35 col-span-2 rounded-md border p-2.5 sm:col-span-1'>
        <div className='text-muted-foreground flex items-center gap-1 text-[10px] font-medium uppercase'>
          <span>{props.t('Cache Hit Rate')}</span>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type='button'
                  className='text-muted-foreground hover:text-foreground inline-flex size-4 items-center justify-center rounded-full'
                  aria-label={props.t('Cache token details')}
                />
              }
            >
              <CircleAlert className='size-3.5' />
            </TooltipTrigger>
            <TooltipContent side='top'>
              <div className='space-y-0.5 text-xs'>
                <div>
                  {props.t('Cache Creation')}&nbsp;{' '}
                  {formatDashboardTokens(props.cacheCreationTokens)}
                </div>
                <div>
                  {props.t('Cache Read')}&nbsp;{' '}
                  {formatDashboardTokens(props.cacheReadTokens)}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className='text-foreground mt-1 truncate font-mono text-sm font-semibold'>
          {cacheRate.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

export function LogStatCards(props: LogStatCardsProps) {
  const { i18n, t } = useTranslation()
  const statCardsConfig = useModelStatCardsConfig()
  const user = useAuthStore((state) => state.auth.user)
  const isAdmin = !!(user?.role && user.role >= 10)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [timeRangeMinutes, setTimeRangeMinutes] = useState(0)

  const { filters, onDataUpdate } = props

  useEffect(() => {
    const abortController = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)

    setError(false)
    onDataUpdate?.([], true)

    const timeRange = computeTimeRange(
      getDefaultDays(filters?.time_granularity),
      filters?.start_timestamp,
      filters?.end_timestamp
    )
    const timeDiff = (timeRange.end_timestamp - timeRange.start_timestamp) / 60
    setTimeRangeMinutes(timeDiff)

    void getUserQuotaDates(buildQueryParams(timeRange, filters), isAdmin)
      .then((res) => {
        if (abortController.signal.aborted) return
        const data = res?.data || []
        setStats(calculateDashboardStats(data))
        onDataUpdate?.(data, false)
      })
      .catch(() => {
        if (abortController.signal.aborted) return
        setStats(null)
        setError(true)
        onDataUpdate?.([], false)
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      abortController.abort()
    }
  }, [filters, isAdmin, onDataUpdate])

  const adaptedStats = {
    rpm: stats?.totalCount ?? 0,
    quota: stats?.totalQuota ?? 0,
    tpm: stats?.totalTokens ?? 0,
    inputTokens: stats?.inputTokens ?? 0,
    outputTokens: stats?.outputTokens ?? 0,
    cacheReadTokens: stats?.cacheReadTokens ?? 0,
    cacheCreationTokens: stats?.cacheCreationTokens ?? 0,
  }

  const items = statCardsConfig.map((config) => {
    const rawValue = config.getValue(adaptedStats, timeRangeMinutes)
    const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
    let formatted: { displayValue: string; fullValue: string }
    if (config.key === 'quota') {
      formatted = {
        displayValue: formatQuota(rawValue),
        fullValue: formatQuota(rawValue),
      }
    } else if (config.key === 'tokens') {
      formatted = {
        displayValue: formatDashboardTokens(rawValue),
        fullValue: formatNumber(rawValue, locale),
      }
    } else {
      formatted = formatStatNumber(rawValue, locale)
    }

    return {
      key: config.key,
      title: config.title,
      value: formatted.displayValue,
      fullValue: formatted.fullValue,
      desc: config.description,
      icon: config.icon,
      iconTone: config.iconTone,
    }
  })
  const featuredItem = items.find((item) => item.key === 'tokens')
  const displayItems = featuredItem
    ? [featuredItem, ...items.filter((item) => item.key !== 'tokens')]
    : items

  return (
    <div
      data-slot='dashboard-stat-grid'
      className='grid min-w-0 grid-cols-2 gap-2.5 md:grid-cols-4 xl:auto-rows-fr xl:grid-cols-12'
    >
      {displayItems.map((it) => {
        const Icon = it.icon
        const isFeatured = it.key === 'tokens'
        let valueContent
        if (loading) {
          valueContent = (
            <div className='mt-3 flex flex-col gap-1.5'>
              <Skeleton className={cn('w-20', isFeatured ? 'h-9' : 'h-7')} />
              <Skeleton className='h-3.5 w-28' />
            </div>
          )
        } else if (error) {
          valueContent = (
            <>
              <div
                className={cn(
                  'text-muted-foreground mt-3 font-mono leading-tight font-bold tracking-tight tabular-nums',
                  isFeatured ? 'text-3xl' : 'text-2xl'
                )}
              >
                --
              </div>
              <div className='text-muted-foreground/50 mt-1 text-xs'>
                {it.desc}
              </div>
            </>
          )
        } else {
          valueContent = (
            <>
              <div
                className={cn(
                  'text-foreground mt-3 max-w-full truncate font-mono leading-tight font-bold tracking-tight tabular-nums',
                  isFeatured ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                )}
                title={it.fullValue}
              >
                {it.value}
              </div>
              {it.key === 'tokens' ? (
                <TokenStatistics
                  t={t}
                  inputTokens={stats?.inputTokens ?? 0}
                  outputTokens={stats?.outputTokens ?? 0}
                  cacheReadTokens={stats?.cacheReadTokens ?? 0}
                  cacheCreationTokens={stats?.cacheCreationTokens ?? 0}
                />
              ) : (
                <div className='text-muted-foreground/60 mt-1.5 text-xs'>
                  {it.desc}
                </div>
              )}
            </>
          )
        }

        return (
          <div
            key={it.title}
            data-slot='dashboard-stat-card'
            data-emphasis={isFeatured ? 'primary' : 'secondary'}
            className={cn(
              'border-border/80 bg-card relative flex min-w-0 flex-col overflow-hidden rounded-lg border p-3.5 shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-primary/25 hover:shadow-sm motion-reduce:transition-none sm:p-4',
              isFeatured
                ? 'col-span-2 min-h-48 md:col-span-4 xl:col-span-4 xl:row-span-2'
                : 'col-span-1 min-h-28 md:col-span-2 xl:col-span-4'
            )}
          >
            <div className='flex min-w-0 items-center gap-2'>
              <IconBadge
                tone={it.iconTone}
                size={isFeatured ? 'md' : 'stat'}
                className={cn(
                  'rounded-md',
                  isFeatured ? 'size-9 [&>svg]:size-4' : 'size-8 [&>svg]:size-4'
                )}
              >
                <Icon />
              </IconBadge>
              <div className='text-muted-foreground truncate text-xs leading-4 font-semibold tracking-wide uppercase'>
                {it.title}
              </div>
            </div>

            {valueContent}
          </div>
        )
      })}
    </div>
  )
}
