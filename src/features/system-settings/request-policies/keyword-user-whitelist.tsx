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
import {
  useInfiniteQuery,
  useQueries,
  useQueryClient,
} from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { LoadingState } from '@/components/loading-state'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { getUser, searchUsers } from '@/features/users/api'
import type { User } from '@/features/users/types'
import { useDebounce } from '@/hooks/use-debounce'
import { requireServerSuccess } from '@/lib/server-error-message'

type KeywordUserWhitelistProps = {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
}

export function KeywordUserWhitelist(props: KeywordUserWhitelistProps) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const searchAnchor = useComboboxAnchor()
  const [search, setSearch] = useState('')
  const keyword = useDebounce(search.trim(), 300)
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
  const results = useInfiniteQuery({
    queryKey: ['keyword-whitelist-search', keyword],
    enabled: keyword !== '' && search.trim() === keyword,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      requireServerSuccess(
        await searchUsers({ keyword, p: pageParam, page_size: 20 })
      ).data,
    getNextPageParam: (lastPage, _pages, page) =>
      lastPage && page * 20 < lastPage.total ? page + 1 : undefined,
    retry: false,
    meta: { errorToast: false },
  })
  const isCurrentSearch = search.trim() === keyword && keyword !== ''
  const options = isCurrentSearch
    ? (results.data?.pages.flatMap((page) => page?.items ?? []) ?? []).filter(
        (user) => !ids.includes(user.id) && !user.DeletedAt
      )
    : []
  const isSearching =
    search.trim() !== '' && (!isCurrentSearch || results.isPending)
  let searchStatus = (
    <ComboboxEmpty>
      {search.trim() ? t('No matching users') : t('Search for a user to add')}
    </ComboboxEmpty>
  )
  if (isSearching) {
    searchStatus = (
      <LoadingState
        className='min-h-0 py-4'
        message={t('Searching users...')}
        size='sm'
      />
    )
  } else if (isCurrentSearch && results.isError) {
    searchStatus = (
      <ErrorState
        className='min-h-0 py-4'
        title={t('Failed to search users')}
        onRetry={() => void results.refetch()}
      />
    )
  }

  return (
    <FormItem className='min-w-0'>
      <FormLabel>{t('Keyword filtering user whitelist')}</FormLabel>
      <Combobox<User>
        items={options}
        filter={null}
        value={null}
        inputValue={search}
        onInputValueChange={(value, details) => {
          if (
            details.reason === 'input-change' ||
            details.reason === 'input-clear'
          ) {
            setSearch(value)
          }
        }}
        itemToStringLabel={(user) => `${user.username} #${user.id}`}
        onValueChange={(user) => {
          if (!user || ids.includes(user.id)) return
          client.setQueryData(['keyword-whitelist-user', user.id], user)
          props.onChange([...ids, user.id].join('\n'))
          setSearch('')
        }}
      >
        <div ref={searchAnchor} className='min-w-0'>
          <FormControl>
            <ComboboxInput
              className='w-full'
              showTrigger={false}
              placeholder={t('Search by username, name, email, or ID')}
              onBlur={props.onBlur}
            />
          </FormControl>
        </div>
        <ComboboxContent
          anchor={searchAnchor}
          className='w-[min(var(--anchor-width),24rem)] min-w-0 data-[chips=true]:min-w-0'
        >
          {searchStatus}
          <ComboboxList>
            {(user: User) => (
              <ComboboxItem key={user.id} value={user}>
                <span className='min-w-0'>
                  <span className='block truncate'>
                    {user.username} · #{user.id}
                  </span>
                  <span className='text-muted-foreground block truncate text-xs'>
                    {user.display_name || user.email}
                  </span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
          {isCurrentSearch && results.hasNextPage && !results.isError && (
            <Button
              type='button'
              variant='ghost'
              className='w-full'
              disabled={results.isFetchingNextPage}
              onClick={() => void results.fetchNextPage()}
            >
              {results.isFetchingNextPage ? t('Loading...') : t('Load more')}
            </Button>
          )}
        </ComboboxContent>
      </Combobox>
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
