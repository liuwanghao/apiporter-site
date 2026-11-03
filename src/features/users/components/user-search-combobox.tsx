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
import { useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

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
import { FormControl } from '@/components/ui/form'
import { useDebounce } from '@/hooks/use-debounce'
import { requireServerSuccess } from '@/lib/server-error-message'

import { searchUsers } from '../api'
import type { User } from '../types'

type UserSearchComboboxProps = {
  onSelect: (user: User) => void
  onSearchChange?: () => void
  onBlur?: () => void
  excludedIds?: number[]
  disabled?: boolean
}

export function UserSearchCombobox(props: UserSearchComboboxProps) {
  const { t } = useTranslation()
  const searchAnchor = useComboboxAnchor()
  const [search, setSearch] = useState('')
  const keyword = useDebounce(search.trim(), 300)
  const results = useInfiniteQuery({
    queryKey: ['admin-user-search', keyword],
    enabled: !props.disabled && keyword !== '' && search.trim() === keyword,
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
        (user) => !props.excludedIds?.includes(user.id) && !user.DeletedAt
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
    <Combobox<User>
      items={options}
      filter={null}
      value={null}
      inputValue={search}
      disabled={props.disabled}
      onInputValueChange={(value, details) => {
        if (
          details.reason === 'input-change' ||
          details.reason === 'input-clear'
        ) {
          setSearch(value)
          props.onSearchChange?.()
        }
      }}
      itemToStringLabel={(user) => `${user.username} #${user.id}`}
      onValueChange={(user) => {
        if (!user || props.disabled || props.excludedIds?.includes(user.id)) {
          return
        }
        props.onSelect(user)
        setSearch('')
      }}
    >
      <div ref={searchAnchor} className='min-w-0'>
        <FormControl>
          <ComboboxInput
            className='w-full'
            showTrigger={false}
            placeholder={t('Search by username, name, email, or ID')}
            disabled={props.disabled}
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
  )
}
