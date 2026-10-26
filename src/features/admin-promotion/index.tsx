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
  Banknote,
  Check,
  ClipboardList,
  History,
  Loader2,
  Megaphone,
  Pencil,
  Search,
  Settings,
  SlidersHorizontal,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { ErrorState } from '@/components/error-state'
import { SectionPageLayout } from '@/components/layout'
import { LoadingState } from '@/components/loading-state'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type { User } from '@/features/users/types'
import { useDebounce } from '@/hooks/use-debounce'
import { useSystemConfig } from '@/hooks/use-system-config'
import { toIntlLocale } from '@/i18n/languages'
import { getCurrencyLabel } from '@/lib/currency'

import { LedgerStatusBadge } from '../promotion-partner/ledger-status-badge'
import { ListPager as Pager } from '../promotion-partner/pager'
import type {
  CommissionLedger,
  CommissionPartnerApplication,
  CommissionSettlement,
} from '../promotion-partner/types'
import {
  commissionEntryLabel,
  commissionDisplayAmountToUnits,
  formatCommissionInputAmount,
  formatCommissionAmount,
  formatTimestamp,
  referralTypeLabel,
  statusBadgeVariant,
  statusLabel,
} from '../promotion-partner/utils'
import {
  getAdminLedger,
  getAdminLedgerDetail,
  getAdminSettlements,
  getAdminSummary,
  getApplications,
  getReferrals,
  getSettings,
  getSettingVersions,
  reviewApplication,
  reviewSettlement,
  setPartnerEnabled,
  setReferralEnabled,
  updateSettings,
} from './api'
import { PartnerStatusControl } from './partner-status-control'
import { RemoteUserSelect } from './remote-user-select'
import type {
  CommissionLedgerDetail,
  CommissionSettingVersion,
  PageData,
  ReferralRelation,
} from './types'

const PAGE_SIZE = 10

