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

import { formatCurrencyFixed } from '../lib'

interface PaymentSummaryProps {
  topupAmount: number
  displayRate?: number
}

export function PaymentSummary(props: PaymentSummaryProps) {
  const { t } = useTranslation()

  return (
    <section
      data-payment-summary
      aria-label={t('Payment Summary')}
      className='grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4'
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
    </section>
  )
}
