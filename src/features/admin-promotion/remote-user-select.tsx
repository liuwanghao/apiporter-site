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
import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/error-state'
import { LoadingState } from '@/components/loading-state'
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
import type { User } from '@/features/users/types'
import { cn } from '@/lib/utils'

import { getPromotionUsers } from './api'

type RemoteUserSelectProps = {
  value: User | null
  onValueChange: (user: User | null) => void
  disabled?: boolean
  id?: string
  placeholder?: string
}

export function RemoteUserSelect({
  value,
  onValueChange,
  disabled,
  id,
  placeholder,
}: RemoteUserSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const usersQuery = useQuery({
    queryKey: ['admin-promotion', 'users'],
    queryFn: getPromotionUsers,
    enabled: open,
    staleTime: 60_000,
  })
  const users = usersQuery.data ?? []

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
            id={id}
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
          {value
            ? `${value.username} (#${value.id})`
            : (placeholder ?? t('Select a user'))}
        </span>
        <ChevronsUpDown className='size-4 shrink-0 opacity-50' />
      </PopoverTrigger>
      <PopoverContent className='w-[var(--anchor-width)] p-0'>
        <Command
          filter={(value, search, keywords) => {
            const term = search.trim().toLowerCase()
            return [value, ...(keywords ?? [])].some((field) =>
              field.toLowerCase().includes(term)
            )
              ? 1
              : 0
          }}
        >
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={t('Search by username, name, email, or ID')}
          />
          <CommandList>
            {usersQuery.isPending ? (
              <LoadingState
                size='sm'
                className='min-h-0 py-6'
                message={t('Loading')}
              />
            ) : null}
            {usersQuery.isError ? (
              <ErrorState
                className='min-h-0 py-4'
                onRetry={() => void usersQuery.refetch()}
              />
            ) : null}
            {usersQuery.isSuccess ? (
              <>
                <CommandEmpty>{t('No users found')}</CommandEmpty>
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={String(user.id)}
                      keywords={[
                        user.username,
                        user.display_name,
                        user.email ?? '',
                      ]}
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
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
