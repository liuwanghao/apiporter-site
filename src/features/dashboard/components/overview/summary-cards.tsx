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
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CreditCard,
  ShieldCheck,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CardStaggerContainer,
  CardStaggerItem,
} from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { useSummaryCardsConfig } from '@/features/dashboard/hooks/use-dashboard-config'
import {
  getRunwayDays,
  getRunwayDisplay,
  resolveCurrencyEnabled,
} from '@/features/dashboard/lib/overview-functionality'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { useStatus } from '@/hooks/use-status'
import { getCurrencyLabel, isCurrencyDisplayEnabled } from '@/lib/currency'
import { formatNumber, formatQuota } from '@/lib/format'
import { computeTimeRange } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const SUMMARY_SPARKLINE_BUCKETS = 12

type SummarySparklineKey = 'balance' | 'usage' | 'requests'
type SummaryMetricTone = 'amber' | 'violet' | 'blue'

interface SummaryMetricItem {
  key: string
  title: string
  value: string
  description: string
  icon: LucideIcon
  sparkline?: number[]
  tone: SummaryMetricTone
}

const METRIC_TONE_CLASSES: Record<
  SummaryMetricTone,
  { icon: string; chart: string }
> = {
  amber: {
    icon: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400',
    chart: 'text-amber-500',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400',
    chart: 'text-violet-500',
  },
  blue: {
    icon: 'bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400',
    chart: 'text-blue-500',
  },
}

function getBucketIndex(
  timestamp: number,
  start: number,
  end: number,
  bucketCount: number
): number {
  if (end <= start) return 0
  const ratio = (timestamp - start) / (end - start)
  return Math.min(bucketCount - 1, Math.max(0, Math.floor(ratio * bucketCount)))
}

function buildSummarySparklines(
  data: QuotaDataItem[],
  currentBalance: number,
  start: number,
  end: number
): Record<SummarySparklineKey, number[]> {
  const usage = Array.from({ length: SUMMARY_SPARKLINE_BUCKETS }, () => 0)
  const requests = Array.from({ length: SUMMARY_SPARKLINE_BUCKETS }, () => 0)

  for (const item of data) {
    const timestamp = Number(item.created_at) || start
    const index = getBucketIndex(
      timestamp,
      start,
      end,
      SUMMARY_SPARKLINE_BUCKETS
    )
    usage[index] += Number(item.quota) || 0
    requests[index] += Number(item.count) || 0
  }

  let balance = currentBalance
  const balanceTrend = Array.from(
    { length: SUMMARY_SPARKLINE_BUCKETS },
    () => 0
  )

  for (let index = SUMMARY_SPARKLINE_BUCKETS - 1; index >= 0; index--) {
    balanceTrend[index] = Math.max(0, balance)
    balance += usage[index]
  }

  return { balance: balanceTrend, usage, requests }
}

