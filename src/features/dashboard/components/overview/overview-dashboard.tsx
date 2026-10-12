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
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  CreditCard,
  FileText,
  KeyRound,
  Lightbulb,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Terminal,
  Timer,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  CardStaggerContainer,
  CardStaggerItem,
} from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { fetchTokenKey, getApiKeys } from '@/features/keys/api'
import type { ApiKey } from '@/features/keys/types'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getUserModels } from '@/lib/api'
import { MOTION_TRANSITION } from '@/lib/motion'
import { ROLE } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import {
  useApiInfo,
  useDashboardContentVisibility,
} from '../../hooks/use-status-data'
import {
  USER_OVERVIEW_ACTION_PATHS,
  buildCurlCommand,
  buildOverviewRequestExample,
  resolveSetupGuideExpanded,
  type OverviewRequestExample,
} from '../../lib/overview-functionality'
import { AnnouncementsPanel } from './announcements-panel'
import { ApiInfoPanel } from './api-info-panel'
import { PerformanceHealthPanel } from './performance-health-panel'
import { SummaryCards } from './summary-cards'

const SETUP_GUIDE_VISIBILITY_STORAGE_KEY =
  'dashboard_overview_setup_guide_expanded'

type DashboardActionPath =
  | '/keys'
  | '/wallet'
  | '/playground'
  | '/usage-logs'
  | '/pricing'

interface StartStep {
  title: string
  description: string
  to: DashboardActionPath
  icon: LucideIcon
  completed: boolean
}

interface QuickAction {
  title: string
  description: string
  to: DashboardActionPath
  icon: LucideIcon
}

interface HeroSignal {
  label: string
  value: string
  icon: LucideIcon
  tone: IconBadgeTone
}

function getSavedSetupGuideExpanded(): boolean | null {
  if (typeof window === 'undefined') return null
  const saved = window.localStorage.getItem(SETUP_GUIDE_VISIBILITY_STORAGE_KEY)
  if (saved === 'expanded') return true
  if (saved === 'collapsed') return false
  return null
}

function saveSetupGuideExpanded(expanded: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    SETUP_GUIDE_VISIBILITY_STORAGE_KEY,
    expanded ? 'expanded' : 'collapsed'
  )
}

function getPreferredKey(keys: ApiKey[]): ApiKey | null {
  return keys.find((item) => item.status === 1) ?? keys[0] ?? null
}

