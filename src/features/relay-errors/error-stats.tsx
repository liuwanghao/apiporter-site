/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { SectionPageLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { fetchRelayErrorStats } from './api'
import { categoryLabel, periodRange, sourceLabel } from './lib'
import type { CountPoint, RelayErrorPeriod } from './types'

const PERIODS: Array<{ value: RelayErrorPeriod; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
]

function MetricCard(props: { label: string; value: string; loading: boolean }) {
  return (
    <Card className='min-h-32 justify-center gap-2 px-2 py-5 sm:min-h-40'>
      <CardHeader>
        <div className='text-muted-foreground text-sm'>{props.label}</div>
      </CardHeader>
      <CardContent>
        {props.loading ? (
          <Skeleton className='h-9 w-24' />
        ) : (
          <div className='text-3xl font-semibold tabular-nums'>
            {props.value}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CountChart(props: {
  title: string
  data: CountPoint[]
  color: string
  label: (value: string) => string
  emptyLabel: string
  errorLabel: string
}) {
  const data = props.data.map((point) => ({
    ...point,
    label: props.label(point.name),
  }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent className='h-72'>
        {data.length === 0 ? (
          <div className='text-muted-foreground flex h-full items-center justify-center'>
            {props.emptyLabel}
          </div>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={data}
              layout='vertical'
              margin={{ left: 24, right: 20 }}
            >
              <CartesianGrid
                stroke='var(--border)'
                strokeDasharray='4 4'
                horizontal={false}
              />
              <XAxis type='number' allowDecimals={false} />
              <YAxis
                type='category'
                dataKey='label'
                width={110}
                tick={{ fontSize: 12 }}
              />
              <Tooltip cursor={{ fill: 'var(--muted)' }} />
              <Bar
                dataKey='count'
                fill={props.color}
                radius={[0, 3, 3, 0]}
                name={props.errorLabel}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function RelayErrorStatistics() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<RelayErrorPeriod>('24h')
  const range = useMemo(() => periodRange(period), [period])
  const query = useQuery({
    queryKey: ['relay-error-stats', period, range.start, range.end],
    queryFn: () => fetchRelayErrorStats(range.start, range.end),
    refetchInterval: 60_000,
  })
  const stats = query.data
  const hourly = (stats?.hourly ?? []).map((point) => ({
    ...point,
    label: new Intl.DateTimeFormat(undefined, {
      month: period === '7d' ? '2-digit' : undefined,
      day: period === '7d' ? '2-digit' : undefined,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(point.timestamp * 1000)),
  }))

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Error Statistics')}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as RelayErrorPeriod)}
        >
          <TabsList>
            {PERIODS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {t(item.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='space-y-4 pb-4'>
          {query.isError ? (
            <div className='text-destructive border-destructive/30 bg-destructive/5 rounded-lg border p-4 text-sm'>
              {t('Failed to load')}
            </div>
          ) : null}
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-5'>
            <MetricCard
              label={t("Today's errors")}
              value={String(stats?.today_errors ?? 0)}
              loading={query.isLoading}
            />
            <MetricCard
              label={t("Yesterday's errors")}
              value={String(stats?.yesterday_errors ?? 0)}
              loading={query.isLoading}
            />
            <MetricCard
              label={t('Errors in range')}
              value={String(stats?.range_errors ?? 0)}
              loading={query.isLoading}
            />
            <MetricCard
              label={t('Successes in range')}
              value={String(stats?.range_successes ?? 0)}
              loading={query.isLoading}
            />
            <MetricCard
              label={t('Error rate')}
              value={`${(stats?.error_rate ?? 0).toFixed(2)}%`}
              loading={query.isLoading}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('Hourly error trend')}</CardTitle>
            </CardHeader>
            <CardContent className='h-72'>
              {hourly.length === 0 ? (
                <div className='text-muted-foreground flex h-full items-center justify-center'>
                  {t('No data')}
                </div>
              ) : (
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={hourly} margin={{ left: 8, right: 20 }}>
                    <CartesianGrid
                      stroke='var(--border)'
                      strokeDasharray='4 4'
                    />
                    <XAxis
                      dataKey='label'
                      tick={{ fontSize: 11 }}
                      minTickGap={28}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type='monotone'
                      dataKey='errors'
                      name={t('Errors')}
                      stroke='var(--destructive)'
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Channel successes vs errors')}</CardTitle>
            </CardHeader>
            <CardContent className='h-80'>
              {(stats?.channels ?? []).length === 0 ? (
                <div className='text-muted-foreground flex h-full items-center justify-center'>
                  {t('No data')}
                </div>
              ) : (
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={stats?.channels ?? []}
                    margin={{ left: 8, right: 20 }}
                  >
                    <CartesianGrid
                      stroke='var(--border)'
                      strokeDasharray='4 4'
                    />
                    <XAxis
                      dataKey='channel_name'
                      tick={{ fontSize: 11 }}
                      minTickGap={16}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey='successes'
                      name={t('Successes')}
                      fill='var(--chart-2)'
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey='errors'
                      name={t('Errors')}
                      fill='var(--destructive)'
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className='grid gap-4 xl:grid-cols-2'>
            <CountChart
              title={t('Error count by category')}
              data={stats?.categories ?? []}
              color='var(--chart-4)'
              label={(value) => categoryLabel(t, value)}
              emptyLabel={t('No data')}
              errorLabel={t('Errors')}
            />
            <CountChart
              title={t('Error count by status code')}
              data={stats?.status_codes ?? []}
              color='var(--chart-1)'
              label={(value) => value}
              emptyLabel={t('No data')}
              errorLabel={t('Errors')}
            />
            <CountChart
              title={t('Error count by source')}
              data={stats?.sources ?? []}
              color='var(--chart-5)'
              label={(value) => sourceLabel(t, value)}
              emptyLabel={t('No data')}
              errorLabel={t('Errors')}
            />
            <CountChart
              title={t('Error count by model')}
              data={stats?.models ?? []}
              color='var(--chart-3)'
              label={(value) => value}
              emptyLabel={t('No data')}
              errorLabel={t('Errors')}
            />
          </div>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