function amountValue(value: number | undefined | null): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function ReviewDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
  application,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onSubmit: (approve: boolean, reason: string, paymentMethod: string) => void
  application?: Pick<
    CommissionPartnerApplication,
    'contact_email' | 'apply_reason'
  > | null
}) {
  const { t } = useTranslation()
  const [approve, setApprove] = useState(true)
  const [reason, setReason] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('quota')
  const paymentMethodLabel =
    paymentMethod === 'offline_transfer'
      ? t('Offline transfer')
      : t('Transfer to wallet')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg p-6'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t('Record a reason for this decision for the audit trail.')}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          {application ? (
            <dl
              data-application-details
              className='bg-muted/40 grid gap-3 rounded-lg border p-4 text-sm'
            >
              <div className='grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3'>
                <dt className='text-muted-foreground'>{t('Contact email')}</dt>
                <dd className='min-w-0 break-all sm:text-right'>
                  <a
                    className='hover:text-primary underline underline-offset-4'
                    href={`mailto:${application.contact_email}`}
                  >
                    {application.contact_email || '-'}
                  </a>
                </dd>
              </div>
              <div className='grid gap-1 border-t pt-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3'>
                <dt className='text-muted-foreground'>
                  {t('Application note')}
                </dt>
                <dd className='min-w-0 break-words whitespace-pre-wrap sm:text-right'>
                  {application.apply_reason || '-'}
                </dd>
              </div>
            </dl>
          ) : null}
          <div className='flex gap-2'>
            <Button
              type='button'
              variant={approve ? 'default' : 'outline'}
              onClick={() => setApprove(true)}
            >
              <Check />
              {t('Approve')}
            </Button>
            <Button
              type='button'
              variant={!approve ? 'destructive' : 'outline'}
              onClick={() => setApprove(false)}
            >
              <X />
              {t('Reject')}
            </Button>
          </div>
          <div className='grid gap-2'>
            {!application && approve ? (
              <div className='grid gap-2'>
                <Label htmlFor='settlement-payment-method'>
                  {t('Settlement payment method')}
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => {
                    if (value) setPaymentMethod(value)
                  }}
                >
                  <SelectTrigger id='settlement-payment-method'>
                    <SelectValue>{paymentMethodLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='quota'>
                      {t('Transfer to wallet')}
                    </SelectItem>
                    <SelectItem value='offline_transfer'>
                      {t('Offline transfer')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <Label htmlFor='review-reason'>{t('Reason')}</Label>
            <Textarea
              id='review-reason'
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className='-mx-6 -mb-6 p-6'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={() => {
              onSubmit(approve, reason, paymentMethod)
              onOpenChange(false)
            }}
          >
            {t('Save decision')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReasonDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onSubmit: (reason: string) => void
}) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const close = () => {
    setReason('')
    onOpenChange(false)
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setReason('')
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className='max-w-md p-6'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t('Record a reason for this decision for the audit trail.')}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-2'>
          <Label htmlFor='referral-status-reason'>{t('Reason')}</Label>
          <Textarea
            id='referral-status-reason'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            autoFocus
          />
        </div>
        <DialogFooter className='-mx-6 -mb-6 p-6'>
          <Button variant='outline' onClick={close}>
            {t('Cancel')}
          </Button>
          <Button
            disabled={!reason.trim()}
            onClick={() => {
              onSubmit(reason.trim())
              close()
            }}
          >
            <Check />
            {t('Save decision')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LedgerDetailField({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: ReactNode
  emphasis?: boolean
}) {
  return (
    <div className='min-w-0 border-b pb-2 last:border-b-0 sm:last:border-b'>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd
        className={
          emphasis
            ? 'text-primary mt-1 text-base font-semibold break-all tabular-nums'
            : 'mt-1 text-sm break-all tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  )
}

export function LedgerDetailDialog({
  ledgerId,
  onOpenChange,
}: {
  ledgerId: number | null
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  useSystemConfig()
  const locale = toIntlLocale(i18n.resolvedLanguage ?? i18n.language)
  const detailQuery = useQuery({
    queryKey: ['admin-promotion', 'ledger-detail', ledgerId],
    queryFn: () => getAdminLedgerDetail(ledgerId as number),
    enabled: ledgerId !== null,
  })
  const detail: CommissionLedgerDetail | undefined = detailQuery.data?.data
  const ledger = detail?.ledger
  const identityFields: Array<[string, ReactNode]> = ledger
    ? [
        [t('Ledger no.'), ledger.ledger_no],
        [t('Referral relation'), `#${ledger.referral_relation_id}`],
        [t('Inviter'), ledger.inviter_username || '-'],
        [t('Invitee'), ledger.invitee_username || '-'],
        [
          t('Referral type'),
          referralTypeLabel(detail?.relation?.referral_type ?? '', t),
        ],
        [t('Source'), `${ledger.source_type} · ${ledger.source_id}`],
        [t('Business no.'), ledger.source_biz_no || '-'],
      ]
    : []
  const financialFields: Array<[string, ReactNode, boolean?]> = ledger
    ? [
        [
          t('Consumption'),
          formatCommissionAmount(ledger.consumption_amount, locale),
        ],
        [
          t('Upstream cost'),
          formatCommissionAmount(ledger.upstream_cost, locale),
        ],
        [
          t('Gross profit'),
          formatCommissionAmount(ledger.gross_profit, locale),
        ],
        [
          t('Base amount'),
          formatCommissionAmount(ledger.commission_base_amount, locale),
        ],
        [t('Rate'), `${(ledger.commission_rate_bps / 100).toFixed(2)}%`],
        [
          t('Commission'),
          formatCommissionAmount(ledger.commission_amount, locale),
          true,
        ],
      ]
    : []
  const lifecycleFields: Array<[string, ReactNode]> = ledger
    ? [
        [t('Status'), statusLabel(ledger.status, t)],
        [
          t('Settings version'),
          ledger.commission_setting_version > 0
            ? `v${ledger.commission_setting_version}`
            : '-',
        ],
        [t('Occurred'), formatTimestamp(ledger.occurred_at, locale)],
        [t('Confirmed'), formatTimestamp(ledger.confirmed_at, locale)],
        [t('Settled'), formatTimestamp(ledger.settled_at, locale)],
        [t('Paid'), formatTimestamp(ledger.paid_at, locale)],
      ]
    : []
  let content: ReactNode
  if (detailQuery.isPending) {
    content = (
      <div className='text-muted-foreground flex min-h-40 items-center justify-center gap-2 text-sm'>
        <Loader2 className='size-4 animate-spin' />
        {t('Loading')}
      </div>
    )
  } else if (ledger && detail) {
    content = (
      <div data-ledger-detail-layout className='grid gap-5'>
        <section
          data-ledger-financial-section
          className='bg-muted/30 rounded-lg border p-4'
        >
          <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
            <h3 className='text-sm font-medium'>{t('Financial summary')}</h3>
            <Badge variant={statusBadgeVariant(ledger.status)}>
              {statusLabel(ledger.status, t)}
            </Badge>
          </div>
          <dl className='grid gap-x-5 gap-y-3 sm:grid-cols-3'>
            {financialFields.map(([label, value, emphasis]) => (
              <LedgerDetailField
                key={label}
                label={label}
                value={value}
                emphasis={emphasis}
              />
            ))}
          </dl>
        </section>
        <div className='grid gap-5 lg:grid-cols-2'>
          <section data-ledger-identity-section className='min-w-0'>
            <h3 className='text-sm font-medium'>{t('Ledger information')}</h3>
            <dl className='mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2'>
              {identityFields.map(([label, value]) => (
                <LedgerDetailField key={label} label={label} value={value} />
              ))}
            </dl>
          </section>
          <section data-ledger-lifecycle-section className='min-w-0'>
            <h3 className='text-sm font-medium'>{t('Lifecycle')}</h3>
            <dl className='mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2'>
              {lifecycleFields.map(([label, value]) => (
                <LedgerDetailField key={label} label={label} value={value} />
              ))}
            </dl>
          </section>
        </div>
        <section data-ledger-reversals-section>
          <div className='mb-2 flex items-center justify-between gap-2'>
            <h3 className='text-sm font-medium'>{t('Reversals')}</h3>
            <span className='text-muted-foreground text-xs'>
              {detail.reversals.length}
            </span>
          </div>
          {detail.reversals.length ? (
            <div className='grid gap-2'>
              {detail.reversals.map((item) => (
                <div key={item.id} className='border p-3 text-sm'>
                  <div className='flex flex-wrap justify-between gap-2'>
                    <span className='font-medium'>
                      {formatCommissionAmount(item.amount, locale)}
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      {formatTimestamp(item.created_at, locale)}
                    </span>
                  </div>
                  <p className='text-muted-foreground mt-1'>{item.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>{t('No reversals')}</p>
          )}
        </section>
      </div>
    )
  } else {
    content = (
      <p className='text-destructive py-10 text-center text-sm'>
        {t('Unable to load ledger detail')}
      </p>
    )
  }
  return (
    <Dialog open={ledgerId !== null} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] w-[calc(100%-2rem)] max-w-[750px] overflow-y-auto p-6 sm:max-w-[750px]'>
        <DialogHeader>
          <DialogTitle>{t('Commission ledger detail')}</DialogTitle>
          <DialogDescription>
            {t('Financial snapshot and related reversals.')}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

export function SettingsPanel() {
  const { t, i18n } = useTranslation()
  useSystemConfig()
  const locale = toIntlLocale(i18n.resolvedLanguage ?? i18n.language)
  const configuredCurrencyLabel = getCurrencyLabel()
  const monetaryCurrencyLabel =
    configuredCurrencyLabel === 'Tokens' ? 'USD' : configuredCurrencyLabel
  const minimumSettlementLabel = `${t('Minimum settlement amount')} (${monetaryCurrencyLabel})`
  const queryClient = useQueryClient()
  const settingsQuery = useQuery({
    queryKey: ['admin-promotion', 'settings'],
    queryFn: getSettings,
  })
  const [minimum, setMinimum] = useState<string | null>(null)
  const [rate, setRate] = useState<string | null>(null)
  const [days, setDays] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [pendingUpdate, setPendingUpdate] = useState<{
    minimumSettlementAmount: number
    commissionRateBps: number
    confirmationDays: number
  } | null>(null)
  const historyQuery = useQuery({
    queryKey: ['admin-promotion', 'setting-versions', historyPage],
    queryFn: () => getSettingVersions({ p: historyPage, page_size: PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
  })
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (response) => {
      if (response.success) {
        toast.success(t('Settings saved'))
        void queryClient.invalidateQueries({
          queryKey: ['admin-promotion', 'settings'],
        })
        void queryClient.invalidateQueries({
          queryKey: ['admin-promotion', 'setting-versions'],
        })
        setMinimum(null)
        setRate(null)
        setDays(null)
        setHistoryPage(1)
        setPendingUpdate(null)
      }
    },
  })
  const setting = settingsQuery.data?.data
  const minimumValue =
    minimum ?? formatCommissionInputAmount(setting?.minimum_settlement_amount)
  const minimumInputStep =
    Math.abs(Number(minimumValue)) >= 1 ? '0.01' : '0.0001'
  const rateValue =
    rate ?? ((setting?.commission_rate_bps ?? 0) / 100).toFixed(2)
  const daysValue = days ?? String(setting?.confirmation_days ?? 0)
  const draftMinimumAmount =
    setting && minimum === null
      ? setting.minimum_settlement_amount
      : commissionDisplayAmountToUnits(minimumValue)
  const draftRateBps = Math.round(Number(rateValue) * 100)
  const draftConfirmationDays = Number(daysValue)
  const hasChanges = Boolean(
    setting &&
    (draftMinimumAmount !== setting.minimum_settlement_amount ||
      draftRateBps !== setting.commission_rate_bps ||
      draftConfirmationDays !== setting.confirmation_days)
  )
  const history: PageData<CommissionSettingVersion> = historyQuery.data
    ?.data ?? {
    items: [],
    total: 0,
    page: historyPage,
    page_size: PAGE_SIZE,
  }
  const validateAndConfirm = () => {
    if (
      !Number.isFinite(draftMinimumAmount) ||
      draftMinimumAmount < 0 ||
      !Number.isFinite(draftRateBps) ||
      draftRateBps < 0 ||
      draftRateBps > 10_000 ||
      !Number.isInteger(draftConfirmationDays) ||
      draftConfirmationDays < 0
    ) {
      toast.error(t('Enter a valid amount'))
      return
    }
    setPendingUpdate({
      minimumSettlementAmount: draftMinimumAmount,
      commissionRateBps: draftRateBps,
      confirmationDays: draftConfirmationDays,
    })
  }
  return (
    <div className='grid gap-4'>
      <Card data-settlement-settings-card>
        <CardHeader className='flex-row items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Settings className='size-4' />
            {t('Settlement settings')}
          </CardTitle>
          {setting ? <Badge variant='outline'>v{setting.version}</Badge> : null}
        </CardHeader>
        <CardContent>
          <div data-settings-fields className='grid gap-5 lg:grid-cols-3'>
            <div className='grid gap-2'>
              <Label htmlFor='minimum-settlement'>
                {minimumSettlementLabel}
              </Label>
              <Input
                id='minimum-settlement'
                type='number'
                min='0'
                step={minimumInputStep}
                value={minimumValue}
                onChange={(event) => setMinimum(event.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='commission-rate'>
                {t('Commission rate (%)')}
              </Label>
              <Input
                id='commission-rate'
                type='number'
                min='0'
                max='100'
                step='0.01'
                value={rateValue}
                onChange={(event) => setRate(event.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='confirmation-days'>
                {t('Confirmation days')}
              </Label>
              <Input
                id='confirmation-days'
                type='number'
                min='0'
                step='1'
                value={daysValue}
                onChange={(event) => setDays(event.target.value)}
              />
            </div>
          </div>
          <div className='mt-5 flex justify-end border-t pt-4'>
            <Button
              data-save-settings
              className='min-h-11 w-full sm:w-auto'
              disabled={mutation.isPending || !setting || !hasChanges}
              onClick={validateAndConfirm}
            >
              {mutation.isPending ? (
                <Loader2 className='animate-spin' />
              ) : (
                <Check />
              )}
              {t('Save settings')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-settings-history-card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <History className='size-4' aria-hidden='true' />
            <span id='settings-history-title'>{t('Settings history')}</span>
          </CardTitle>
          <p className='text-muted-foreground text-sm'>
            {t(
              'Historical versions remain unchanged for commission calculations.'
            )}
          </p>
        </CardHeader>
        <CardContent>
          <section aria-labelledby='settings-history-title' className='min-w-0'>
            <div className='overflow-x-auto rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Settings version')}</TableHead>
                    <TableHead>{t('Effective time')}</TableHead>
                    <TableHead>{t('Commission rate')}</TableHead>
                    <TableHead>{t('Confirmation days')}</TableHead>
                    <TableHead>{minimumSettlementLabel}</TableHead>
                    <TableHead>{t('Updated by')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyQuery.isPending ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-muted-foreground h-24 text-center'
                      >
                        <Loader2 className='mr-2 inline size-4 animate-spin' />
                        {t('Loading')}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {!historyQuery.isPending && history.items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-muted-foreground h-24 text-center'
                      >
                        {t('No settings history')}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {!historyQuery.isPending
                    ? history.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <span className='font-medium tabular-nums'>
                                v{item.version}
                              </span>
                              {item.version === setting?.version ? (
                                <Badge variant='secondary'>
                                  {t('Current')}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className='whitespace-nowrap'>
                            {formatTimestamp(item.effective_at, locale)}
                          </TableCell>
                          <TableCell className='tabular-nums'>
                            {(item.commission_rate_bps / 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className='tabular-nums'>
                            {item.confirmation_days}
                          </TableCell>
                          <TableCell className='tabular-nums'>
                            {formatCommissionAmount(
                              item.minimum_settlement_amount,
                              locale
                            )}
                          </TableCell>
                          <TableCell>
                            {item.created_by_username ||
                              (item.created_by > 0
                                ? `#${item.created_by}`
                                : t('System'))}
                          </TableCell>
                        </TableRow>
                      ))
                    : null}
                </TableBody>
              </Table>
            </div>
            <div data-settings-history-pager>
              <Pager
                page={historyPage}
                total={history.total}
                onChange={setHistoryPage}
              />
            </div>
          </section>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingUpdate !== null}
        className='p-6 data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-[600px] [&_[data-slot=alert-dialog-footer]]:-mx-6 [&_[data-slot=alert-dialog-footer]]:-mb-6 [&_[data-slot=alert-dialog-footer]]:p-6'
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setPendingUpdate(null)
        }}
        title={t('Confirm settlement settings update')}
        desc={t(
          'Saving creates a new settings version and keeps previous versions for historical commission calculations.'
        )}
        confirmText={t('Save settings')}
        isLoading={mutation.isPending}
        handleConfirm={() => {
          if (pendingUpdate) mutation.mutate(pendingUpdate)
        }}
      >
        {pendingUpdate && setting ? (
          <div className='overflow-hidden rounded-md border'>
            <table
              data-settings-comparison-table
              className='w-full table-fixed text-sm'
            >
              <thead className='bg-muted/50'>
                <tr className='border-b text-left'>
                  <th className='w-[46%] px-4 py-3 font-medium'>
                    {t('Setting item')}
                  </th>
                  <th className='w-[27%] px-4 py-3 font-medium'>
                    {t('Before change')}
                  </th>
                  <th className='w-[27%] px-4 py-3 font-medium'>
                    {t('After change')}
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                <tr>
                  <th className='px-4 py-3 text-left font-normal'>
                    {t('Commission rate')}
                  </th>
                  <td
                    data-settings-comparison
                    className='px-4 py-3 whitespace-nowrap tabular-nums'
                  >
                    {(setting.commission_rate_bps / 100).toFixed(2)}%
                  </td>
                  <td className='text-primary px-4 py-3 font-medium whitespace-nowrap tabular-nums'>
                    {(pendingUpdate.commissionRateBps / 100).toFixed(2)}%
                  </td>
                </tr>
                <tr>
                  <th className='px-4 py-3 text-left font-normal'>
                    {t('Confirmation days')}
                  </th>
                  <td
                    data-settings-comparison
                    className='px-4 py-3 whitespace-nowrap tabular-nums'
                  >
                    {setting.confirmation_days}
                  </td>
                  <td className='text-primary px-4 py-3 font-medium whitespace-nowrap tabular-nums'>
                    {pendingUpdate.confirmationDays}
                  </td>
                </tr>
                <tr>
                  <th className='px-4 py-3 text-left font-normal sm:whitespace-nowrap'>
                    {minimumSettlementLabel}
                  </th>
                  <td
                    data-settings-comparison
                    className='px-4 py-3 whitespace-nowrap tabular-nums'
                  >
                    {formatCommissionAmount(
                      setting.minimum_settlement_amount,
                      locale
                    )}
                  </td>
                  <td className='text-primary px-4 py-3 font-medium whitespace-nowrap tabular-nums'>
                    {formatCommissionAmount(
                      pendingUpdate.minimumSettlementAmount,
                      locale
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}

export function AdminPromotion() {
  const { t, i18n } = useTranslation()
  useSystemConfig()
  const locale = toIntlLocale(i18n.resolvedLanguage ?? i18n.language)
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('overview')
  const [summaryInviter, setSummaryInviter] = useState<User | null>(null)
  const [applicationPage, setApplicationPage] = useState(1)
  const [referralPage, setReferralPage] = useState(1)
  const [ledgerPage, setLedgerPage] = useState(1)
  const [ledgerInviter, setLedgerInviter] = useState('')
  const [ledgerInvitee, setLedgerInvitee] = useState('')
  const debouncedLedgerInviter = useDebounce(ledgerInviter, 500)
  const debouncedLedgerInvitee = useDebounce(ledgerInvitee, 500)
  const [ledgerNo, setLedgerNo] = useState('')
  const [ledgerStatus, setLedgerStatus] = useState('all')
  const [settlementPage, setSettlementPage] = useState(1)
  const [reviewTarget, setReviewTarget] =
    useState<CommissionPartnerApplication | null>(null)
  const [settlementReviewTarget, setSettlementReviewTarget] = useState<
    number | null
  >(null)
  const [ledgerDetailTarget, setLedgerDetailTarget] = useState<number | null>(
    null
  )
  const [referralStatusTarget, setReferralStatusTarget] = useState<{
    id: number
    enabled: boolean
  } | null>(null)
  const [partnerStatusTarget, setPartnerStatusTarget] = useState<{
    userId: number
    username: string
    enabled: boolean
  } | null>(null)

  const summaryQuery = useQuery({
    queryKey: ['admin-promotion', 'summary', summaryInviter?.id],
    queryFn: () => getAdminSummary(summaryInviter?.id),
  })
  const applicationsQuery = useQuery({
    queryKey: ['admin-promotion', 'applications', applicationPage],
    queryFn: () =>
      getApplications({ p: applicationPage, page_size: PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
  })
  const referralsQuery = useQuery({
    queryKey: ['admin-promotion', 'referrals', referralPage],
    queryFn: () =>
      getReferrals({
        p: referralPage,
        page_size: PAGE_SIZE,
        referral_type: 'ref',
      }),
    placeholderData: (previousData) => previousData,
  })
  const ledgerQuery = useQuery({
    queryKey: [
      'admin-promotion',
      'ledger',
      ledgerPage,
      debouncedLedgerInviter,
      debouncedLedgerInvitee,
      ledgerNo,
      ledgerStatus,
    ],
    queryFn: () =>
      getAdminLedger({
        p: ledgerPage,
        page_size: PAGE_SIZE,
        inviter_keyword: debouncedLedgerInviter.trim() || undefined,
        invitee_keyword: debouncedLedgerInvitee.trim() || undefined,
        ledger_no: ledgerNo.trim() || undefined,
        status: ledgerStatus === 'all' ? undefined : ledgerStatus,
      }),
    placeholderData: (previousData) => previousData,
  })
  const settlementsQuery = useQuery({
    queryKey: ['admin-promotion', 'settlements', settlementPage],
    queryFn: () =>
      getAdminSettlements({ p: settlementPage, page_size: PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
  })

  const reviewMutation = useMutation({
    mutationFn: (payload: { id: number; approve: boolean; reason: string }) =>
      reviewApplication(payload.id, {
        approve: payload.approve,
        reason: payload.reason,
      }),
    onSuccess: () => {
      toast.success(t('Application updated'))
      void queryClient.invalidateQueries({ queryKey: ['admin-promotion'] })
    },
  })
  const settlementReviewMutation = useMutation({
    mutationFn: (payload: {
      id: number
      approve: boolean
      reason: string
      paymentMethod: string
    }) =>
      reviewSettlement(payload.id, {
        approve: payload.approve,
        reason: payload.reason,
        payment_method: payload.paymentMethod,
      }),
    onSuccess: () => {
      toast.success(t('Settlement updated'))
      void queryClient.invalidateQueries({ queryKey: ['admin-promotion'] })
    },
  })
  const referralMutation = useMutation({
    mutationFn: (payload: { id: number; enabled: boolean; reason: string }) =>
      setReferralEnabled(payload.id, payload.enabled, payload.reason),
    onSuccess: () => {
      toast.success(t('Referral status updated'))
      void queryClient.invalidateQueries({
        queryKey: ['admin-promotion', 'referrals'],
      })
    },
  })
  const partnerStatusMutation = useMutation({
    mutationFn: (payload: { userId: number; enabled: boolean }) =>
      setPartnerEnabled(payload.userId, payload.enabled),
    onSuccess: () => {
      toast.success(t('Partner status updated'))
      setPartnerStatusTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin-promotion'] })
    },
  })

  const summary = summaryQuery.data?.data
  const applications: PageData<CommissionPartnerApplication> = applicationsQuery
    .data?.data ?? {
    items: [],
    total: 0,
    page: applicationPage,
    page_size: PAGE_SIZE,
  }
  const referrals: PageData<ReferralRelation> = referralsQuery.data?.data ?? {
    items: [],
    total: 0,
    page: referralPage,
    page_size: PAGE_SIZE,
  }
  const ledger: PageData<CommissionLedger> = ledgerQuery.data?.data ?? {
    items: [],
    total: 0,
    page: ledgerPage,
    page_size: PAGE_SIZE,
  }
  const settlements: PageData<CommissionSettlement> = settlementsQuery.data
    ?.data ?? {
    items: [],
    total: 0,
    page: settlementPage,
    page_size: PAGE_SIZE,
  }

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>
          <span className='inline-flex items-center gap-2'>
            <Megaphone className='size-4' />
            {t('Promotion')}
          </span>
        </SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              void queryClient.invalidateQueries({
                queryKey: ['admin-promotion'],
              })
            }
          >
            <SlidersHorizontal />
            {t('Refresh')}
          </Button>
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <Tabs
            value={tab}
            onValueChange={(value) => {
              if (!value) return
              setTab(value)
              const resourceByTab: Record<string, string> = {
                overview: 'summary',
                applications: 'applications',
                referrals: 'referrals',
                ledger: 'ledger',
                settlements: 'settlements',
                settings: 'settings',
              }
              const resource = resourceByTab[value]
              if (resource) {
                void queryClient.invalidateQueries({
                  queryKey: ['admin-promotion', resource],
                })
              }
            }}
          >
            <TabsList className='max-w-full flex-wrap justify-start group-data-horizontal/tabs:h-auto'>
              <TabsTrigger value='overview'>{t('Overview')}</TabsTrigger>
              <TabsTrigger value='applications'>
                {t('Applications')}
              </TabsTrigger>
              <TabsTrigger value='referrals'>{t('Referrals')}</TabsTrigger>
              <TabsTrigger value='ledger'>{t('Ledger')}</TabsTrigger>
              <TabsTrigger value='settlements'>{t('Settlements')}</TabsTrigger>
              <TabsTrigger value='settings'>
                {t('Settlement settings')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value='overview' className='mt-4'>
              <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-end'>
                <div className='grid gap-1.5 sm:w-80'>
                  <Label htmlFor='summary-inviter-filter'>
                    {t('Promotion Partner')}
                  </Label>
                  <RemoteUserSelect
                    id='summary-inviter-filter'
                    value={summaryInviter}
                    onValueChange={setSummaryInviter}
                    placeholder={t('All users')}
                  />
                </div>
                <Button
                  variant='outline'
                  disabled={!summaryInviter}
                  onClick={() => setSummaryInviter(null)}
                >
                  <X />
                  {t('Clear')}
                </Button>
              </div>
              {summaryQuery.isPending ? (
                <div role='status'>
                  <LoadingState />
                </div>
              ) : null}
              {summaryQuery.isError ? (
                <ErrorState onRetry={() => void summaryQuery.refetch()} />
              ) : null}
              {summaryQuery.isSuccess ? (
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                  <Metric
                    label={t('Invited users')}
                    value={String(summary?.invitee_count ?? 0)}
                    icon={<Users />}
                  />
                  <Metric
                    label={t('Consumption amount')}
                    value={formatCommissionAmount(
                      amountValue(summary?.consumption_amount),
                      locale
                    )}
                    icon={<Banknote />}
                  />
                  <Metric
                    label={t('Estimated')}
                    value={formatCommissionAmount(
                      amountValue(summary?.estimated_amount),
                      locale
                    )}
                    icon={<Banknote />}
                  />
                  <Metric
                    label={t('Confirmed')}
                    value={formatCommissionAmount(
                      amountValue(summary?.confirmed_amount),
                      locale
                    )}
                    icon={<Check />}
                  />
                  <Metric
                    label={t('Paid')}
                    value={formatCommissionAmount(
                      amountValue(summary?.paid_amount),
                      locale
                    )}
                    icon={<WalletCards />}
                  />
                  <Metric
                    label={t('Settled')}
                    value={formatCommissionAmount(
                      amountValue(summary?.settled_amount),
                      locale
                    )}
                    icon={<ClipboardList />}
                  />
                  <Metric
                    label={t('Reversals')}
                    value={formatCommissionAmount(
                      amountValue(summary?.reversal_amount),
                      locale
                    )}
                    icon={<X />}
                  />
                </div>
              ) : null}
              <Card className='mt-4'>
                <CardHeader>
                  <CardTitle className='text-base'>
                    {t('Program operations')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='text-muted-foreground grid gap-2 text-sm'>
                  <p>
                    {t(
                      'Commission is calculated from invited user consumption.'
                    )}
                  </p>
                  <p>
                    {t(
                      'Approved settlements are transferred to the partner account balance.'
                    )}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value='applications' className='mt-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>
                    {t('Partner applications')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('User')}</TableHead>
                        <TableHead>{t('Contact email')}</TableHead>
                        <TableHead>{t('Application status')}</TableHead>
                        <TableHead className='min-w-48'>
                          {t('Rejection reason')}
                        </TableHead>
                        <TableHead>{t('Partner status')}</TableHead>
                        <TableHead>{t('Applied')}</TableHead>
                        <TableHead className='text-right'>
                          {t('Actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.items.length ? (
                        applications.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.username || '-'}</TableCell>
                            <TableCell>
                              {item.contact_email ? (
                                <a
                                  className='text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline'
                                  href={`mailto:${item.contact_email}`}
                                >
                                  {item.contact_email}
                                </a>
                              ) : (
                                <span className='text-muted-foreground text-xs'>
                                  -
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusBadgeVariant(item.status)}>
                                {statusLabel(item.status, t)}
                              </Badge>
                            </TableCell>
                            <TableCell className='min-w-48'>
                              {item.status === 'REJECTED' &&
                              item.review_reason ? (
                                <span className='block max-w-56 text-sm break-words whitespace-normal'>
                                  {item.review_reason}
                                </span>
                              ) : (
                                <span className='text-muted-foreground text-xs'>
                                  -
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.partner_status &&
                              item.status === 'APPROVED' ? (
                                <PartnerStatusControl
                                  active={item.partner_status === 'ACTIVE'}
                                  disabled={partnerStatusMutation.isPending}
                                  onChange={(enabled) =>
                                    setPartnerStatusTarget({
                                      userId: item.user_id,
                                      username: item.username || '-',
                                      enabled,
                                    })
                                  }
                                />
                              ) : null}
                              {item.partner_status &&
                              item.status !== 'APPROVED' ? (
                                <Badge
                                  variant={statusBadgeVariant(
                                    item.partner_status
                                  )}
                                >
                                  {statusLabel(item.partner_status, t)}
                                </Badge>
                              ) : null}
                              {!item.partner_status ? (
                                <span className='text-muted-foreground text-xs'>
                                  -
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              {formatTimestamp(
                                item.status === 'PENDING'
                                  ? item.updated_at
                                  : item.created_at,
                                locale
                              )}
                            </TableCell>
                            <TableCell className='text-right'>
                              {item.status === 'PENDING' && (
                                <Button
                                  size='sm'
                                  onClick={() => setReviewTarget(item)}
                                >
                                  <Pencil />
                                  {t('Review')}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className='text-muted-foreground h-24 text-center'
                          >
                            {t('No applications')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Pager
                    page={applicationPage}
                    total={applications.total}
                    onChange={setApplicationPage}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value='referrals' className='mt-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>
                    {t('Referral relations')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>{t('Inviter')}</TableHead>
                        <TableHead>{t('Invitee')}</TableHead>
                        <TableHead>{t('Referral code')}</TableHead>
                        <TableHead>{t('Type')}</TableHead>
                        <TableHead>{t('Status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.items.length ? (
                        referrals.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>
                              {item.inviter_username || '-'}
                            </TableCell>
                            <TableCell>
                              {item.invitee_username || '-'}
                            </TableCell>
                            <TableCell className='font-mono text-xs'>
                              {item.referral_code}
                            </TableCell>
                            <TableCell>
                              {referralTypeLabel(item.referral_type, t)}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checkedChildren={t('On')}
                                unCheckedChildren={t('Off')}
                                checked={item.status === 'active'}
                                disabled={referralMutation.isPending}
                                aria-label={
                                  item.status === 'active'
                                    ? t('Disable referral relation')
                                    : t('Enable referral relation')
                                }
                                onCheckedChange={(enabled) =>
                                  setReferralStatusTarget({
                                    id: item.id,
                                    enabled,
                                  })
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className='text-muted-foreground h-24 text-center'
                          >
                            {t('No referral relations')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Pager
                    page={referralPage}
                    total={referrals.total}
                    onChange={setReferralPage}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value='ledger' className='mt-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>
                    {t('Commission ledger')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                    <div className='grid gap-1.5'>
                      <Label htmlFor='ledger-inviter-filter'>
                        {t('Inviter username')}
                      </Label>
                      <Input
                        id='ledger-inviter-filter'
                        value={ledgerInviter}
                        onChange={(event) => {
                          setLedgerPage(1)
                          setLedgerInviter(event.target.value)
                        }}
                        placeholder={t(
                          'Search by username, name, email, or ID'
                        )}
                      />
                    </div>
                    <div className='grid gap-1.5'>
                      <Label htmlFor='ledger-invitee-filter'>
                        {t('Invitee username')}
                      </Label>
                      <Input
                        id='ledger-invitee-filter'
                        value={ledgerInvitee}
                        onChange={(event) => {
                          setLedgerPage(1)
                          setLedgerInvitee(event.target.value)
                        }}
                        placeholder={t(
                          'Search by username, name, email, or ID'
                        )}
                      />
                    </div>
                    <div className='grid gap-1.5'>
                      <Label htmlFor='ledger-no-filter'>
                        {t('Ledger no.')}
                      </Label>
                      <Input
                        id='ledger-no-filter'
                        value={ledgerNo}
                        onChange={(event) => {
                          setLedgerPage(1)
                          setLedgerNo(event.target.value)
                        }}
                      />
                    </div>
                    <div className='grid gap-1.5'>
                      <Label>{t('Status')}</Label>
                      <Select
                        value={ledgerStatus}
                        onValueChange={(value) => {
                          if (!value) return
                          setLedgerPage(1)
                          setLedgerStatus(value)
                        }}
                      >
                        <SelectTrigger>
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
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('Ledger no.')}</TableHead>
                        <TableHead>{t('Inviter')}</TableHead>
                        <TableHead>{t('Invitee')}</TableHead>
                        <TableHead>{t('Type')}</TableHead>
                        <TableHead>{t('Base')}</TableHead>
                        <TableHead>{t('Commission')}</TableHead>
                        <TableHead>{t('Status')}</TableHead>
                        <TableHead className='text-right'>
                          {t('Actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledger.items.length ? (
                        ledger.items.map((item) => (
                          <TableRow
                            key={item.id}
                            className='cursor-pointer'
                            tabIndex={0}
                            onClick={() => setLedgerDetailTarget(item.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                setLedgerDetailTarget(item.id)
                              }
                            }}
                          >
                            <TableCell className='font-mono text-xs'>
                              {item.ledger_no}
                            </TableCell>
                            <TableCell>
                              {item.inviter_username || '-'}
                            </TableCell>
                            <TableCell>
                              {item.invitee_username || '-'}
                            </TableCell>
                            <TableCell>
                              {commissionEntryLabel(item.entry_type, t)}
                            </TableCell>
                            <TableCell>
                              {formatCommissionAmount(
                                item.commission_base_amount,
                                locale
                              )}
                            </TableCell>
                            <TableCell className='font-medium'>
                              {formatCommissionAmount(
                                item.commission_amount,
                                locale
                              )}
                            </TableCell>
                            <TableCell>
                              <LedgerStatusBadge
                                status={item.status}
                                label={statusLabel(item.status, t)}
                              />
                            </TableCell>
                            <TableCell className='text-right'>
                              <Button
                                size='icon-sm'
                                variant='ghost'
                                aria-label={t('View ledger detail')}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setLedgerDetailTarget(item.id)
                                }}
                              >
                                <Search />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className='text-muted-foreground h-24 text-center'
                          >
                            {t('No ledger entries')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Pager
                    page={ledgerPage}
                    total={ledger.total}
                    onChange={setLedgerPage}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value='settlements' className='mt-4'>
              <Card>
                <CardHeader>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <CardTitle className='text-base'>
                      {t('Settlement workflow')}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('Settlement no.')}</TableHead>
                        <TableHead>{t('User')}</TableHead>
                        <TableHead>{t('Amount')}</TableHead>
                        <TableHead>{t('Status')}</TableHead>
                        <TableHead>{t('Roles')}</TableHead>
                        <TableHead className='text-right'>
                          {t('Actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settlements.items.length ? (
                        settlements.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className='font-mono text-xs'>
                              {item.settlement_no}
                            </TableCell>
                            <TableCell>{item.username || '-'}</TableCell>
                            <TableCell className='font-medium'>
                              {formatCommissionAmount(
                                item.final_amount,
                                locale
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusBadgeVariant(item.status)}>
                                {statusLabel(item.status, t)}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-muted-foreground text-xs'>
                              C:{item.creator_username || '-'} · R:
                              {item.reviewer_username || '-'} · P:
                              {item.payer_username || '-'}
                            </TableCell>
                            <TableCell className='space-x-1 text-right'>
                              {item.status === 'PENDING' ? (
                                <Button
                                  size='sm'
                                  onClick={() =>
                                    setSettlementReviewTarget(item.id)
                                  }
                                >
                                  <Check />
                                  {t('Review')}
                                </Button>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className='text-muted-foreground h-24 text-center'
                          >
                            {t('No settlements')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Pager
                    page={settlementPage}
                    total={settlements.total}
                    onChange={setSettlementPage}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value='settings' className='mt-4'>
              <SettingsPanel />
            </TabsContent>
          </Tabs>
        </SectionPageLayout.Content>
      </SectionPageLayout>
      <ReviewDialog
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null)
        }}
        title={t('Review partner application')}
        application={reviewTarget}
        onSubmit={(approve, reason) => {
          if (reviewTarget !== null) {
            reviewMutation.mutate({ id: reviewTarget.id, approve, reason })
          }
          setReviewTarget(null)
        }}
      />
      <ReviewDialog
        open={settlementReviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSettlementReviewTarget(null)
        }}
        title={t('Review settlement')}
        onSubmit={(approve, reason, paymentMethod) => {
          if (settlementReviewTarget !== null) {
            settlementReviewMutation.mutate({
              id: settlementReviewTarget,
              approve,
              reason,
              paymentMethod,
            })
          }
          setSettlementReviewTarget(null)
        }}
      />
      <ReasonDialog
        open={referralStatusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReferralStatusTarget(null)
        }}
        title={
          referralStatusTarget?.enabled
            ? t('Enable referral relation')
            : t('Disable referral relation')
        }
        onSubmit={(reason) => {
          if (referralStatusTarget) {
            referralMutation.mutate({ ...referralStatusTarget, reason })
          }
          setReferralStatusTarget(null)
        }}
      />
      <ConfirmDialog
        open={partnerStatusTarget !== null}
        className='p-6 [&_[data-slot=alert-dialog-footer]]:-mx-6 [&_[data-slot=alert-dialog-footer]]:-mb-6 [&_[data-slot=alert-dialog-footer]]:p-6'
        onOpenChange={(open) => {
          if (!open && !partnerStatusMutation.isPending) {
            setPartnerStatusTarget(null)
          }
        }}
        title={
          partnerStatusTarget?.enabled
            ? t('Resume partnership?')
            : t('Pause partnership?')
        }
        desc={
          partnerStatusTarget?.enabled
            ? t('Resume the partnership with {{username}}?', {
                username: partnerStatusTarget.username,
              })
            : t(
                'Pause the partnership with {{username}}? Their promotion link will stop earning new commission.',
                { username: partnerStatusTarget?.username ?? '-' }
              )
        }
        confirmText={
          partnerStatusTarget?.enabled
            ? t('Resume partnership')
            : t('Pause partnership')
        }
        destructive={!partnerStatusTarget?.enabled}
        isLoading={partnerStatusMutation.isPending}
        handleConfirm={() => {
          if (partnerStatusTarget) {
            partnerStatusMutation.mutate(partnerStatusTarget)
          }
        }}
      />
      <LedgerDetailDialog
        ledgerId={ledgerDetailTarget}
        onOpenChange={(open) => {
          if (!open) setLedgerDetailTarget(null)
        }}
      />
    </>
  )
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <Card>
      <CardContent className='flex items-start justify-between gap-3 p-4'>
        <div>
          <p className='text-muted-foreground text-sm'>{label}</p>
          <p className='mt-1 text-xl font-semibold tabular-nums'>{value}</p>
        </div>
        <div className='bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg'>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
