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
import { Activity, BarChart3, WalletCards } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuota } from '@/lib/format'

import type { UserWalletData } from '../types'

interface WalletStatsCardProps {
  user: UserWalletData | null
  loading?: boolean
}

export function WalletStatsCard(props: WalletStatsCardProps) {
  const { t } = useTranslation()
  if (props.loading) {
    return (
      <div
        data-wallet-stats-layout
        className='grid min-w-0 gap-3 sm:grid-cols-3'
      >
        {['balance', 'usage', 'requests'].map((key) => (
          <div
            key={key}
            data-wallet-stat
            className='bg-card ring-foreground/10 rounded-xl p-4 ring-1 sm:p-5'
          >
            <Skeleton className='h-4 w-24' />
            <Skeleton className='mt-4 h-8 w-32' />
            <Skeleton className='mt-3 h-4 w-28' />
          </div>
        ))}
      </div>
    )
  }

  const stats: {
    label: string
    value: string
    description: string
    icon: typeof WalletCards
    tone: IconBadgeTone
  }[] = [
    {
      label: t('Current Balance'),
      value: formatQuota(props.user?.quota ?? 0),
      description: t('Remaining quota'),
      icon: WalletCards,
      tone: 'success',
    },
    {
      label: t('Total Usage'),
      value: formatQuota(props.user?.used_quota ?? 0),
      description: t('Total consumed quota'),
      icon: BarChart3,
      tone: 'info',
    },
    {
      label: t('API Requests'),
      value: (props.user?.request_count ?? 0).toLocaleString(),
      description: t('Total requests made'),
      icon: Activity,
      tone: 'chart-4',
    },
  ]
  return (
    <div data-wallet-stats-layout className='grid min-w-0 gap-3 sm:grid-cols-3'>
      {stats.map((item) => (
        <div
          key={item.label}
          data-wallet-stat
          className='bg-card ring-foreground/10 flex min-w-0 flex-col justify-between rounded-xl p-4 ring-1 sm:p-5'
        >
          <div className='flex items-center gap-2.5'>
            <IconBadge tone={item.tone} size='stat'>
              <item.icon />
            </IconBadge>
            <div className='text-muted-foreground truncate text-xs font-medium tracking-wider uppercase'>
              {item.label}
            </div>
          </div>
          <div className='mt-4 min-w-0'>
            <div className='text-foreground font-mono text-2xl font-bold tracking-tight break-words tabular-nums sm:text-3xl'>
              {item.value}
            </div>
            <div className='text-muted-foreground mt-1.5 text-sm'>
              {item.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
