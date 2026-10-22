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
import { Gauge, HeartPulse, Timer } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getPerfMetricsSummary } from '@/features/performance-metrics/api'
import {
  formatLatency,
  formatThroughput,
  formatUptimePct,
  getSuccessRateDotClass,
  getSuccessRateTextClass,
} from '@/features/performance-metrics/lib/format'
import { requireServerSuccess } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'

const PERFORMANCE_WINDOW_HOURS = 24
const TOP_MODEL_LIMIT = 6

export function PerformanceHealthPanel() {
  const { t } = useTranslation()
  const metricsQuery = useQuery({
    queryKey: ['perf-metrics-summary', PERFORMANCE_WINDOW_HOURS],
    queryFn: async () =>
      requireServerSuccess(
        await getPerfMetricsSummary(PERFORMANCE_WINDOW_HOURS)
      ),
    staleTime: 60 * 1000,
    retry: false,
  })

  const models = useMemo(
    () => metricsQuery.data?.data.models ?? [],
    [metricsQuery.data]
  )

  const summary = metricsQuery.data?.data.summary

  const topModels = useMemo(() => models.slice(0, TOP_MODEL_LIMIT), [models])
  const loading = metricsQuery.isLoading
  const hasData = models.length > 0

  return (
    <section className='border-border/80 bg-card overflow-hidden rounded-lg border p-5 shadow-xs'>
      <div className='border-border/60 flex items-center justify-between border-b pb-3.5'>
        <div className='flex items-center gap-2.5'>
          <div className='flex size-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
            <HeartPulse className='size-4' aria-hidden='true' />
          </div>
          <div>
            <h3 className='text-foreground text-sm font-bold'>
              {t('Performance health')}
            </h3>
            <p className='text-muted-foreground text-[11px]'>
              {t('Performance metrics for the last 24 hours')}
            </p>
          </div>
        </div>
      </div>

      <div className='space-y-4 pt-4'>
        <div className='grid grid-cols-3 gap-2.5'>
          <MetricCell
            icon={HeartPulse}
            label={t('Success rate')}
            value={formatUptimePct(summary?.success_rate ?? Number.NaN)}
            loading={loading}
            valueClassName={getSuccessRateTextClass(
              summary?.success_rate ?? Number.NaN
            )}
            tone='success'
          />
          <MetricCell
            icon={Timer}
            label={t('Average latency')}
            value={formatLatency(summary?.avg_latency_ms ?? 0)}
            loading={loading}
            tone='warning'
          />
          <MetricCell
            icon={Gauge}
            label={t('Throughput')}
            value={formatThroughput(summary?.avg_tps ?? 0)}
            loading={loading}
            tone='info'
          />
        </div>

        {loading ? (
          <div className='space-y-2'>
            {['success', 'latency', 'throughput'].map((key) => (
              <Skeleton key={key} className='h-8 w-full rounded-md' />
            ))}
          </div>
        ) : (
          hasData && (
            <div>
              <span className='text-muted-foreground mb-2 block text-xs font-semibold tracking-wider uppercase'>
                {t('Top models by traffic')}
              </span>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                {topModels.map((model) => (
                  <div
                    key={model.model_name}
                    className='border-border/50 bg-background/50 hover:bg-muted/40 flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs transition-colors'
                  >
                    <span className='text-foreground min-w-0 flex-1 truncate font-mono font-medium'>
                      {model.model_name}
                    </span>
                    <span className='inline-flex shrink-0 items-center gap-1.5'>
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          getSuccessRateDotClass(model.success_rate)
                        )}
                        aria-hidden='true'
                      />
                      <span
                        className={cn(
                          'font-mono text-xs font-bold tabular-nums',
                          getSuccessRateTextClass(model.success_rate)
                        )}
                      >
                        {formatUptimePct(model.success_rate)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}

function MetricCell(props: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  loading: boolean
  valueClassName?: string
  tone: IconBadgeTone
}) {
  const Icon = props.icon
  return (
    <div className='border-border/50 bg-background/50 rounded-md border p-3 shadow-2xs'>
      <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
        <IconBadge tone={props.tone} size='xs'>
          <Icon />
        </IconBadge>
        <span className='truncate font-medium'>{props.label}</span>
      </div>
      {props.loading ? (
        <Skeleton className='mt-2 h-6 w-16 rounded-md' />
      ) : (
        <div
          className={cn(
            'mt-2 font-mono text-base font-bold tabular-nums text-foreground sm:text-lg',
            props.valueClassName
          )}
        >
          {props.value}
        </div>
      )}
    </div>
  )
}
