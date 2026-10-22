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
import { Link } from '@tanstack/react-router'
import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'

import type { UserProfile } from '../types'

export function ProfileSecurityCard(props: {
  profile: UserProfile | null
  loading: boolean
}) {
  const { t } = useTranslation()
  if (!props.loading && !props.profile) return null
  return (
    <TitledCard
      title={t('Security')}
      description={t('Manage your security settings and account access')}
      icon={<Shield className='size-4' />}
      iconTone='success'
      disableHoverEffect
    >
      {props.loading ? (
        <Skeleton className='h-9 w-full' />
      ) : (
        <Button
          variant='outline'
          className='w-full'
          render={<Link to='/security' />}
        >
          {t('Security & Access')}
        </Button>
      )}
    </TitledCard>
  )
}
