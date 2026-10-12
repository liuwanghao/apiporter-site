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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart3,
  Check,
  Copy,
  Clock3,
  Link2,
  Loader2,
  Megaphone,
  Send,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { SectionPageLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress, ProgressLabel } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useSystemConfig } from '@/hooks/use-system-config'
import { toIntlLocale } from '@/i18n/languages'
import { getCurrencyLabel } from '@/lib/currency'
import { useAuthStore } from '@/stores/auth-store'
import type { CurrencyConfig } from '@/stores/system-config-store'

import { CompactDateTimeRangePicker } from '../usage-logs/components/compact-date-time-range-picker'
import {
  applyForPartner,
  getCommissionInvitees,
  getCommissionLedger,
  getCommissionSettlements,
  getCommissionSummary,
  getPartnerState,
  requestCommissionSettlement,
} from './api'
import { LedgerStatusBadge } from './ledger-status-badge'
import { resolveSettlementRequestAmount } from './lib/settlement'
import { ListPager as Pager } from './pager'
import { PartnerWorkspaceNavigation } from './partner-workspace-navigation'
import type {
  CommissionInvitee,
  CommissionLedger,
  CommissionPartnerApplication,
  CommissionPartnerMembership,
  CommissionSettlement,
  CommissionSettings,
  CommissionSummary,
  PageData,
} from './types'
import {
  COMMISSION_USD_SCALE,
  commissionUnitsToDisplayAmount,
  formatCommissionAmount,
  formatDate,
  formatTimestamp,
  getLedgerDateRangeParams,
  statusBadgeVariant,
  statusLabel,
} from './utils'

const PAGE_SIZE = 10
const contactEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const stepToneClasses = [
  'bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
  'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
  'bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400',
  'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
] as const
const programBenefitToneClasses = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
  emerald:
    'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
  violet:
    'bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400',
} as const

function PartnerPageLoadingState() {
  return (
    <div
      data-partner-loading
      className='grid gap-3'
      aria-busy='true'
      aria-label='Loading promotion partner data'
    >
      <Card className='min-h-[420px] animate-pulse' />
      <Card className='h-14 animate-pulse' />
    </div>
  )
}

