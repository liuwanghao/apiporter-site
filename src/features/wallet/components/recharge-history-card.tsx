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
import { ChevronLeft, ChevronRight, History, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { StatusBadge } from '@/components/status-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TitledCard } from '@/components/ui/titled-card'
import { formatCurrencyFromUSD } from '@/lib/currency'
import { formatNumber } from '@/lib/format'

import { useBillingHistory } from '../hooks/use-billing-history'
import {
  formatTimestamp,
  getPaymentMethodName,
  getStatusConfig,
} from '../lib/billing'

export function RechargeHistoryCard() {
  const { t } = useTranslation()
  const {
    records,
    total,
    page,
    pageSize,
    keyword,
    loading,
    completing,
    isAdmin,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleCompleteOrder,
  } = useBillingHistory()
  const [confirmTradeNo, setConfirmTradeNo] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  let historyContent: ReactNode

  const handleConfirmComplete = async () => {
    if (!confirmTradeNo) return

    const success = await handleCompleteOrder(confirmTradeNo)
    if (success) {
      setConfirmTradeNo(null)
    }
  }

  if (loading) {
    historyContent = (
      <>
        {['first', 'second', 'third'].map((key) => (
          <TableRow key={key} aria-label={t('Loading...')}>
            <TableCell className='px-5 py-3'>
              <Skeleton className='h-4 w-48' />
            </TableCell>
            {['time', 'user', 'method', 'amount', 'payment', 'status'].map(
              (field) => (
                <TableCell key={field} className='py-3'>
                  <Skeleton className='h-4 w-20' />
                </TableCell>
              )
            )}
          </TableRow>
        ))}
      </>
    )
  } else if (records.length === 0) {
    historyContent = (
      <TableRow className='hover:bg-transparent'>
        <TableCell colSpan={7} className='h-40 text-center'>
          <p className='text-muted-foreground text-sm font-medium'>
            {t('No billing records found')}
          </p>
          <p className='text-muted-foreground mt-1 text-xs'>
            {keyword
              ? t('Try adjusting your search')
              : t('Your transaction history will appear here')}
          </p>
        </TableCell>
      </TableRow>
    )
  } else {
    historyContent = (
      <>
        {records.map((record) => {
          const status = getStatusConfig(record.status)
          const userId = String(record.user_id)

          return (
            <TableRow key={record.id}>
              <TableCell className='px-5 py-3'>
                <div className='flex min-w-0 items-center gap-1'>
                  <code className='max-w-52 truncate font-mono text-sm font-medium'>
                    {record.trade_no}
                  </code>
                  <CopyButton
                    value={record.trade_no}
                    className='h-9 w-9 shrink-0'
                    iconClassName='size-3.5'
                    tooltip={t('Copy to clipboard')}
                    aria-label={t('Copy to clipboard')}
                  />
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground py-3'>
                {formatTimestamp(record.create_time)}
              </TableCell>
              <TableCell className='py-3 font-medium'>{userId}</TableCell>
              <TableCell className='py-3 font-medium'>
                {getPaymentMethodName(record.payment_method, t)}
              </TableCell>
              <TableCell className='py-3 text-right font-semibold'>
                {formatCurrencyFromUSD(record.amount, {
                  digitsLarge: 2,
                  digitsSmall: 2,
                  abbreviate: false,
                })}
              </TableCell>
              <TableCell className='py-3 text-right font-semibold'>
                {formatNumber(record.money)}
              </TableCell>
              <TableCell className='py-3 pr-5'>
                <div className='flex items-center justify-end gap-2'>
                  <StatusBadge
                    label={t(status.label)}
                    variant={status.variant}
                    showDot
                    copyable={false}
                  />
                  {isAdmin && record.status === 'pending' ? (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setConfirmTradeNo(record.trade_no)}
                      disabled={completing}
                    >
                      {t('Complete Order')}
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </>
    )
  }

  return (
    <>
      <TitledCard
        title={t('Recharge History')}
        description={t(
          'View your topup transaction records and payment history'
        )}
        icon={<History className='size-4' aria-hidden='true' />}
        iconTone='info'
        disableHoverEffect
        contentClassName='p-0 sm:p-0'
      >
        <div data-recharge-history>
          <div className='flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center sm:p-4'>
            <div className='relative flex-1'>
              <Search
                className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
                aria-hidden='true'
              />
              <Input
                value={keyword}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder={t('Search by order number...')}
                aria-label={t('Search')}
                className='h-10 pl-9'
              />
            </div>
            <Select
              items={[
                { value: '10', label: t('10 / page') },
                { value: '20', label: t('20 / page') },
                { value: '50', label: t('50 / page') },
                { value: '100', label: t('100 / page') },
              ]}
              value={pageSize.toString()}
              onValueChange={(value) =>
                value !== null && handlePageSizeChange(Number.parseInt(value))
              }
            >
              <SelectTrigger className='h-10 w-full sm:w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {['10', '20', '50', '100'].map((size) => (
                    <SelectItem key={size} value={size}>
                      {t(`${size} / page`)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Table className='min-w-[1040px]'>
            <TableHeader className='bg-muted/35'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-[260px] px-5'>
                  {t('Order Number')}
                </TableHead>
                <TableHead className='w-[170px]'>{t('Time')}</TableHead>
                <TableHead className='w-[90px]'>{t('User ID')}</TableHead>
                <TableHead className='w-[130px]'>
                  {t('Payment Method')}
                </TableHead>
                <TableHead className='w-[130px] text-right'>
                  {t('Amount')}
                </TableHead>
                <TableHead className='w-[110px] text-right'>
                  {t('Payment')}
                </TableHead>
                <TableHead className='w-[170px] pr-5 text-right'>
                  {t('Status')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{historyContent}</TableBody>
          </Table>

          {!loading && records.length > 0 ? (
            <div className='flex flex-col items-center gap-3 border-t p-3 sm:flex-row sm:justify-between sm:p-4'>
              <p className='text-muted-foreground text-xs sm:text-sm'>
                {t('Showing')} {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, total)} {t('of')} {total}
              </p>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className='h-9 w-9 p-0'
                  aria-label={t('Previous')}
                >
                  <ChevronLeft className='size-4' aria-hidden='true' />
                </Button>
                <span className='text-muted-foreground min-w-14 text-center text-sm tabular-nums'>
                  <span className='text-foreground font-medium'>{page}</span> /{' '}
                  {totalPages}
                </span>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className='h-9 w-9 p-0'
                  aria-label={t('Next')}
                >
                  <ChevronRight className='size-4' aria-hidden='true' />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </TitledCard>

      <AlertDialog
        open={!!confirmTradeNo}
        onOpenChange={(open) => !open && setConfirmTradeNo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Complete Order')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'Are you sure you want to manually complete this order? The user will be credited with the corresponding quota.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>
              {t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmComplete}
              disabled={completing}
            >
              {completing ? t('Processing...') : t('Confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