function HeroBanner(props: {
  completedStepCount: number
  totalSteps: number
  onToggleExpand: () => void
  expanded: boolean
  actions: QuickAction[]
}) {
  const { t } = useTranslation()
  const progressPct = Math.round(
    (props.completedStepCount / props.totalSteps) * 100
  )

  return (
    <div className='border-border/80 from-card via-card/90 to-primary/5 relative overflow-hidden rounded-lg border bg-gradient-to-r px-4 py-3.5 shadow-xs backdrop-blur-md sm:px-5 sm:py-4'>
      {/* Ambient background lights */}
      <div className='bg-primary/10 dark:bg-primary/20 pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl' />
      <div className='pointer-events-none absolute right-40 -bottom-20 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl' />

      <div className='relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
        <div className='min-w-0 xl:shrink-0'>
          <div className='flex flex-wrap items-center gap-2.5'>
            <div className='border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-xs'>
              <Sparkles className='size-3' aria-hidden='true' />
              <span>{t('Next-Gen AI Gateway')}</span>
            </div>
            <h2 className='text-foreground text-xl font-bold tracking-tight sm:text-2xl'>
              {t('Welcome to Developer Console')}
            </h2>
          </div>
          <p className='text-muted-foreground mt-1 max-w-2xl text-xs sm:text-sm xl:whitespace-nowrap'>
            {t(
              'Seamlessly integrate high-performance model endpoints with ultra-low latency and unified API control.'
            )}
          </p>
        </div>

        <div className='flex min-w-0 flex-wrap items-center gap-2 xl:justify-end'>
          <div className='text-muted-foreground mr-0.5 flex items-center gap-1.5 text-[11px] font-medium'>
            <Zap className='text-primary size-3.5' aria-hidden='true' />
            <span>{t('Developer Launchpad')}</span>
          </div>
          {props.actions.map((action) => {
            const Icon = action.icon

            return (
              <Link
                key={action.title}
                to={action.to}
                title={action.description}
                aria-label={`${action.title}: ${action.description}`}
                className='border-border/70 bg-background/70 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-md border px-3 text-[13px] font-medium shadow-2xs transition-colors focus-visible:ring-2 focus-visible:outline-none'
              >
                <Icon className='size-4' aria-hidden='true' />
                <span>{action.title}</span>
              </Link>
            )
          })}

          {/* Progress Pill */}
          <div className='border-border/60 bg-background/70 flex items-center gap-2 rounded-md border px-2.5 py-2 shadow-2xs backdrop-blur-md'>
            <div className='bg-primary/10 text-primary relative flex size-8 items-center justify-center rounded-md font-mono text-[11px] font-bold'>
              {progressPct}%
            </div>
            <div>
              <div className='text-foreground text-[11px] font-semibold'>
                {props.completedStepCount === props.totalSteps
                  ? t('Ready for Production')
                  : t('Getting Started')}
              </div>
              <div className='text-muted-foreground text-[10px]'>
                {props.completedStepCount}/{props.totalSteps}{' '}
                {t('steps complete')}
              </div>
            </div>
          </div>

          <Button
            variant='outline'
            size='sm'
            className='border-border/80 bg-background/80 hover:bg-muted/80 h-9 rounded-md px-3 text-xs font-medium backdrop-blur-xs'
            onClick={props.onToggleExpand}
          >
            {props.expanded ? (
              <>
                <ChevronUp
                  className='text-muted-foreground size-3.5'
                  aria-hidden='true'
                />
                <span>{t('Collapse Setup')}</span>
              </>
            ) : (
              <>
                <ChevronDown
                  className='text-muted-foreground size-3.5'
                  aria-hidden='true'
                />
                <span>{t('Expand Setup Guide')}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function StartStepItem(props: { step: StartStep }) {
  const { t } = useTranslation()
  const Icon = props.step.icon
  const StatusIcon = props.step.completed ? Check : Circle

  return (
    <Link
      to={props.step.to}
      className={cn(
        'group relative flex items-center gap-3 rounded-md border p-2.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none',
        props.step.completed
          ? 'border-border/60 bg-card/60'
          : 'border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card ring-1 ring-primary/20'
      )}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md shadow-2xs transition-colors',
          props.step.completed
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-primary/10 text-primary'
        )}
      >
        <Icon className='size-4.5' aria-hidden='true' />
      </div>

      <div className='min-w-0 flex-1'>
        <div className='text-foreground group-hover:text-primary flex items-center gap-1.5 text-sm font-semibold transition-colors'>
          <span className='truncate'>{props.step.title}</span>
          <ArrowRight
            className='size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transform-none motion-reduce:transition-none'
            aria-hidden='true'
          />
        </div>
        <p className='text-muted-foreground mt-0.5 truncate text-xs'>
          {props.step.description}
        </p>
      </div>

      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
          props.step.completed
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        )}
      >
        <StatusIcon className='size-3' aria-hidden='true' />
        {props.step.completed ? t('Done') : t('Action')}
      </span>
    </Link>
  )
}

