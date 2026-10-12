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
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useState, useCallback, useMemo, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { FadeIn } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ROLE } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { DashboardAnalyticsLayout } from './components/dashboard-analytics-layout'
import { ModelsChartPreferences } from './components/models/models-chart-preferences'
import { ModelsFilter } from './components/models/models-filter-dialog'
import { OverviewDashboard } from './components/overview/overview-dashboard'
import { DEFAULT_TIME_GRANULARITY } from './constants'
import {
  buildDefaultDashboardFilters,
  getDefaultDays,
  getSavedChartPreferences,
  getSavedGranularity,
  saveChartPreferences,
} from './lib'
import {
  type DashboardSectionId,
  DASHBOARD_DEFAULT_SECTION,
  DASHBOARD_SECTION_IDS,
} from './section-registry'
import type {
  DashboardChartPreferences,
  DashboardFilters,
  QuotaDataItem,
  UserChartsFilters,
} from './types'

const route = getRouteApi('/_authenticated/dashboard/$section')

const LOG_STAT_CARD_FALLBACK_KEYS = [
  'tokens',
  'count',
  'quota',
  'avgRpm',
  'avgTpm',
] as const
const PERFORMANCE_METRIC_FALLBACK_KEYS = [
  'success-rate',
  'average-latency',
  'throughput',
] as const
const PERFORMANCE_MODEL_FALLBACK_KEYS = [
  'primary-model',
  'secondary-model',
] as const

const LazyLogStatCards = lazy(() =>
  import('./components/models/log-stat-cards').then((m) => ({
    default: m.LogStatCards,
  }))
)

const LazyModelCharts = lazy(() =>
  import('./components/models/model-charts').then((m) => ({
    default: m.ModelCharts,
  }))
)

const LazyConsumptionDistributionChart = lazy(() =>
  import('./components/models/consumption-distribution-chart').then((m) => ({
    default: m.ConsumptionDistributionChart,
  }))
)

const LazyPerformanceOverview = lazy(() =>
  import('./components/models/performance-overview').then((m) => ({
    default: m.PerformanceOverview,
  }))
)

const LazyUserCharts = lazy(() =>
  import('./components/users/user-charts').then((m) => ({
    default: m.UserCharts,
  }))
)

const LazyFlowCharts = lazy(() =>
  import('./components/flow/flow-charts').then((m) => ({
    default: m.FlowCharts,
  }))
)

