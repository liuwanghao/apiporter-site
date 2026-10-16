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
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'

import { formatCurrencyFixed } from '../lib'

interface PaymentSummaryProps {
  topupAmount: number
  paymentAmount: number
  displayRate?: number
  calculating: boolean
}

export function PaymentSummary(props: PaymentSummaryProps) {
  const { t } = useTranslation()
  const subtotal = `${formatCurrencyFixed(props.paymentAmount)} CNY`

  return (
    <section
      data-payment-summary
      aria-label={t('Payment Summary')}
      className='grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4'
    >
      <div className='bg-muted/45 min-w-0 rounded-xl p-3 sm:p-4'>
        <p className='text-muted-foreground text-xs font-medium'>
          {t('Recharge Amount')}
        </p>
        <p className='mt-2 text-sm font-semibold tabular-nums sm:text-base'>
          {formatCurrencyFixed(props.topupAmount * (props.displayRate ?? 1))}{' '}
          CNY
        </p>
      </div>
      <div className='bg-muted/45 min-w-0 rounded-xl p-3 sm:p-4'>
        <p className='text-muted-foreground text-xs font-medium'>
          {t('Subtotal')}
        </p>
        {props.calculating ? (
          <Skeleton className='mt-2 h-6 w-24' />
        ) : (
          <p className='mt-2 text-sm font-semibold tabular-nums sm:text-base'>
            {subtotal}
          </p>
        )}
      </div>
      <div className='bg-muted/45 min-w-0 rounded-xl p-3 sm:p-4'>
        <p className='text-muted-foreground text-xs font-medium'>{t('Tax')}</p>
        <p className='mt-2 text-sm font-semibold sm:text-base'>
          {t('Subject to payment page')}
        </p>
      </div>
      <div className='bg-muted/45 min-w-0 rounded-xl p-3 sm:p-4'>
        <p className='text-muted-foreground text-xs font-medium'>
          {t('Estimated Payment')}
        </p>
        {props.calculating ? (
          <Skeleton className='mt-2 h-6 w-28' />
        ) : (
          <p className='mt-2 text-sm font-semibold tabular-nums sm:text-base'>
            {t('Starting at {{amount}}', { amount: subtotal })}
          </p>
        )}
      </div>
    </section>
  )
}
