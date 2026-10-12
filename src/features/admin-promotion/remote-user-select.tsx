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
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { searchUsers } from '@/features/users/api'
import type { User } from '@/features/users/types'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'

type RemoteUserSelectProps = {
  value: User | null
  onValueChange: (user: User | null) => void
  disabled?: boolean
}

export function RemoteUserSelect({
  value,
  onValueChange,
  disabled,
}: RemoteUserSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim(), 500)
  const usersQuery = useQuery({
    queryKey: ['admin-promotion', 'user-search', debouncedSearch],
    queryFn: () =>
      searchUsers({ keyword: debouncedSearch, p: 1, page_size: 10 }),
    enabled: open && debouncedSearch.length > 0,
  })
  const users = usersQuery.data?.data?.items ?? []

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch)
    if (value) onValueChange(null)
  }

  const handleSelect = (user: User) => {
    onValueChange(user)
    setSearch('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            role='combobox'
            aria-expanded={open}
            disabled={disabled}
            className='w-full justify-between font-normal'
          />
        }
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          {value ? `${value.username} (#${value.id})` : t('Select a user')}
        </span>
        <ChevronsUpDown className='size-4 shrink-0 opacity-50' />
      </PopoverTrigger>
      <PopoverContent className='w-[var(--anchor-width)] p-0'>
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={handleSearchChange}
            placeholder={t('Search by username, name, email, or ID')}
          />
          <CommandList>
            {usersQuery.isFetching ? (
              <div className='text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm'>
                <Loader2 className='size-4 animate-spin' />
                {t('Loading')}
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {debouncedSearch ? t('No users found') : t('Search users')}
                </CommandEmpty>
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={String(user.id)}
                      onSelect={() => handleSelect(user)}
                    >
                      <Check
                        className={cn(
                          'size-4',
                          value?.id === user.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate font-medium'>
                          {user.username}
                        </span>
                        <span className='text-muted-foreground block truncate text-xs'>
                          {[user.display_name, user.email, `#${user.id}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
