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
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import {
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { getUser } from '@/features/users/api'
import { UserSearchCombobox } from '@/features/users/components/user-search-combobox'
import { requireServerSuccess } from '@/lib/server-error-message'

type KeywordUserWhitelistProps = {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
}

export function KeywordUserWhitelist(props: KeywordUserWhitelistProps) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const ids = useMemo(
    () => [
      ...new Set(
        props.value
          .split('\n')
          .map(Number)
          .filter((id) => Number.isSafeInteger(id) && id > 0)
      ),
    ],
    [props.value]
  )
  const users = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['keyword-whitelist-user', id],
      queryFn: async () => requireServerSuccess(await getUser(id)).data,
      staleTime: 5 * 60 * 1000,
      retry: false,
      meta: { errorToast: false },
    })),
  })
  return (
    <FormItem className='min-w-0'>
      <FormLabel>{t('Keyword filtering user whitelist')}</FormLabel>
      <UserSearchCombobox
        excludedIds={ids}
        onBlur={props.onBlur}
        onSelect={(user) => {
          client.setQueryData(['keyword-whitelist-user', user.id], user)
          props.onChange([...ids, user.id].join('\n'))
        }}
      />
      <div className='max-h-80 min-h-64 overflow-y-auto rounded-lg border'>
        {ids.length === 0 ? (
          <EmptyState
            className='min-h-64'
            title={t('No whitelisted users')}
            description={t(
              'Search and select users to add them to the whitelist.'
            )}
          />
        ) : (
          <ul aria-label={t('Whitelisted users')} className='divide-y'>
            {ids.map((id, index) => {
              const user = users[index].data
              let description = t('User unavailable')
              if (users[index].isPending) description = t('Loading...')
              if (user) {
                description = `${user.display_name || user.username} · #${id}`
              }
              return (
                <li
                  key={id}
                  className='flex min-w-0 items-center gap-3 px-3 py-3'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>
                      {user?.username ?? `#${id}`}
                    </p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {description}
                    </p>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('Remove user {{id}} from whitelist', { id })}
                    onClick={() =>
                      props.onChange(
                        ids.filter((item) => item !== id).join('\n')
                      )
                    }
                  >
                    <Trash2 className='size-4' aria-hidden='true' />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <FormDescription>
        {t('Users in this list skip keyword filtering. Save to apply changes.')}
      </FormDescription>
      <FormMessage />
    </FormItem>
  )
}