function LogStatCardsFallback() {
  return (
    <div className='grid min-w-0 grid-cols-2 gap-2.5 md:grid-cols-4 xl:auto-rows-fr xl:grid-cols-12'>
      {LOG_STAT_CARD_FALLBACK_KEYS.map((key) => (
        <div
          key={key}
          className={cn(
            'rounded-lg border p-3.5 sm:p-4',
            key === 'tokens'
              ? 'col-span-2 min-h-40 md:col-span-4 xl:col-span-4 xl:row-span-2'
              : 'col-span-1 min-h-28 md:col-span-2 xl:col-span-4'
          )}
        >
          <div className='flex items-center gap-2'>
            <Skeleton className='size-8 rounded-md' />
            <Skeleton className='h-4 w-20' />
          </div>
          <Skeleton
            className={cn('mt-3 w-24', key === 'tokens' ? 'h-9' : 'h-7')}
          />
          <Skeleton className='mt-2 h-3.5 w-28' />
          {key === 'tokens' && (
            <div className='mt-5 grid grid-cols-3 gap-2'>
              {['input', 'output', 'cache'].map((metric) => (
                <Skeleton key={metric} className='h-14 rounded-md' />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ModelChartsFallback() {
  return (
    <div className='h-full overflow-hidden rounded-lg border'>
      <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-8 w-72' />
      </div>
      <div className='h-96 p-2'>
        <Skeleton className='h-full w-full' />
      </div>
    </div>
  )
}

function PerformanceOverviewFallback() {
  return (
    <div className='overflow-hidden rounded-lg border'>
      <div className='flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-5'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-4 w-24' />
        </div>
        {PERFORMANCE_METRIC_FALLBACK_KEYS.map((key) => (
          <div key={key} className='flex items-center gap-1.5'>
            <Skeleton className='h-3 w-14' />
            <Skeleton className='h-4 w-16' />
          </div>
        ))}
        <div className='ml-auto flex items-center gap-2'>
          {PERFORMANCE_MODEL_FALLBACK_KEYS.map((key) => (
            <Skeleton key={key} className='h-5 w-28 rounded-full' />
          ))}
        </div>
      </div>
    </div>
  )
}

const SECTION_META: Record<DashboardSectionId, { titleKey: string }> = {
  overview: {
    titleKey: 'Overview',
  },
  models: {
    titleKey: 'Model Call Analytics',
  },
  flow: {
    titleKey: 'Flow',
  },
  users: {
    titleKey: 'User Analytics',
  },
}

export function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = route.useParams()
  const userRole = useAuthStore((state) => state.auth.user?.role)
  const activeSection = (params.section ??
    DASHBOARD_DEFAULT_SECTION) as DashboardSectionId

  const [modelData, setModelData] = useState<QuotaDataItem[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [chartPreferences, setChartPreferences] =
    useState<DashboardChartPreferences>(() => getSavedChartPreferences())
  const [modelFilters, setModelFilters] = useState<DashboardFilters>(() =>
    buildDefaultDashboardFilters(getSavedChartPreferences())
  )
  const [userChartsFilters, setUserChartsFilters] = useState<UserChartsFilters>(
    () => {
      const granularity = getSavedGranularity()
      return {
        timeGranularity: granularity,
        selectedRange: getDefaultDays(granularity),
        topUserLimit: 10,
      }
    }
  )
  const [flowSensitiveVisible, setFlowSensitiveVisible] = useState(true)

  const handleFilterChange = useCallback((filters: DashboardFilters) => {
    setModelFilters(filters)
  }, [])

  const handleResetFilters = useCallback(() => {
    setModelFilters(buildDefaultDashboardFilters(chartPreferences))
  }, [chartPreferences])

  const handleDataUpdate = useCallback(
    (data: QuotaDataItem[], loading: boolean) => {
      setModelData(data)
      setDataLoading(loading)
    },
    []
  )

  const handleChartPreferencesChange = useCallback(
    (preferences: DashboardChartPreferences) => {
      setChartPreferences(preferences)
      setModelFilters(buildDefaultDashboardFilters(preferences))
      saveChartPreferences(preferences)
    },
    []
  )

  const meta = SECTION_META[activeSection] ?? SECTION_META.overview
  const isAdmin = Boolean(userRole && userRole >= ROLE.ADMIN)
  const visibleSections = useMemo(
    () =>
      DASHBOARD_SECTION_IDS.filter(
        (section) => section !== 'overview' && (section !== 'users' || isAdmin)
      ),
    [isAdmin]
  )
  const sectionLabels = useMemo<Record<DashboardSectionId, string>>(
    () => ({
      overview: t(SECTION_META.overview.titleKey),
      models: t(SECTION_META.models.titleKey),
      flow: t(SECTION_META.flow.titleKey),
      users: t(SECTION_META.users.titleKey),
    }),
    [t]
  )
  const handleSectionChange = useCallback(
    (section: DashboardSectionId) => {
      void navigate({
        to: '/dashboard/$section',
        params: { section },
      })
    },
    [navigate]
  )
  const modelActions =
    activeSection === 'models' ? (
      <>
        <ModelsChartPreferences
          preferences={chartPreferences}
          onPreferencesChange={handleChartPreferencesChange}
        />
        <ModelsFilter
          preferences={chartPreferences}
          currentFilters={modelFilters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </>
    ) : null
  const flowActions =
    activeSection === 'flow' ? (
      <>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setFlowSensitiveVisible((prev) => !prev)}
                aria-label={
                  flowSensitiveVisible
                    ? t('Hide sensitive data')
                    : t('Show sensitive data')
                }
                className='text-muted-foreground hover:text-foreground size-8'
              />
            }
          >
            {flowSensitiveVisible ? <Eye /> : <EyeOff />}
          </TooltipTrigger>
          <TooltipContent>
            {flowSensitiveVisible
              ? t('Hide sensitive data')
              : t('Show sensitive data')}
          </TooltipContent>
        </Tooltip>
        <ModelsFilter
          preferences={chartPreferences}
          currentFilters={modelFilters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          titleKey='Flow Filters'
          descriptionKey='Filter the traffic flow view by time range and user.'
        />
      </>
    ) : null
  const sectionActions = modelActions ?? flowActions

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t(meta.titleKey)}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        {activeSection === 'overview' ? (
          <OverviewDashboard />
        ) : (
          <DashboardAnalyticsLayout
            activeSection={activeSection}
            navigationLabel={t('Dashboard')}
            sections={visibleSections}
            sectionLabels={sectionLabels}
            actions={sectionActions}
            onSectionChange={handleSectionChange}
          >
            {activeSection === 'models' && (
              <div data-slot='dashboard-model-workspace' className='space-y-4'>
                <FadeIn>
                  <Suspense fallback={<LogStatCardsFallback />}>
                    <LazyLogStatCards
                      filters={modelFilters}
                      onDataUpdate={handleDataUpdate}
                    />
                  </Suspense>
                </FadeIn>
                {isAdmin && (
                  <FadeIn delay={0.05}>
                    <Suspense fallback={<PerformanceOverviewFallback />}>
                      <LazyPerformanceOverview />
                    </Suspense>
                  </FadeIn>
                )}
                <div
                  data-slot='dashboard-chart-grid'
                  className='grid min-w-0 gap-4 2xl:grid-cols-12'
                >
                  <FadeIn className='min-w-0 2xl:col-span-5' delay={0.1}>
                    <Suspense fallback={<ModelChartsFallback />}>
                      <LazyConsumptionDistributionChart
                        data={modelData}
                        loading={dataLoading}
                        defaultChartType={
                          chartPreferences.consumptionDistributionChart
                        }
                        timeGranularity={
                          modelFilters.time_granularity ||
                          DEFAULT_TIME_GRANULARITY
                        }
                      />
                    </Suspense>
                  </FadeIn>
                  <FadeIn className='min-w-0 2xl:col-span-7' delay={0.15}>
                    <Suspense fallback={<ModelChartsFallback />}>
                      <LazyModelCharts
                        data={modelData}
                        loading={dataLoading}
                        defaultChartTab={chartPreferences.modelAnalyticsChart}
                        timeGranularity={
                          modelFilters.time_granularity ||
                          DEFAULT_TIME_GRANULARITY
                        }
                      />
                    </Suspense>
                  </FadeIn>
                </div>
              </div>
            )}
            {activeSection === 'users' && (
              <FadeIn>
                <Suspense fallback={<ModelChartsFallback />}>
                  <LazyUserCharts
                    filters={userChartsFilters}
                    onFiltersChange={setUserChartsFilters}
                  />
                </Suspense>
              </FadeIn>
            )}
            {activeSection === 'flow' && (
              <FadeIn>
                <Suspense fallback={<ModelChartsFallback />}>
                  <LazyFlowCharts
                    filters={modelFilters}
                    sensitiveVisible={flowSensitiveVisible}
                  />
                </Suspense>
              </FadeIn>
            )}
          </DashboardAnalyticsLayout>
        )}
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
