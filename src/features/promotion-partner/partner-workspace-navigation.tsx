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
import { HandCoins, ReceiptText, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'

export function PartnerWorkspaceNavigation() {
  const { t } = useTranslation()

  return (
    <div
      data-partner-workspace-navigation
      className='border-border/80 bg-card/95 min-w-0 rounded-xl border p-1.5 shadow-xs'
    >
      <TabsList className='bg-muted/55 grid h-auto w-full min-w-0 grid-cols-3 gap-1 rounded-lg p-1 group-data-horizontal/tabs:h-auto'>
        <TabsTrigger
          value='invitees'
          className='data-active:bg-background data-active:text-foreground min-h-11 min-w-0 px-2 sm:px-3'
        >
          <UsersRound className='hidden sm:block' aria-hidden='true' />
          <span className='truncate'>{t('Invited users')}</span>
        </TabsTrigger>
        <TabsTrigger
          value='ledger'
          className='data-active:bg-background data-active:text-foreground min-h-11 min-w-0 px-2 sm:px-3'
        >
          <ReceiptText className='hidden sm:block' aria-hidden='true' />
          <span className='truncate'>{t('Income ledger')}</span>
        </TabsTrigger>
        <TabsTrigger
          value='settlements'
          className='data-active:bg-background data-active:text-foreground min-h-11 min-w-0 px-2 sm:px-3'
        >
          <HandCoins className='hidden sm:block' aria-hidden='true' />
          <span className='truncate'>{t('Settlements')}</span>
        </TabsTrigger>
      </TabsList>
    </div>
  )
}
