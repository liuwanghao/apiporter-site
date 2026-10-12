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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPageNumbers } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export function ListPager({
  page,
  total,
  pageSize = 10,
  onChange,
  onPageSizeChange,
}: {
  page: number
  total: number
  pageSize?: number
  onChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}) {
  const { t } = useTranslation()
  const resolvedPageSize = pageSize ?? 10
  const pages = Math.max(1, Math.ceil(total / resolvedPageSize))
  const [pageInput, setPageInput] = useState(String(page))
  useEffect(() => setPageInput(String(page)), [page])
  const goToPage = () => {
    const nextPage = Number.parseInt(pageInput, 10)
    if (!Number.isFinite(nextPage)) {
      setPageInput(String(page))
      return
    }
    onChange(Math.min(pages, Math.max(1, nextPage)))
  }
  const pageNumbers = getPageNumbers(page, pages)
  let ellipsisCount = 0
  const pageItems = pageNumbers.map((value) => {
    if (typeof value === 'string') {
      ellipsisCount += 1
      return {
        kind: 'ellipsis' as const,
        key: `ellipsis-${ellipsisCount}`,
      }
    }
    return { kind: 'page' as const, key: `page-${value}`, value }
  })

  return (
    <nav
      className='flex flex-wrap items-center justify-between gap-2 pt-3'
      aria-label={t('Page')}
    >
      <div className='flex items-center gap-2 text-xs font-medium whitespace-nowrap sm:text-sm'>
        <span className='text-muted-foreground/80'>{t('Total:')}</span>
        <span className='text-foreground tabular-nums'>
          {total.toLocaleString()}
        </span>
        {onPageSizeChange ? (
          <div className='flex items-center gap-1.5'>
            <span className='text-muted-foreground/80 hidden sm:inline'>
              {t('Rows per page')}
            </span>
            <Select
              value={String(resolvedPageSize)}
              onValueChange={(value) => {
                if (value) onPageSizeChange(Number(value))
              }}
            >
              <SelectTrigger className='h-8 w-[68px] tabular-nums'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side='top'>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      <div className='flex flex-wrap items-center justify-end gap-1'>
        <Button
          size='icon-sm'
          variant='outline'
          className='hidden sm:inline-flex'
          disabled={page <= 1}
          onClick={() => onChange(1)}
          aria-label={t('Go to first page')}
          title={t('Go to first page')}
        >
          <ChevronsLeft />
        </Button>
        <Button
          size='icon-sm'
          variant='outline'
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label={t('Previous page')}
          title={t('Previous page')}
        >
          <ChevronLeft />
        </Button>
        {pageItems.map((item) =>
          item.kind === 'ellipsis' ? (
            <span
              key={item.key}
              className='text-muted-foreground/60 px-1 text-sm'
            >
              ...
            </span>
          ) : (
            <Button
              key={item.key}
              size='icon-sm'
              variant={page === item.value ? 'default' : 'outline'}
              className='tabular-nums'
              onClick={() => onChange(item.value)}
              aria-current={page === item.value ? 'page' : undefined}
              aria-label={t('Go to page {{page}}', { page: item.value })}
            >
              {item.value}
            </Button>
          )
        )}
        <Button
          size='icon-sm'
          variant='outline'
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          aria-label={t('Next page')}
          title={t('Next page')}
        >
          <ChevronRight />
        </Button>
        <Button
          size='icon-sm'
          variant='outline'
          className='hidden sm:inline-flex'
          disabled={page >= pages}
          onClick={() => onChange(pages)}
          aria-label={t('Go to last page')}
          title={t('Go to last page')}
        >
          <ChevronsRight />
        </Button>
        <div className='ml-1 flex items-center gap-1.5'>
          <span className='text-muted-foreground hidden text-xs sm:inline'>
            {t('Page')}
          </span>
          <Input
            aria-label={t('Go to page {{page}}', { page: pageInput || page })}
            inputMode='numeric'
            className='h-8 w-14 px-2 text-center tabular-nums'
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                goToPage()
              }
            }}
            onBlur={goToPage}
          />
          <span className='text-muted-foreground text-xs tabular-nums'>
            / {pages}
          </span>
        </div>
      </div>
    </nav>
  )
}