function RequestPreview(props: {
  example: OverviewRequestExample
  signals: HeroSignal[]
}) {
  const { t } = useTranslation()
  const shouldReduceMotion = useReducedMotion()
  const [isCopying, setIsCopying] = useState(false)
  const { copyToClipboard } = useCopyToClipboard({ notify: false })

  const previewCurl = buildCurlCommand({
    endpoint: props.example.endpoint,
    apiKey: props.example.displayKey,
    model: props.example.model,
  })

  const handleCopyRequest = async () => {
    if (!props.example.keyId || isCopying) return

    setIsCopying(true)
    try {
      const result = await fetchTokenKey(props.example.keyId)
      const key = result.success && result.data?.key ? result.data.key : ''
      if (!key) {
        toast.error(result.message || t('Failed to copy to clipboard'))
        return
      }

      const realCurl = buildCurlCommand({
        endpoint: props.example.endpoint,
        apiKey: `sk-${key}`,
        model: props.example.model,
      })
      const copied = await copyToClipboard(realCurl)
      if (copied) {
        toast.success(t('Copied to clipboard'))
      } else {
        toast.error(t('Failed to copy to clipboard'))
      }
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={MOTION_TRANSITION.slow}
      className='border-border/80 from-card to-muted/20 relative flex flex-col justify-between overflow-hidden rounded-lg border bg-gradient-to-b p-5 shadow-sm'
    >
      <div className='border-border/60 flex items-center justify-between gap-3 border-b pb-3'>
        <div className='flex items-center gap-2.5'>
          <div className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md'>
            <Terminal className='size-4' aria-hidden='true' />
          </div>
          <div>
            <span className='text-foreground text-xs font-semibold'>
              {t('cURL Live Preview')}
            </span>
            <div className='text-muted-foreground text-[11px]'>
              {props.example.ready ? props.example.keyName : t('Ready to test')}
            </div>
          </div>
        </div>

        {props.example.ready ? (
          <Button
            variant='outline'
            size='sm'
            className='border-border/70 bg-background h-8 gap-1.5 rounded-md px-3 text-xs font-medium'
            disabled={isCopying}
            onClick={handleCopyRequest}
            aria-label={t('Copy ready-to-run curl')}
          >
            <Copy className='size-3.5' aria-hidden='true' />
            {isCopying ? t('Loading') : t('Copy cURL')}
          </Button>
        ) : (
          <Button
            size='sm'
            className='h-8 rounded-md px-3 text-xs'
            render={<Link to='/keys' />}
          >
            {t('Create API Key')}
          </Button>
        )}
      </div>

      {/* Code Box Terminal Style */}
      <div className='border-border/70 relative my-3.5 rounded-md border bg-slate-950 p-4 font-mono text-xs text-emerald-400 shadow-inner dark:bg-black/60'>
        <div className='mb-2.5 flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] text-slate-400'>
          <div className='flex items-center gap-1.5'>
            <span className='size-2 rounded-full bg-rose-500/80' />
            <span className='size-2 rounded-full bg-amber-500/80' />
            <span className='size-2 rounded-full bg-emerald-500/80' />
          </div>
          <span className='text-slate-400'>bash</span>
        </div>
        <pre className='overflow-x-auto leading-relaxed break-all whitespace-pre-wrap'>
          <code>{previewCurl}</code>
        </pre>
      </div>

      {/* Status Signals */}
      <div className='grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3'>
        {props.signals.map((sig) => {
          const Icon = sig.icon
          return (
            <div
              key={sig.label}
              className='border-border/50 bg-background/50 flex items-center gap-2 rounded-md border p-2 text-xs backdrop-blur-xs'
            >
              <IconBadge tone={sig.tone} size='xs'>
                <Icon />
              </IconBadge>
              <div className='min-w-0'>
                <div className='text-muted-foreground truncate text-[10px]'>
                  {sig.label}
                </div>
                <div className='text-foreground truncate font-mono font-semibold'>
                  {sig.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export function OverviewDashboard() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const { items: apiInfoItems } = useApiInfo()
  const { apiInfo: showApiInfoPanel, announcements: showAnnouncementsPanel } =
    useDashboardContentVisibility()

  const [manualSetupGuideExpanded, setManualSetupGuideExpanded] = useState<
    boolean | null
  >(() => getSavedSetupGuideExpanded())

  const requestCount = Number(user?.request_count ?? 0)
  const remainQuota = Number(user?.quota ?? 0)
  const usedQuota = Number(user?.used_quota ?? 0)
  const isAdmin = Boolean(user?.role && user.role >= ROLE.ADMIN)

  const apiKeysQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'api-keys'],
    queryFn: async () => {
      const result = await getApiKeys({ p: 1, size: 10 })
      return result.success ? (result.data?.items ?? []) : []
    },
    staleTime: 60 * 1000,
  })

  const modelsQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'user-models'],
    queryFn: async () => {
      const result = await getUserModels()
      return result.success ? (result.data ?? []) : []
    },
    staleTime: 5 * 60 * 1000,
  })

  const preferredKey = useMemo(
    () => getPreferredKey(apiKeysQuery.data ?? []),
    [apiKeysQuery.data]
  )

  const startSteps = useMemo<StartStep[]>(
    () => [
      {
        title: t('Create API Key'),
        description: t('Create a key for your app or service'),
        to: '/keys',
        icon: KeyRound,
        completed: Boolean(preferredKey),
      },
      {
        title: t('Add credits'),
        description: t('Keep enough balance before production traffic'),
        to: '/wallet',
        icon: CreditCard,
        completed: remainQuota > 0 || usedQuota > 0,
      },
      {
        title: t('Send a request'),
        description: t('Verify routing with Playground or your client'),
        to: '/playground',
        icon: Terminal,
        completed: requestCount > 0,
      },
    ],
    [preferredKey, remainQuota, requestCount, t, usedQuota]
  )

  const quickActions = useMemo<QuickAction[]>(() => {
    const actionConfig: Record<
      (typeof USER_OVERVIEW_ACTION_PATHS)[number],
      Omit<QuickAction, 'to'>
    > = {
      '/keys': {
        title: t('API Keys'),
        description: t('Create a key for your app or service'),
        icon: KeyRound,
      },
      '/usage-logs': {
        title: t('Usage Logs'),
        description: t('Inspect requests, errors, and billing details'),
        icon: FileText,
      },
      '/pricing': {
        title: t('Pricing'),
        description: t('Review model rates before scaling traffic'),
        icon: BookOpen,
      },
    }

    return USER_OVERVIEW_ACTION_PATHS.map((to) => ({
      ...actionConfig[to],
      to,
    }))
  }, [t])

  const completedStepCount = useMemo(
    () => startSteps.filter((step) => step.completed).length,
    [startSteps]
  )
  const setupComplete = completedStepCount === startSteps.length
  const setupStatusReady = apiKeysQuery.isFetched && Boolean(user)
  const isSetupGuideExpanded = resolveSetupGuideExpanded(
    manualSetupGuideExpanded,
    setupStatusReady,
    setupComplete
  )

  const handleSetupGuideToggle = () => {
    const nextState = !isSetupGuideExpanded
    setManualSetupGuideExpanded(nextState)
    saveSetupGuideExpanded(nextState)
  }

  const requestExample = useMemo<OverviewRequestExample>(
    () =>
      buildOverviewRequestExample({
        sourceUrl: apiInfoItems[0]?.url,
        origin: typeof window === 'undefined' ? '' : window.location.origin,
        firstModel: modelsQuery.data?.[0],
        preferredKey,
        noKeyName: t('No API key yet'),
      }),
    [apiInfoItems, modelsQuery.data, preferredKey, t]
  )

  const heroSignals = useMemo<HeroSignal[]>(
    () => [
      {
        label: t('Route active'),
        value: apiInfoItems.length > 0 ? t('Online') : t('Current domain'),
        icon: RadioTower,
        tone: 'info',
      },
      {
        label: t('Auth configured'),
        value: preferredKey ? t('Secured') : t('Needs API key'),
        icon: ShieldCheck,
        tone: 'success',
      },
      {
        label: t('Model selected'),
        value: modelsQuery.data?.[0] ?? t('Loading'),
        icon: Timer,
        tone: 'chart-4',
      },
    ],
    [apiInfoItems.length, modelsQuery.data, preferredKey, t]
  )

  const showContentPanels =
    showApiInfoPanel || showAnnouncementsPanel || isAdmin

  return (
    <div className='flex flex-col gap-5 pb-6'>
      {/* Dynamic Hero Area */}
      <HeroBanner
        completedStepCount={completedStepCount}
        totalSteps={startSteps.length}
        onToggleExpand={handleSetupGuideToggle}
        expanded={isSetupGuideExpanded}
        actions={quickActions}
      />

      {/* Expanded Setup Workspace */}
      {isSetupGuideExpanded && (
        <CardStaggerContainer className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
          {/* Steps Column */}
          <CardStaggerItem className='border-border/80 bg-card flex flex-col justify-between rounded-lg border p-5 shadow-xs lg:col-span-4'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='bg-primary flex size-2 animate-pulse rounded-full' />
                <h3 className='text-foreground text-base font-bold'>
                  {t('Integration Checklist')}
                </h3>
              </div>
              <p className='text-muted-foreground mt-1 truncate text-xs'>
                {t(
                  'Follow these straightforward steps to start dispatching tokens.'
                )}
              </p>
            </div>

            <div className='my-3 flex flex-col gap-2'>
              {startSteps.map((step) => (
                <StartStepItem key={step.title} step={step} />
              ))}
            </div>

            <div className='bg-muted/40 text-muted-foreground flex items-center gap-2 rounded-md p-2 text-xs'>
              <Lightbulb
                className='mt-0.5 size-3.5 shrink-0'
                aria-hidden='true'
              />
              <span className='truncate'>
                {t(
                  'All requests are strictly standardized to OpenAI compatibility format.'
                )}
              </span>
            </div>
          </CardStaggerItem>

          {/* cURL Live Terminal Column */}
          <CardStaggerItem className='lg:col-span-8'>
            <RequestPreview example={requestExample} signals={heroSignals} />
          </CardStaggerItem>
        </CardStaggerContainer>
      )}

      {/* Bento Metric Statistics */}
      <SummaryCards />

      {/* Extended Information & Telemetry Section */}
      {showContentPanels && (
        <CardStaggerContainer className='grid grid-cols-1 gap-5'>
          <div
            className={cn(
              'grid min-w-0 grid-cols-1 gap-5',
              showApiInfoPanel && showAnnouncementsPanel && 'lg:grid-cols-2'
            )}
          >
            {isAdmin && (
              <CardStaggerItem className='lg:col-span-2'>
                <PerformanceHealthPanel />
              </CardStaggerItem>
            )}
            {showApiInfoPanel && (
              <CardStaggerItem>
                <ApiInfoPanel />
              </CardStaggerItem>
            )}
            {showAnnouncementsPanel && (
              <CardStaggerItem>
                <AnnouncementsPanel />
              </CardStaggerItem>
            )}
          </div>
        </CardStaggerContainer>
      )}
    </div>
  )
}