function amount(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function settlementInputFractionDigits(): number {
  return 2
}

function formatSettlementRequestAmount(
  value: number | null | undefined,
  rounding: 'ceil' | 'round' = 'round'
): string {
  const displayAmount = commissionUnitsToDisplayAmount(value)
  const scale = 10 ** settlementInputFractionDigits()
  const scaledAmount = displayAmount * scale
  const roundingTolerance =
    Number.EPSILON * Math.max(1, Math.abs(scaledAmount)) * 4
  let roundedAmount = Math.round(scaledAmount)
  if (rounding === 'ceil') {
    roundedAmount = Math.ceil(scaledAmount - roundingTolerance)
  }
  return (roundedAmount / scale).toFixed(settlementInputFractionDigits())
}

function settlementRequestAmountToUnits(
  value: string,
  currency: CurrencyConfig
): number {
  const normalized = value.trim()
  const fractionDigits = settlementInputFractionDigits()
  const pattern = new RegExp(`^\\d+(?:\\.\\d{1,${fractionDigits}})?$`)
  if (!pattern.test(normalized)) return Number.NaN

  const displayAmount = Number(normalized)
  let displayExchangeRate = 1
  if (currency.quotaDisplayType === 'CNY') {
    displayExchangeRate =
      currency.usdExchangeRate > 0 ? currency.usdExchangeRate : 1
  } else if (currency.quotaDisplayType === 'CUSTOM') {
    displayExchangeRate =
      currency.customCurrencyExchangeRate > 0
        ? currency.customCurrencyExchangeRate
        : 1
  }
  const amountUnits = Math.round(
    (displayAmount / displayExchangeRate) * COMMISSION_USD_SCALE
  )
  return Number.isSafeInteger(amountUnits) ? amountUnits : Number.NaN
}

function MetricValue(props: {
  label: string
  value: string
  detail?: string
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={`min-w-0 ${props.className ?? ''}`}>
      <dt className='text-muted-foreground text-xs leading-5'>{props.label}</dt>
      <dd
        className={`mt-1 font-mono font-semibold break-words tabular-nums ${props.valueClassName ?? 'text-lg'}`}
      >
        {props.value}
      </dd>
      {props.detail ? (
        <p className='text-muted-foreground mt-1 text-xs leading-5'>
          {props.detail}
        </p>
      ) : null}
    </div>
  )
}

export function PartnerMetricsOverview({
  summary,
  membership,
  application,
  settings,
  locale,
  loading,
  referralLink,
  onCopyReferral,
  onRequestReactivation,
  onRequestSettlement,
  requestSettlementPending = false,
}: {
  summary?: CommissionSummary
  membership: CommissionPartnerMembership
  application?: CommissionPartnerApplication | null
  settings?: CommissionSettings | null
  locale?: string
  loading: boolean
  referralLink: string
  onCopyReferral: () => void
  onRequestReactivation?: () => void
  onRequestSettlement?: () => void
  requestSettlementPending?: boolean
}) {
  const { t } = useTranslation()
  useSystemConfig()
  const money = (value?: number) =>
    loading ? '-' : formatCommissionAmount(amount(value), locale)
  const membershipDisabled = membership.status === 'DISABLED'
  const reactivationPending = application?.status === 'PENDING'
  const reactivationRejected = application?.status === 'REJECTED'
  const confirmedAmount = amount(summary?.confirmed_amount)
  const minimumAmount = amount(settings?.minimum_settlement_amount)
  const canRequestSettlement =
    !loading &&
    confirmedAmount > 0 &&
    confirmedAmount >= minimumAmount &&
    Boolean(onRequestSettlement)
  let settlementProgress = 0
  if (!loading && minimumAmount > 0) {
    settlementProgress = Math.min(
      100,
      Math.max(0, (confirmedAmount / minimumAmount) * 100)
    )
  } else if (!loading && confirmedAmount > 0) {
    settlementProgress = 100
  }

  return (
    <div
      data-partner-profile-card
      data-partner-overview-layout
      className='min-w-0'
      aria-busy={loading}
    >
      <Card
        data-partner-command-center
        className='min-w-0 gap-0 overflow-hidden py-0'
      >
        <CardHeader className='border-b px-4 py-4 sm:px-5'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex min-w-0 items-center gap-3'>
              <span
                data-metric-icon='earnings'
                className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400'
              >
                <WalletCards className='size-5' aria-hidden='true' />
              </span>
              <div className='min-w-0'>
                <CardTitle id='partner-earnings-overview' className='text-lg'>
                  {t('Earnings overview')}
                </CardTitle>
                <p className='text-muted-foreground mt-0.5 text-xs sm:text-sm'>
                  {t(
                    'Track invited users, commission entries, settlements, and payments in one place.'
                  )}
                </p>
              </div>
            </div>
            <div
              data-partner-status
              className='flex shrink-0 items-center gap-2 self-start sm:self-auto'
            >
              <span className='text-muted-foreground text-xs'>
                {t('Partner status')}
              </span>
              <Badge variant={statusBadgeVariant(membership.status)}>
                {statusLabel(membership.status, t)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className='grid gap-3 p-3 sm:p-4'>
          {membershipDisabled ? (
            <div
              data-reactivation-panel
              className='border-destructive/30 bg-destructive/5 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4'
            >
              <div className='min-w-0'>
                <p className='text-muted-foreground text-sm leading-6'>
                  {reactivationPending
                    ? t(
                        'Your reactivation request is waiting for administrator review.'
                      )
                    : t(
                        'Your partner profile and historical data remain available, but the referral link will not earn new commission until reactivated.'
                      )}
                </p>
                {reactivationRejected ? (
                  <p className='text-muted-foreground mt-1 text-sm leading-6'>
                    {t(
                      'The last reactivation request was not approved. You can update it and submit again.'
                    )}
                    {application.review_reason
                      ? ` ${t('Rejection reason')}: ${application.review_reason}`
                      : ''}
                  </p>
                ) : null}
              </div>
              <Button
                data-request-reactivation
                size='sm'
                className='min-h-11 shrink-0 self-start sm:self-center'
                onClick={onRequestReactivation}
                disabled={reactivationPending || !onRequestReactivation}
              >
                {reactivationPending ? <Clock3 /> : <Send />}
                {reactivationPending
                  ? t('Reactivation pending')
                  : t('Request reactivation')}
              </Button>
            </div>
          ) : null}

          <div
            data-partner-command-grid
            className='grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)] xl:items-stretch'
          >
            <section
              data-partner-earnings-card
              aria-labelledby='partner-earnings-overview'
              className='flex h-full min-w-0 flex-col rounded-xl border p-3 sm:p-4'
            >
              <div
                data-earnings-primary
                className='bg-muted/40 ring-foreground/10 flex min-w-0 flex-col gap-5 rounded-xl p-4 ring-1 sm:flex-row sm:items-end sm:justify-between sm:p-5'
              >
                <MetricValue
                  label={t('Confirmed earnings')}
                  value={money(summary?.confirmed_amount)}
                  valueClassName='text-3xl tracking-tight sm:text-4xl'
                />
                {onRequestSettlement ? (
                  <Button
                    data-request-settlement
                    className='min-h-11 shrink-0'
                    onClick={onRequestSettlement}
                    disabled={!canRequestSettlement || requestSettlementPending}
                  >
                    {requestSettlementPending ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      <WalletCards />
                    )}
                    {t('Request settlement')}
                  </Button>
                ) : null}
              </div>

              <Progress
                data-settlement-readiness
                value={settlementProgress}
                aria-label={t('Minimum withdrawal amount')}
                className='[&_[data-slot=progress-track]]:bg-background/80 mt-4 gap-2 [&_[data-slot=progress-indicator]]:bg-emerald-500 dark:[&_[data-slot=progress-indicator]]:bg-emerald-400'
              >
                <ProgressLabel className='text-muted-foreground text-xs font-normal'>
                  {t('Minimum withdrawal amount')}
                </ProgressLabel>
                <span className='text-muted-foreground ml-auto text-xs tabular-nums'>
                  {money(minimumAmount)}
                </span>
              </Progress>

              <dl
                data-earnings-stages
                className='mt-5 grid gap-2 border-t pt-4 sm:grid-cols-3'
              >
                {[
                  [
                    t('Awaiting confirmation'),
                    money(summary?.estimated_amount),
                  ],
                  [t('Settled earnings'), money(summary?.settled_amount)],
                  [t('Paid earnings'), money(summary?.paid_amount)],
                ].map(([label, value]) => (
                  <MetricValue
                    key={label}
                    label={label}
                    value={value}
                    className='bg-background/80 rounded-lg p-3'
                  />
                ))}
              </dl>

              <section
                data-partner-performance
                aria-labelledby='partner-promotion-performance'
                className='bg-muted/25 mt-3 grid gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(160px,0.7fr)_minmax(0,1.3fr)] sm:items-center sm:p-4'
              >
                <div className='flex items-center gap-2.5'>
                  <span
                    data-metric-icon='performance'
                    className='bg-background text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border'
                  >
                    <BarChart3 className='size-4' aria-hidden='true' />
                  </span>
                  <h2
                    id='partner-promotion-performance'
                    className='text-sm font-medium'
                  >
                    {t('Promotion performance')}
                  </h2>
                </div>
                <dl className='grid grid-cols-2 gap-3'>
                  <MetricValue
                    label={t('Invited users')}
                    value={loading ? '-' : String(summary?.invitee_count ?? 0)}
                  />
                  <MetricValue
                    label={t('Invited user consumption')}
                    value={money(summary?.consumption_amount)}
                  />
                </dl>
              </section>
            </section>

            <aside
              data-partner-plan-card
              className='flex h-full min-w-0 flex-col gap-3'
            >
              <section
                data-partner-plan
                aria-labelledby='partner-plan-title'
                className='bg-background flex flex-col gap-3 rounded-xl border p-4 xl:min-h-0 xl:flex-1'
              >
                <CardTitle id='partner-plan-title' className='text-sm'>
                  {t('Promotion Partner Plan')}
                </CardTitle>
                <dl
                  data-partner-plan-terms
                  className='grid gap-2 text-sm sm:grid-cols-3 xl:min-h-0 xl:flex-1 xl:grid-cols-2'
                >
                  {settings ? (
                    <>
                      <div
                        data-partner-rate
                        className='bg-muted/40 ring-foreground/10 min-w-0 rounded-lg p-3 ring-1 xl:col-span-2 xl:flex xl:flex-col xl:justify-center'
                      >
                        <dt className='text-muted-foreground'>
                          {t('Commission rate')}
                        </dt>
                        <dd className='mt-1 font-mono text-2xl font-semibold tabular-nums'>
                          {(settings.commission_rate_bps / 100).toFixed(2)}%
                        </dd>
                      </div>
                      <div className='min-w-0 rounded-lg border p-3 xl:flex xl:flex-col xl:justify-center'>
                        <dt className='text-muted-foreground'>
                          {t('Confirmation period')}
                        </dt>
                        <dd className='mt-1 font-medium tabular-nums'>
                          {settings.confirmation_days} {t('days')}
                        </dd>
                      </div>
                    </>
                  ) : null}
                  <div className='min-w-0 rounded-lg border p-3 xl:flex xl:flex-col xl:justify-center'>
                    <dt className='text-muted-foreground'>{t('Since')}</dt>
                    <dd className='mt-1 font-medium tabular-nums'>
                      {formatDate(membership.effective_from, locale)}
                    </dd>
                  </div>
                </dl>
              </section>

              <div
                data-partner-referral
                className='bg-muted/25 grid min-w-0 gap-3 rounded-xl border p-3 sm:p-4'
              >
                <div className='flex items-center gap-2.5'>
                  <span className='bg-background flex size-9 shrink-0 items-center justify-center rounded-lg border'>
                    <Link2
                      className='text-muted-foreground size-4'
                      aria-hidden='true'
                    />
                  </span>
                  <p className='text-sm font-medium'>{t('Referral link')}</p>
                </div>
                {referralLink ? (
                  <div
                    data-referral-controls
                    className='grid min-w-0 gap-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center'
                  >
                    <Input
                      value={referralLink}
                      readOnly
                      aria-label={t('Referral link')}
                      className='bg-background min-h-11 min-w-0 font-mono text-xs'
                    />
                    <Button
                      variant='outline'
                      className='bg-background min-h-11 w-full xl:w-auto'
                      onClick={onCopyReferral}
                    >
                      <Copy />
                      {t('Copy link')}
                    </Button>
                  </div>
                ) : (
                  <p className='text-muted-foreground text-sm'>
                    {t(
                      'Your referral link will appear after an administrator approves your partner application.'
                    )}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyTable({ message }: { message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={8} className='text-muted-foreground h-28 text-center'>
        {message}
      </TableCell>
    </TableRow>
  )
}

export function ApplyPartnerDialog({
  open,
  mode = 'apply',
  onOpenChange,
  onApplied,
  defaultEmail,
  defaultReason = '',
}: {
  open: boolean
  mode?: 'apply' | 'reactivate'
  onOpenChange: (open: boolean) => void
  onApplied: () => void
  defaultEmail: string
  defaultReason?: string
}) {
  const { t } = useTranslation()
  const [contactEmail, setContactEmail] = useState(defaultEmail)
  const [reason, setReason] = useState(defaultReason)
  const reactivating = mode === 'reactivate'
  const normalizedContactEmail = contactEmail.trim()
  const contactEmailValid = contactEmailPattern.test(normalizedContactEmail)
  const mutation = useMutation({
    mutationFn: applyForPartner,
    onSuccess: (response) => {
      if (!response.success) return
      toast.success(
        t(
          reactivating
            ? 'Reactivation request submitted'
            : 'Application submitted'
        )
      )
      setContactEmail(defaultEmail)
      setReason(defaultReason)
      onOpenChange(false)
      onApplied()
    },
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md p-6'>
        <DialogHeader>
          <DialogTitle>
            {t(
              reactivating
                ? 'Request partner reactivation'
                : 'Apply to become a promotion partner'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              reactivating
                ? 'Submit this request for administrator review. Your existing partner application will be reused.'
                : 'All applications are reviewed manually.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='partner-contact-email'>{t('Contact email')}</Label>
            <Input
              id='partner-contact-email'
              type='email'
              autoComplete='email'
              required
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder={t('Enter an email address you check regularly.')}
              aria-describedby={
                contactEmail.length > 0 && !contactEmailValid
                  ? 'partner-contact-email-help partner-contact-email-error'
                  : 'partner-contact-email-help'
              }
              aria-invalid={contactEmail.length > 0 && !contactEmailValid}
            />
            <p
              id='partner-contact-email-help'
              className='text-muted-foreground text-xs leading-5'
            >
              {t('Enter an email address you check regularly.')}
            </p>
            {contactEmail.length > 0 && !contactEmailValid ? (
              <p
                id='partner-contact-email-error'
                role='alert'
                className='text-destructive text-xs'
              >
                {t('Please enter a valid email address')}
              </p>
            ) : null}
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='partner-reason'>{t('Application note')}</Label>
            <Textarea
              id='partner-reason'
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t(
                'Tell the administrator how you plan to promote the service'
              )}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className='-mx-6 -mb-6 p-6'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('Cancel')}
          </Button>
          <Button
            data-submit-application
            onClick={() =>
              mutation.mutate({ reason, contactEmail: normalizedContactEmail })
            }
            disabled={mutation.isPending || !contactEmailValid}
          >
            {mutation.isPending ? (
              <Loader2 className='animate-spin' />
            ) : (
              <Check />
            )}
            {t(
              reactivating
                ? 'Submit reactivation request'
                : 'Submit application'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProgramBenefit({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: typeof Link2
  title: string
  description: string
  tone: keyof typeof programBenefitToneClasses
}) {
  return (
    <div className='flex min-w-0 gap-3'>
      <div
        data-program-benefit-tone={tone}
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${programBenefitToneClasses[tone]}`}
      >
        <Icon className='size-4' aria-hidden='true' />
      </div>
      <div className='min-w-0'>
        <p className='text-sm font-medium'>{title}</p>
        <p className='text-muted-foreground mt-1 text-sm leading-6'>
          {description}
        </p>
      </div>
    </div>
  )
}

function ConsumptionPolicySummary({
  settings,
  minimumSettlementAmount,
  locale,
  loading,
}: {
  settings?: CommissionSettings | null
  minimumSettlementAmount: number
  locale?: string
  loading: boolean
}) {
  const { t } = useTranslation()
  useSystemConfig()

  return (
    <section
      data-consumption-policy
      aria-labelledby='commission-rate-title'
      className='bg-muted/30 ring-foreground/10 min-w-0 rounded-xl p-4 ring-1 sm:p-5'
    >
      <h3 id='commission-rate-title' className='sr-only'>
        {t('Commission rate')}
      </h3>

      {loading ? (
        <div className='text-muted-foreground flex min-h-32 items-center justify-center gap-2 text-sm'>
          <Loader2 className='size-4 animate-spin' />
          {t('Loading')}
        </div>
      ) : null}
      {!loading && settings ? (
        <>
          <div className='flex items-end gap-2'>
            <span className='text-foreground text-4xl font-semibold tracking-tight tabular-nums'>
              {(settings.commission_rate_bps / 100).toFixed(2)}%
            </span>
            <span className='text-muted-foreground pb-1 text-sm'>
              {t('Commission rate')}
            </span>
          </div>
          <p className='text-muted-foreground mt-2 text-sm leading-6'>
            {t('Earn commission from invited user consumption.')}
          </p>
          <dl
            data-policy-terms
            className='bg-background/70 mt-5 divide-y rounded-lg border px-4'
          >
            <div className='flex items-center justify-between gap-4 py-3'>
              <dt className='text-muted-foreground text-sm'>
                {t('Confirmation days')}
              </dt>
              <dd className='font-medium tabular-nums'>
                {settings.confirmation_days} {t('days')}
              </dd>
            </div>
            <div className='flex items-center justify-between gap-4 py-3'>
              <dt className='text-muted-foreground text-sm'>
                {t('Settlement mode')}
              </dt>
              <dd className='font-medium'>{t('On demand')}</dd>
            </div>
            <div className='flex items-center justify-between gap-4 py-3'>
              <dt className='text-muted-foreground text-sm'>
                {t('Minimum withdrawal amount')}
              </dt>
              <dd className='font-medium tabular-nums'>
                {formatCommissionAmount(minimumSettlementAmount, locale)}
              </dd>
            </div>
          </dl>
        </>
      ) : null}
      {!loading && !settings ? (
        <p className='text-muted-foreground py-8 text-sm'>
          {t('Commission settings are not available right now.')}
        </p>
      ) : null}
    </section>
  )
}

export function PartnerProgramOverview({
  settings,
  minimumSettlementAmount,
  locale,
  loading,
  application,
  canApply,
  onApply,
}: {
  settings?: CommissionSettings | null
  minimumSettlementAmount: number
  locale?: string
  loading: boolean
  application?: CommissionPartnerApplication | null
  canApply: boolean
  onApply: () => void
}) {
  const { t } = useTranslation()
  const applicationPending = application?.status === 'PENDING'
  const applicationRejected = application?.status === 'REJECTED'
  const steps = [
    {
      title: t('Review commission settings'),
      description: t(
        'Review the consumption commission rate and confirmation period.'
      ),
    },
    {
      title: t('Submit your application'),
      description: t(
        'Tell us where and how you plan to introduce the service.'
      ),
    },
    {
      title: t('Administrator review'),
      description: t('The administrator reviews your application note.'),
    },
    {
      title: t('Start promoting'),
      description: t(
        'After approval, copy your link and track earnings from this page.'
      ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <Card className='min-w-0'>
        <CardContent
          data-program-overview-layout
          className='grid gap-6 px-4 sm:px-5 lg:grid-cols-[minmax(0,3fr)_minmax(300px,2fr)] lg:items-center'
        >
          <div data-program-introduction className='max-w-2xl min-w-0'>
            <Badge variant='secondary'>{t('Promotion Partner Plan')}</Badge>
            <h2 className='mt-3 text-3xl font-semibold'>
              {t('Share the service and earn commission')}
            </h2>
            <p className='text-muted-foreground mt-3 text-base leading-7'>
              {t(
                'Turn recommendations into ongoing earnings. Apply, share your dedicated link, and follow every commission from estimate to payment.'
              )}
            </p>
            {canApply ? (
              <div className='mt-5 flex flex-wrap items-center gap-3'>
                <Button
                  onClick={onApply}
                  disabled={loading || applicationPending}
                >
                  {loading ? <Loader2 className='animate-spin' /> : null}
                  {!loading && applicationPending ? <Clock3 /> : null}
                  {!loading && !applicationPending ? <Send /> : null}
                  {applicationPending
                    ? t('Application pending')
                    : t('Apply now')}
                </Button>
              </div>
            ) : null}
            {applicationPending ? (
              <p className='text-muted-foreground mt-3 flex items-start gap-2 text-sm'>
                <Clock3 className='mt-0.5 size-4 shrink-0' aria-hidden='true' />
                {t(
                  'Your application has been submitted and is waiting for administrator review.'
                )}
              </p>
            ) : null}
            {applicationRejected ? (
              <div className='border-destructive/30 bg-destructive/5 mt-4 border-l-2 py-2 pl-3 text-sm'>
                <p>
                  {t(
                    'Your previous application was not approved. You can update your application and apply again.'
                  )}
                </p>
                {application.review_reason ? (
                  <p className='text-muted-foreground mt-1'>
                    {t('Rejection reason')}: {application.review_reason}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <ConsumptionPolicySummary
            settings={settings}
            minimumSettlementAmount={minimumSettlementAmount}
            locale={locale}
            loading={loading}
          />

          <div
            data-program-benefits
            className='grid min-w-0 gap-4 border-t pt-5 sm:grid-cols-3 lg:col-span-2'
          >
            <ProgramBenefit
              icon={Link2}
              tone='blue'
              title={t('Automatic attribution')}
              description={t(
                'Invitations are attributed automatically when users register through your link.'
              )}
            />
            <ProgramBenefit
              icon={BarChart3}
              tone='emerald'
              title={t('Transparent earnings data')}
              description={t(
                'Track invited users, commission entries, settlements, and payments in one place.'
              )}
            />
            <ProgramBenefit
              icon={WalletCards}
              tone='violet'
              title={t('On-demand settlement')}
              description={t(
                'Request a settlement when your confirmed earnings reach the minimum amount.'
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card data-joining-steps className='min-w-0 gap-3'>
        <CardHeader className='gap-1 px-4 py-0 sm:px-5'>
          <CardTitle className='text-lg'>{t('How to join')}</CardTitle>
          <p className='text-muted-foreground text-sm'>
            {t('Four clear steps from applying to earning commission.')}
          </p>
        </CardHeader>
        <CardContent className='px-4 pt-0 sm:px-5'>
          <ol className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {steps.map((step, index) => (
              <li key={step.title} className='flex min-w-0 items-start gap-3'>
                <span
                  data-step-number={index + 1}
                  className={`flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums ${stepToneClasses[index]}`}
                >
                  {index + 1}
                </span>
                <div data-step-content className='min-w-0 pt-0.5'>
                  <h3 className='text-sm font-medium'>{step.title}</h3>
                  <p className='text-muted-foreground mt-1 text-sm leading-6'>
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

export function PromotionPartner() {
  const { t, i18n } = useTranslation()
  const { currency: systemCurrency } = useSystemConfig()
  const locale = toIntlLocale(i18n.resolvedLanguage ?? i18n.language)
  const configuredCurrencyLabel = getCurrencyLabel()
  const settlementCurrencyLabel =
    configuredCurrencyLabel === 'Tokens' ? 'USD' : configuredCurrencyLabel
  const user = useAuthStore((state) => state.auth.user)
  const queryClient = useQueryClient()
  const [applyOpen, setApplyOpen] = useState(false)
  const [settlementRequestOpen, setSettlementRequestOpen] = useState(false)
  const [settlementRequestAmount, setSettlementRequestAmount] = useState('')
  const [inviteePage, setInviteePage] = useState(1)
  const [inviteePageSize, setInviteePageSize] = useState(PAGE_SIZE)
  const [ledgerPage, setLedgerPage] = useState(1)
  const [ledgerPageSize, setLedgerPageSize] = useState(PAGE_SIZE)
  const [ledgerStatus, setLedgerStatus] = useState('all')
  const [ledgerFrom, setLedgerFrom] = useState<Date | undefined>()
  const [ledgerTo, setLedgerTo] = useState<Date | undefined>()
  const [settlementPage, setSettlementPage] = useState(1)
  const [settlementPageSize, setSettlementPageSize] = useState(PAGE_SIZE)
  const { copyToClipboard } = useCopyToClipboard()

  const stateQuery = useQuery({
    queryKey: ['promotion-partner', 'state'],
    queryFn: getPartnerState,
  })
  const hasPartnerMembership = Boolean(stateQuery.data?.data?.membership)
  const summaryQuery = useQuery({
    queryKey: ['promotion-partner', 'summary'],
    queryFn: getCommissionSummary,
    enabled: hasPartnerMembership,
  })
  const inviteesQuery = useQuery({
    queryKey: ['promotion-partner', 'invitees', inviteePage, inviteePageSize],
    queryFn: () =>
      getCommissionInvitees({ p: inviteePage, page_size: inviteePageSize }),
    placeholderData: (previousData) => previousData,
    enabled: hasPartnerMembership,
  })
  const ledgerQuery = useQuery({
    queryKey: [
      'promotion-partner',
      'ledger',
      ledgerPage,
      ledgerPageSize,
      ledgerStatus,
      ledgerFrom?.getTime(),
      ledgerTo?.getTime(),
    ],
    queryFn: () =>
      getCommissionLedger({
        p: ledgerPage,
        page_size: ledgerPageSize,
        ...(ledgerStatus !== 'all' ? { status: ledgerStatus } : {}),
        ...getLedgerDateRangeParams(ledgerFrom, ledgerTo),
      }),
    placeholderData: (previousData) => previousData,
    enabled: hasPartnerMembership,
  })
  const settlementsQuery = useQuery({
    queryKey: [
      'promotion-partner',
      'settlements',
      settlementPage,
      settlementPageSize,
    ],
    queryFn: () =>
      getCommissionSettlements({
        p: settlementPage,
        page_size: settlementPageSize,
      }),
    placeholderData: (previousData) => previousData,
    enabled: hasPartnerMembership,
  })
  const requestSettlementMutation = useMutation({
    mutationFn: (payload: { amount: number; currency: string }) =>
      requestCommissionSettlement(payload),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.message || t('Settlement request failed'))
        return
      }
      toast.success(t('Settlement request submitted'))
      setSettlementRequestOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['promotion-partner'] })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t('Settlement request failed')
      )
    },
  })

  const state = stateQuery.data?.data
  const summary = summaryQuery.data?.data
  const membership = state?.membership
  const stateLoading =
    stateQuery.isPending || (stateQuery.isFetching && !membership)
  const settings = state?.settings
  const minimumSettlementAmount = settings?.minimum_settlement_amount ?? 0
  const confirmedSettlementAmount = summary?.confirmed_amount ?? 0
  const minimumSettlementInputAmount = formatSettlementRequestAmount(
    minimumSettlementAmount,
    'ceil'
  )
  const maximumSettlementInputAmount = formatSettlementRequestAmount(
    confirmedSettlementAmount
  )
  const application = state?.application
  const referralCode = user?.aff_code ?? ''
  const referralLink = useMemo(() => {
    if (typeof window === 'undefined' || !referralCode) return ''
    return `${window.location.origin}/sign-up?ref=${encodeURIComponent(referralCode)}`
  }, [referralCode])

  const refreshState = () => {
    void queryClient.invalidateQueries({ queryKey: ['promotion-partner'] })
  }
  const updateLedgerStatus = (value: string | null) => {
    setLedgerPage(1)
    setLedgerStatus(value ?? 'all')
  }
  const updateLedgerDateRange = (range: { start?: Date; end?: Date }) => {
    setLedgerPage(1)
    setLedgerFrom(range.start)
    setLedgerTo(range.end)
  }
  const invitees: PageData<CommissionInvitee> = inviteesQuery.data?.data ?? {
    items: [],
    total: 0,
    page: inviteePage,
    page_size: inviteePageSize,
  }
  const ledger: PageData<CommissionLedger> = ledgerQuery.data?.data ?? {
    items: [],
    total: 0,
    page: ledgerPage,
    page_size: ledgerPageSize,
  }
  const settlements: PageData<CommissionSettlement> = settlementsQuery.data
    ?.data ?? {
    items: [],
    total: 0,
    page: settlementPage,
    page_size: settlementPageSize,
  }

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>
          <span className='inline-flex min-w-0 items-center gap-2'>
            <Megaphone className='size-4 shrink-0' aria-hidden='true' />
            <span className='truncate'>{t('Promotion Partner')}</span>
          </span>
        </SectionPageLayout.Title>
        <SectionPageLayout.Content>
          <div
            data-partner-page-content
            className='mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-6'
          >
            {stateLoading ? <PartnerPageLoadingState /> : null}
            {!stateLoading && !membership ? (
              <PartnerProgramOverview
                settings={settings}
                minimumSettlementAmount={minimumSettlementAmount}
                locale={locale}
                loading={stateQuery.isPending}
                application={application}
                canApply={!membership}
                onApply={() => setApplyOpen(true)}
              />
            ) : null}
            {!stateLoading && membership ? (
              <PartnerMetricsOverview
                summary={summary}
                membership={membership}
                application={application}
                settings={settings}
                locale={locale}
                loading={summaryQuery.isPending}
                referralLink={referralLink}
                onCopyReferral={() => void copyToClipboard(referralLink)}
                onRequestReactivation={() => setApplyOpen(true)}
                onRequestSettlement={() => {
                  setSettlementRequestAmount(maximumSettlementInputAmount)
                  setSettlementRequestOpen(true)
                }}
                requestSettlementPending={requestSettlementMutation.isPending}
              />
            ) : null}
            <Tabs
              defaultValue='invitees'
              hidden={stateLoading || !membership}
              className='gap-3'
            >
              <PartnerWorkspaceNavigation />
              <TabsContent value='invitees' className='mt-0'>
                <Card data-partner-records-card className='gap-0 py-0'>
                  <CardHeader className='border-b px-4 py-3 sm:px-5'>
                    <div className='flex items-center justify-between gap-3'>
                      <CardTitle className='text-base'>
                        {t('Invited users')}
                      </CardTitle>
                      <Badge variant='secondary' className='tabular-nums'>
                        {invitees.total.toLocaleString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className='p-0'>
                    <div
                      data-partner-mobile-list='invitees'
                      className='divide-y md:hidden'
                    >
                      {invitees.items.length ? (
                        invitees.items.map((item) => (
                          <article
                            key={item.relation_id}
                            className='grid gap-3 p-4'
                          >
                            <div className='flex items-start justify-between gap-3'>
                              <div className='min-w-0'>
                                <p className='truncate font-medium'>
                                  {item.display_name || item.username}
                                </p>
                                <p className='text-muted-foreground truncate text-xs'>
                                  {item.username}
                                </p>
                              </div>
                              <Badge variant={statusBadgeVariant(item.status)}>
                                {statusLabel(item.status, t)}
                              </Badge>
                            </div>
                            <dl className='grid grid-cols-2 gap-3 text-sm'>
                              <MetricValue
                                label={t('Consumption')}
                                value={formatCommissionAmount(
                                  item.consumption_amount,
                                  locale
                                )}
                              />
                              <MetricValue
                                label={t('Commission')}
                                value={formatCommissionAmount(
                                  item.commission_amount,
                                  locale
                                )}
                              />
                            </dl>
                            <p className='text-muted-foreground text-xs'>
                              {t('Joined')} ·{' '}
                              {formatDate(item.registered_at, locale)}
                            </p>
                          </article>
                        ))
                      ) : (
                        <p className='text-muted-foreground px-4 py-12 text-center text-sm'>
                          {t('No invited users yet')}
                        </p>
                      )}
                    </div>
                    <div className='hidden md:block'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('User')}</TableHead>
                            <TableHead>{t('Status')}</TableHead>
                            <TableHead>{t('Joined')}</TableHead>
                            <TableHead>{t('Consumption')}</TableHead>
                            <TableHead>{t('Commission')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invitees.items.length ? (
                            invitees.items.map((item) => (
                              <TableRow key={item.relation_id}>
                                <TableCell>
                                  <div className='font-medium'>
                                    {item.display_name || item.username}
                                  </div>
                                  <div className='text-muted-foreground text-xs'>
                                    {item.username}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={statusBadgeVariant(item.status)}
                                  >
                                    {statusLabel(item.status, t)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {formatDate(item.registered_at, locale)}
                                </TableCell>
                                <TableCell>
                                  {formatCommissionAmount(
                                    item.consumption_amount,
                                    locale
                                  )}
                                </TableCell>
                                <TableCell className='font-medium'>
                                  {formatCommissionAmount(
                                    item.commission_amount,
                                    locale
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <EmptyTable message={t('No invited users yet')} />
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className='border-t px-4 pb-4 sm:px-5'>
                      <Pager
                        page={inviteePage}
                        total={invitees.total}
                        pageSize={inviteePageSize}
                        onChange={setInviteePage}
                        onPageSizeChange={(pageSize) => {
                          setInviteePageSize(pageSize)
                          setInviteePage(1)
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value='ledger' className='mt-0'>
                <Card data-partner-records-card className='gap-0 py-0'>
                  <CardHeader className='border-b px-4 py-3 sm:px-5'>
                    <div className='flex items-center justify-between gap-3'>
                      <CardTitle className='text-base'>
                        {t('Income ledger')}
                      </CardTitle>
                      <Badge variant='secondary' className='tabular-nums'>
                        {ledger.total.toLocaleString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <div
                    data-ledger-filters
                    className='bg-muted/25 grid gap-2 border-b px-4 py-3 sm:px-5 md:grid-cols-[minmax(150px,0.55fr)_minmax(280px,1.45fr)] md:items-end'
                  >
                    <div className='grid gap-1.5'>
                      <Label htmlFor='ledger-status-filter'>
                        {t('Status')}
                      </Label>
                      <Select
                        value={ledgerStatus}
                        onValueChange={updateLedgerStatus}
                      >
                        <SelectTrigger
                          id='ledger-status-filter'
                          className='w-full'
                        >
                          <SelectValue>
                            {ledgerStatus === 'all'
                              ? t('All statuses')
                              : statusLabel(ledgerStatus, t)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>
                            {t('All statuses')}
                          </SelectItem>
                          {[
                            'ESTIMATED',
                            'CONFIRMED',
                            'SETTLED',
                            'PAID',
                            'REVERSED',
                          ].map((status) => (
                            <SelectItem key={status} value={status}>
                              {statusLabel(status, t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='grid min-w-0 gap-1.5'>
                      <Label>{t('Date Range')}</Label>
                      <CompactDateTimeRangePicker
                        start={ledgerFrom}
                        end={ledgerTo}
                        onChange={updateLedgerDateRange}
                      />
                    </div>
                  </div>
                  <CardContent className='p-0'>
                    <div
                      data-partner-mobile-list='ledger'
                      className='divide-y md:hidden'
                    >
                      {ledger.items.length ? (
                        ledger.items.map((item) => (
                          <article key={item.id} className='grid gap-3 p-4'>
                            <div className='flex items-start justify-between gap-3'>
                              <p className='min-w-0 truncate font-mono text-xs'>
                                {item.ledger_no}
                              </p>
                              <LedgerStatusBadge
                                status={item.status}
                                label={statusLabel(item.status, t)}
                              />
                            </div>
                            <dl className='grid grid-cols-3 gap-2'>
                              <MetricValue
                                label={t('Base amount')}
                                value={formatCommissionAmount(
                                  item.commission_base_amount,
                                  locale
                                )}
                                valueClassName='text-base'
                              />
                              <MetricValue
                                label={t('Rate')}
                                value={`${(item.commission_rate_bps / 100).toFixed(2)}%`}
                                valueClassName='text-base'
                              />
                              <MetricValue
                                label={t('Commission')}
                                value={formatCommissionAmount(
                                  item.commission_amount,
                                  locale
                                )}
                                valueClassName='text-base'
                              />
                            </dl>
                            <p className='text-muted-foreground text-xs'>
                              {t('Occurred')} ·{' '}
                              {formatTimestamp(item.occurred_at, locale)}
                            </p>
                          </article>
                        ))
                      ) : (
                        <p className='text-muted-foreground px-4 py-12 text-center text-sm'>
                          {t('No commission entries yet')}
                        </p>
                      )}
                    </div>
                    <div className='hidden md:block'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('Ledger no.')}</TableHead>
                            <TableHead>{t('Status')}</TableHead>
                            <TableHead>{t('Base amount')}</TableHead>
                            <TableHead>{t('Rate')}</TableHead>
                            <TableHead>{t('Commission')}</TableHead>
                            <TableHead>{t('Occurred')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledger.items.length ? (
                            ledger.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className='font-mono text-xs'>
                                  {item.ledger_no}
                                </TableCell>
                                <TableCell>
                                  <LedgerStatusBadge
                                    status={item.status}
                                    label={statusLabel(item.status, t)}
                                  />
                                </TableCell>
                                <TableCell>
                                  {formatCommissionAmount(
                                    item.commission_base_amount,
                                    locale
                                  )}
                                </TableCell>
                                <TableCell>
                                  {(item.commission_rate_bps / 100).toFixed(2)}%
                                </TableCell>
                                <TableCell className='font-medium'>
                                  {formatCommissionAmount(
                                    item.commission_amount,
                                    locale
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatTimestamp(item.occurred_at, locale)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <EmptyTable
                              message={t('No commission entries yet')}
                            />
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className='border-t px-4 pb-4 sm:px-5'>
                      <Pager
                        page={ledgerPage}
                        total={ledger.total}
                        pageSize={ledgerPageSize}
                        onChange={setLedgerPage}
                        onPageSizeChange={(pageSize) => {
                          setLedgerPageSize(pageSize)
                          setLedgerPage(1)
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value='settlements' className='mt-0'>
                <Card data-partner-records-card className='gap-0 py-0'>
                  <CardHeader className='border-b px-4 py-3 sm:px-5'>
                    <div className='flex items-center justify-between gap-3'>
                      <CardTitle className='text-base'>
                        {t('Settlement records')}
                      </CardTitle>
                      <Badge variant='secondary' className='tabular-nums'>
                        {settlements.total.toLocaleString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className='p-0'>
                    <div
                      data-partner-mobile-list='settlements'
                      className='divide-y md:hidden'
                    >
                      {settlements.items.length ? (
                        settlements.items.map((item) => (
                          <article key={item.id} className='grid gap-3 p-4'>
                            <div className='flex items-start justify-between gap-3'>
                              <p className='min-w-0 truncate font-mono text-xs'>
                                {item.settlement_no}
                              </p>
                              <Badge variant={statusBadgeVariant(item.status)}>
                                {statusLabel(item.status, t)}
                              </Badge>
                            </div>
                            <dl className='grid grid-cols-2 gap-3'>
                              <MetricValue
                                label={t('Amount')}
                                value={formatCommissionAmount(
                                  item.final_amount,
                                  locale
                                )}
                                valueClassName='text-base'
                              />
                              <MetricValue
                                label={t('Paid')}
                                value={formatTimestamp(item.paid_at, locale)}
                                valueClassName='font-sans text-sm'
                              />
                            </dl>
                            <div className='text-muted-foreground grid gap-1 text-xs'>
                              <p>
                                {t('Period')} ·{' '}
                                {formatDate(item.period_start, locale)} –{' '}
                                {formatDate(item.period_end, locale)}
                              </p>
                              <p>
                                {t('Created')} ·{' '}
                                {formatTimestamp(item.created_at, locale)}
                              </p>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className='text-muted-foreground px-4 py-12 text-center text-sm'>
                          {t('No settlement records yet')}
                        </p>
                      )}
                    </div>
                    <div className='hidden md:block'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('Settlement no.')}</TableHead>
                            <TableHead>{t('Period')}</TableHead>
                            <TableHead>{t('Amount')}</TableHead>
                            <TableHead>{t('Status')}</TableHead>
                            <TableHead>{t('Created')}</TableHead>
                            <TableHead>{t('Paid')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settlements.items.length ? (
                            settlements.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className='font-mono text-xs'>
                                  {item.settlement_no}
                                </TableCell>
                                <TableCell>
                                  {formatDate(item.period_start, locale)} –{' '}
                                  {formatDate(item.period_end, locale)}
                                </TableCell>
                                <TableCell className='font-medium'>
                                  {formatCommissionAmount(
                                    item.final_amount,
                                    locale
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={statusBadgeVariant(item.status)}
                                  >
                                    {statusLabel(item.status, t)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {formatTimestamp(item.created_at, locale)}
                                </TableCell>
                                <TableCell>
                                  {formatTimestamp(item.paid_at, locale)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <EmptyTable
                              message={t('No settlement records yet')}
                            />
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className='border-t px-4 pb-4 sm:px-5'>
                      <Pager
                        page={settlementPage}
                        total={settlements.total}
                        pageSize={settlementPageSize}
                        onChange={setSettlementPage}
                        onPageSizeChange={(pageSize) => {
                          setSettlementPageSize(pageSize)
                          setSettlementPage(1)
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>
      <ApplyPartnerDialog
        key={`${membership?.status ?? 'no-membership'}-${application?.id ?? 'no-application'}-${application?.updated_at ?? 0}`}
        open={applyOpen}
        mode={membership?.status === 'DISABLED' ? 'reactivate' : 'apply'}
        onOpenChange={setApplyOpen}
        onApplied={refreshState}
        defaultEmail={application?.contact_email || user?.email || ''}
        defaultReason={application?.apply_reason ?? ''}
      />
      <Dialog
        open={settlementRequestOpen}
        onOpenChange={setSettlementRequestOpen}
      >
        <DialogContent className='max-w-md p-6'>
          <DialogHeader>
            <DialogTitle>{t('Request settlement')}</DialogTitle>
            <DialogDescription>
              {t(
                'Enter an amount between the configured minimum and your confirmed earnings.'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-2'>
            <Label htmlFor='settlement-request-amount'>
              {t('Settlement amount')} ({settlementCurrencyLabel})
            </Label>
            <Input
              id='settlement-request-amount'
              type='number'
              min={minimumSettlementInputAmount}
              max={maximumSettlementInputAmount}
              step='0.01'
              value={settlementRequestAmount}
              onChange={(event) =>
                setSettlementRequestAmount(event.target.value)
              }
              onBlur={() => {
                const convertedAmount = settlementRequestAmountToUnits(
                  settlementRequestAmount,
                  systemCurrency
                )
                const amount = resolveSettlementRequestAmount(
                  convertedAmount,
                  settlementRequestAmount,
                  confirmedSettlementAmount,
                  maximumSettlementInputAmount
                )
                if (!Number.isFinite(amount)) return
                if (amount < minimumSettlementAmount) {
                  setSettlementRequestAmount(minimumSettlementInputAmount)
                  return
                }
                if (amount > confirmedSettlementAmount) {
                  setSettlementRequestAmount(maximumSettlementInputAmount)
                  return
                }
                setSettlementRequestAmount(
                  Number(settlementRequestAmount).toFixed(
                    settlementInputFractionDigits()
                  )
                )
              }}
            />
            <p className='text-muted-foreground text-xs'>
              {t('Minimum settlement amount')}:{' '}
              {formatCommissionAmount(minimumSettlementAmount, locale)}
              {' · '}
              {t('Confirmed earnings')}:{' '}
              {formatCommissionAmount(confirmedSettlementAmount, locale)}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setSettlementRequestOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button
              disabled={requestSettlementMutation.isPending}
              onClick={() => {
                const convertedAmount = settlementRequestAmountToUnits(
                  settlementRequestAmount,
                  systemCurrency
                )
                const amount = resolveSettlementRequestAmount(
                  convertedAmount,
                  settlementRequestAmount,
                  confirmedSettlementAmount,
                  maximumSettlementInputAmount
                )
                if (!Number.isFinite(amount) || amount <= 0) {
                  toast.error(t('Enter a valid settlement amount'))
                  return
                }
                if (amount < minimumSettlementAmount) {
                  toast.error(
                    t('Settlement amount is below the configured minimum')
                  )
                  return
                }
                if (amount > confirmedSettlementAmount) {
                  toast.error(t('Settlement amount exceeds confirmed earnings'))
                  return
                }
                requestSettlementMutation.mutate({
                  amount,
                  currency: settings?.currency || 'USD',
                })
              }}
            >
              {requestSettlementMutation.isPending ? (
                <Loader2 className='animate-spin' />
              ) : null}
              {t('Submit request')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