function SparklineSvg(props: { data?: number[]; toneClassName: string }) {
  const rawGradientId = useId()
  const gradientId = `summary-sparkline-${rawGradientId.replaceAll(':', '')}`
  const data = props.data ?? []
  if (!data.length) return <div className='h-9' aria-hidden='true' />

  const max = Math.max(...data, 0.0001)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const width = 100
  const height = 36
  const points = data.map((value, index) => {
    const x =
      data.length === 1 ? width / 2 : (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 8) - 4
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`

  return (
    <div
      className={cn('h-9 overflow-hidden', props.toneClassName)}
      aria-hidden='true'
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio='none'
        className='size-full'
      >
        <defs>
          <linearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='currentColor' stopOpacity='0.25' />
            <stop offset='100%' stopColor='currentColor' stopOpacity='0' />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          vectorEffect='non-scaling-stroke'
        />
      </svg>
    </div>
  )
}

function SummaryMetricCard(props: {
  item: SummaryMetricItem
  loading: boolean
}) {
  const Icon = props.item.icon
  const tone = METRIC_TONE_CLASSES[props.item.tone]

  return (
    <CardStaggerItem className='group border-border/80 bg-card flex min-h-56 flex-col justify-between overflow-hidden rounded-lg border p-5 shadow-sm transition-shadow duration-200 hover:shadow-md'>
      <div className='flex items-center gap-2.5'>
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-md ring-1',
            tone.icon
          )}
        >
          <Icon className='size-4' aria-hidden='true' />
        </span>
        <h3 className='text-foreground text-sm font-semibold'>
          {props.item.title}
        </h3>
      </div>

      <div className='my-4'>
        {props.loading ? (
          <div className='space-y-2'>
            <Skeleton className='h-8 w-28 rounded-md' />
            <Skeleton className='h-3.5 w-full rounded' />
          </div>
        ) : (
          <>
            <div className='text-foreground font-mono text-2xl font-bold tracking-tight sm:text-3xl'>
              {props.item.value}
            </div>
            <p className='text-muted-foreground mt-1.5 line-clamp-2 text-xs leading-relaxed'>
              {props.item.description}
            </p>
          </>
        )}
      </div>

      {props.loading ? (
        <Skeleton className='h-9 w-full rounded-md' />
      ) : (
        <SparklineSvg data={props.item.sparkline} toneClassName={tone.chart} />
      )}
    </CardStaggerItem>
  )
}

type HealthLevel = 'healthy' | 'caution' | 'critical'

function getHealthLevel(remainQuota: number, recentUsage: number): HealthLevel {
  if (remainQuota <= 0) return 'critical'
  const days = getRunwayDays(remainQuota, recentUsage)
  if (days !== null && days < 3) return 'caution'
  return 'healthy'
}

const HEALTH_CONFIG: Record<
  HealthLevel,
  { badgeClassName: string; textClassName: string; labelKey: string }
> = {
  healthy: {
    badgeClassName:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    textClassName: 'text-emerald-600 dark:text-emerald-400',
    labelKey: 'Healthy',
  },
  caution: {
    badgeClassName:
      'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    textClassName: 'text-amber-600 dark:text-amber-400',
    labelKey: 'Low balance',
  },
  critical: {
    badgeClassName:
      'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    textClassName: 'text-rose-600 dark:text-rose-400',
    labelKey: 'Balance depleted',
  },
}

export function SummaryCards() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const { status, loading: statusLoading } = useStatus()
  const summaryTimeRange = useMemo(() => computeTimeRange(1), [])
  const remainQuota = Number(user?.quota ?? 0)
  const usedQuota = Number(user?.used_quota ?? 0)
  const requestCount = Number(user?.request_count ?? 0)

  const usageTrendQuery = useQuery({
    queryKey: [
      'dashboard',
      'overview',
      'summary-sparklines',
      summaryTimeRange.start_timestamp,
      summaryTimeRange.end_timestamp,
    ],
    queryFn: async () =>
      getUserQuotaDates({
        start_timestamp: summaryTimeRange.start_timestamp,
        end_timestamp: summaryTimeRange.end_timestamp,
        default_time: 'hour',
      }),
    staleTime: 60 * 1000,
  })

  const usageData = useMemo(
    () =>
      Array.isArray(usageTrendQuery.data?.data)
        ? usageTrendQuery.data.data
        : [],
    [usageTrendQuery.data?.data]
  )
  const sparklineData = useMemo(
    () =>
      buildSummarySparklines(
        usageData,
        remainQuota,
        summaryTimeRange.start_timestamp,
        summaryTimeRange.end_timestamp
      ),
    [
      remainQuota,
      summaryTimeRange.end_timestamp,
      summaryTimeRange.start_timestamp,
      usageData,
    ]
  )
  const recentUsage = useMemo(
    () =>
      usageData.reduce((total, item) => total + (Number(item.quota) || 0), 0),
    [usageData]
  )

  const currencyEnabled = resolveCurrencyEnabled(
    typeof status?.display_in_currency === 'boolean'
      ? status.display_in_currency
      : undefined,
    isCurrencyDisplayEnabled()
  )
  const currencyLabel = currencyEnabled ? getCurrencyLabel() : 'Tokens'
  const summaryConfig = useSummaryCardsConfig({
    todayUsageDisplay: formatQuota(recentUsage),
    usedDisplay: formatQuota(usedQuota),
    requestCountDisplay: formatNumber(requestCount),
    currencyEnabled,
    currencyLabel,
  })
  const tones: SummaryMetricTone[] = ['amber', 'violet', 'blue']
  const metricItems = summaryConfig.map<SummaryMetricItem>((item, index) => ({
    ...item,
    sparkline:
      item.key === 'requests' ? sparklineData.requests : sparklineData.usage,
    tone: tones[index] ?? 'blue',
  }))

  const runwayDays = getRunwayDays(remainQuota, recentUsage)
  const healthConfig = HEALTH_CONFIG[getHealthLevel(remainQuota, recentUsage)]
  const runwayDisplay = getRunwayDisplay(
    remainQuota,
    recentUsage,
    t,
    formatNumber
  )
  const totalQuota = remainQuota + usedQuota
  const remainingPercent =
    totalQuota > 0
      ? Math.max(0, Math.min(100, Math.round((remainQuota / totalQuota) * 100)))
      : 0

  return (
    <CardStaggerContainer className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1.25fr_repeat(3,minmax(0,1fr))]'>
      <CardStaggerItem className='group border-border/80 from-card via-card/95 to-muted/30 relative flex min-h-56 flex-col justify-between overflow-hidden rounded-lg border bg-gradient-to-br p-5 shadow-sm transition-shadow duration-200 hover:shadow-md'>
        <div
          className='bg-primary/10 dark:bg-primary/15 pointer-events-none absolute -top-16 -right-16 size-48 rounded-full blur-3xl'
          aria-hidden='true'
        />

        <div className='relative flex items-start justify-between gap-3'>
          <div className='flex items-center gap-2.5'>
            <span className='bg-primary/10 text-primary ring-primary/20 flex size-10 items-center justify-center rounded-md shadow-xs ring-1'>
              <CreditCard className='size-5' aria-hidden='true' />
            </span>
            <div>
              <h3 className='text-foreground text-sm font-semibold'>
                {t('Credit remaining')}
              </h3>
              <p className='text-muted-foreground text-xs'>{currencyLabel}</p>
            </div>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
              healthConfig.badgeClassName
            )}
          >
            <span
              className='size-1.5 rounded-full bg-current'
              aria-hidden='true'
            />
            {t(healthConfig.labelKey)}
          </span>
        </div>

        <div className='relative my-4'>
          <div className='text-foreground font-mono text-3xl font-bold tracking-tight'>
            {formatQuota(remainQuota)}
          </div>
          <div className='text-muted-foreground mt-3 flex items-center justify-between text-xs'>
            <span>{t('Remaining quota')}</span>
            <span className='font-mono tabular-nums'>{remainingPercent}%</span>
          </div>
          <div
            className='bg-muted/80 mt-2 h-1.5 overflow-hidden rounded-full'
            role='progressbar'
            aria-label={t('Remaining quota')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={remainingPercent}
          >
            <div
              className='bg-primary h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none'
              style={{ width: `${remainingPercent}%` }}
            />
          </div>
        </div>

        <div className='border-border/50 relative flex items-end justify-between gap-3 border-t pt-4'>
          <div>
            <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
              {runwayDays !== null && runwayDays < 3 ? (
                <TrendingDown
                  className='size-3.5 text-rose-500'
                  aria-hidden='true'
                />
              ) : (
                <ShieldCheck
                  className='size-3.5 text-emerald-500'
                  aria-hidden='true'
                />
              )}
              {t('Runway')}
            </div>
            <div
              className={cn(
                'mt-1 font-mono text-sm font-semibold tabular-nums',
                healthConfig.textClassName
              )}
            >
              {runwayDisplay}
            </div>
          </div>
          <Button
            size='sm'
            className='h-9 rounded-md px-3 shadow-xs'
            render={<Link to='/wallet' />}
          >
            {t('Wallet')}
            <ArrowRight data-icon='inline-end' />
          </Button>
        </div>
      </CardStaggerItem>

      {metricItems.map((item) => (
        <SummaryMetricCard
          key={item.key}
          item={item}
          loading={statusLoading || usageTrendQuery.isLoading}
        />
      ))}
    </CardStaggerContainer>
  )
}
