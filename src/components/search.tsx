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
import { useNavigate } from '@tanstack/react-router'
import { SearchIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useSearch } from '@/context/search-context'
import { cn } from '@/lib/utils'

import { Button } from './ui/button'

type SearchProps = {
  className?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}

export function Search({ className = '', placeholder }: SearchProps) {
  const { t } = useTranslation()
  const search = useSearch()
  const navigate = useNavigate()
  const resolvedPlaceholder = placeholder ?? t('Search')

  const handleSearchClick = () => {
    if (search?.setOpen) {
      search.setOpen(true)
    } else {
      navigate({ to: '/pricing' })
    }
  }

  return (
    <Button
      variant='outline'
      className={cn(
        'bg-muted/30 text-muted-foreground hover:bg-accent hover:text-foreground relative h-8 w-full flex-1 justify-start rounded-lg text-sm font-normal shadow-none transition-colors sm:w-36 sm:pe-10 md:flex-none lg:w-48 xl:w-56',
        className
      )}
      onClick={handleSearchClick}
      aria-label={resolvedPlaceholder}
    >
      <SearchIcon
        aria-hidden='true'
        className='text-muted-foreground/70 absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2'
      />
      <span className='text-muted-foreground/80 ms-5 text-xs'>
        {resolvedPlaceholder}
      </span>
      <kbd className='bg-muted/80 text-muted-foreground border-border/60 pointer-events-none absolute end-1.5 top-1.5 hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium select-none sm:flex'>
        <span className='text-[10px]'>⌘</span>
        {t('K')}
      </kbd>
    </Button>
  )
}
