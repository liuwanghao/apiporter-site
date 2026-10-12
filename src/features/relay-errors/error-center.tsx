/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useQuery } from '@tanstack/react-query'
import { Eye, RotateCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { fetchRelayErrors, fetchRelayError } from './api'
import { categoryLabel, formatRelayErrorTime, sourceLabel } from './lib'
import type { RelayErrorFilters } from './types'

const PAGE_SIZE = 20

function statusVariant(
  code: number
): 'default' | 'warning' | 'destructive' | 'secondary' {
  if (code >= 500) return 'destructive'
  if (code === 403 || code === 429) return 'warning'
  if (code >= 400) return 'secondary'
  return 'default'
}

export function RelayErrorCenter() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<RelayErrorFilters>({})
  const [draft, setDraft] = useState<RelayErrorFilters>({})
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const query = useQuery({
    queryKey: ['relay-errors', filters, page],
    queryFn: () => fetchRelayErrors(filters, page, PAGE_SIZE),
  })
  const detailQuery = useQuery({
    queryKey: ['relay-error', selectedId],
    queryFn: () => fetchRelayError(selectedId as number),
    enabled: selectedId != null,
  })
  const totalPages = Math.max(
    1,
    Math.ceil((query.data?.total ?? 0) / PAGE_SIZE)
  )

  const setField = (key: keyof RelayErrorFilters, value: string | null) => {
    setDraft((current) => ({ ...current, [key]: value || undefined }))
  }
  const applyFilters = () => {
    setFilters({ ...draft })
    setPage(1)
  }
  const resetFilters = () => {
    setDraft({})
    setFilters({})
    setPage(1)
  }
  const detail = detailQuery.data
  const tableRows = useMemo(() => query.data?.items ?? [], [query.data?.items])

  return (
    <SectionPageLayout fixedContent>
      <SectionPageLayout.Title>
        {t('Error Request Center')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='bg-card flex h-full min-h-0 flex-col overflow-hidden rounded-xl border'>
          <div className='shrink-0 border-b p-4 sm:p-6'>
            <h1 className='text-xl font-semibold'>
              {t('Error Request Center')}
            </h1>
            <p className='text-muted-foreground mt-2 text-sm'>
              {t(
                'Every failed relay request is recorded here with the channel, user, token, model, upstream error, and billing status.'
              )}
            </p>
            <div className='mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
              {(
                [
                  ['request_id', 'Request ID'],
                  ['channel_id', 'Channel ID'],
                  ['channel', 'Channel name'],
                ] as const
              ).map(([key, placeholder]) => (
                <Input
                  key={key}
                  aria-label={t(placeholder)}
                  placeholder={t(placeholder)}
                  value={draft[key] ?? ''}
                  onChange={(event) => setField(key, event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
                />
              ))}
              <Select
                value={draft.status_code ?? ''}
                onValueChange={(value) => setField('status_code', value)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={t('All status codes')} />
                </SelectTrigger>
                <SelectContent>
                  {[400, 401, 402, 403, 404, 408, 429, 500, 502, 503, 504].map(
                    (code) => (
                      <SelectItem key={code} value={String(code)}>
                        {code}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Input
                aria-label={t('Model')}
                placeholder={t('Model')}
                value={draft.model_name ?? ''}
                onChange={(event) => setField('model_name', event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
              />
              <Select
                value={draft.source ?? ''}
                onValueChange={(value) => setField('source', value)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={t('All sources')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='upstream'>
                    {t('Upstream response')}
                  </SelectItem>
                  <SelectItem value='balance_preconsume'>
                    {t('Balance pre-deduction failed')}
                  </SelectItem>
                  <SelectItem value='gateway'>
                    {t('Gateway rejected')}
                  </SelectItem>
                </SelectContent>
              </Select>
              {(
                [
                  ['username', 'Username'],
                  ['user_id', 'User ID'],
                  ['token_name', 'Token name'],
                  ['ip', 'IP'],
                  ['request_path', 'Request path'],
                ] as const
              ).map(([key, placeholder]) => (
                <Input
                  key={key}
                  aria-label={t(placeholder)}
                  placeholder={t(placeholder)}
                  value={draft[key] ?? ''}
                  onChange={(event) => setField(key, event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
                />
              ))}
              <Select
                value={draft.charged ?? ''}
                onValueChange={(value) => setField('charged', value)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={t('Whether charged')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='true'>{t('Charged')}</SelectItem>
                  <SelectItem value='false'>{t('Not charged')}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={draft.refunded ?? ''}
                onValueChange={(value) => setField('refunded', value)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={t('Whether refunded')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='true'>{t('Refunded')}</SelectItem>
                  <SelectItem value='false'>{t('Not refunded')}</SelectItem>
                </SelectContent>
              </Select>
              <div className='flex gap-2 sm:col-span-2'>
                <Button className='flex-1' onClick={applyFilters}>
                  <Search className='size-4' />
                  {t('Search')}
                </Button>
                <Button
                  variant='outline'
                  className='flex-1'
                  onClick={resetFilters}
                >
                  <RotateCcw className='size-4' />
                  {t('Reset')}
                </Button>
              </div>
            </div>
          </div>

          <div className='min-h-0 flex-1 overflow-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    'Time',
                    'Status',
                    'Error source',
                    'Category',
                    'Channel',
                    'Model',
                    'User',
                    'IP',
                    'Billing',
                    'Actions',
                  ].map((title) => (
                    <TableHead key={title}>{t(title)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading
                  ? Array.from({ length: 8 }, (_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 10 }, (_, cell) => (
                          <TableCell key={cell}>
                            <Skeleton className='h-4 w-20' />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : null}
                {!query.isLoading && tableRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className='text-muted-foreground h-40 text-center'
                    >
                      {query.isError
                        ? t('Failed to load')
                        : t('No error requests found')}
                    </TableCell>
                  </TableRow>
                ) : null}
                {tableRows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className='font-mono text-xs'>
                      {formatRelayErrorTime(item.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(item.status_code)}>
                        {item.status_code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.source === 'upstream'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {sourceLabel(t, item.source)}
                      </Badge>
                    </TableCell>
                    <TableCell>{categoryLabel(t, item.category)}</TableCell>
                    <TableCell>
                      {item.channel_name ||
                        (item.channel_id ? `#${item.channel_id}` : '—')}
                    </TableCell>
                    <TableCell className='max-w-44 truncate'>
                      {item.model_name || '—'}
                    </TableCell>
                    <TableCell>
                      {item.username ||
                        (item.user_id ? `#${item.user_id}` : '—')}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {item.client_ip || '—'}
                    </TableCell>
                    <TableCell>
                      {item.charged ? t('Charged') : t('Not charged')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setSelectedId(item.id)}
                      >
                        <Eye className='size-4' />
                        {t('Details')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className='shrink-0 border-t p-3'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text={t('Previous')}
                    href='#'
                    onClick={(event) => {
                      event.preventDefault()
                      setPage((value) => Math.max(1, value - 1))
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    isActive
                    href='#'
                    onClick={(event) => event.preventDefault()}
                  >
                    {page} / {totalPages}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    text={t('Next')}
                    href='#'
                    onClick={(event) => {
                      event.preventDefault()
                      setPage((value) => Math.min(totalPages, value + 1))
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
        <Dialog
          open={selectedId != null}
          onOpenChange={(open) => !open && setSelectedId(null)}
        >
          <DialogContent className='max-h-[min(720px,calc(100vh-2rem))] max-w-xl overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>{t('Error details')}</DialogTitle>
              <DialogDescription>
                {t(
                  'Every failed relay request is recorded here with the channel, user, token, model, upstream error, and billing status.'
                )}
              </DialogDescription>
            </DialogHeader>
            {!detailQuery.isLoading && detail && (
              <>
                <div className='mt-6 grid gap-3 sm:grid-cols-2'>
                  {Object.entries({
                    [t('Request ID')]: detail.request_id,
                    [t('Upstream request ID')]: detail.upstream_request_id,
                    [t('Status code')]: detail.status_code,
                    [t('Source')]: sourceLabel(t, detail.source),
                    [t('Category')]: categoryLabel(t, detail.category),
                    [t('Channel')]: detail.channel_name || detail.channel_id,
                    [t('Model')]: detail.model_name,
                    [t('User')]: detail.username || detail.user_id,
                    [t('IP')]: detail.client_ip,
                    [t('Request path')]: detail.request_path,
                    [t('Charged')]: detail.charged ? t('Yes') : t('No'),
                    [t('Refunded')]: detail.refunded ? t('Yes') : t('No'),
                  }).map(([label, value]) => (
                    <div key={label} className='bg-muted/40 rounded-lg p-3'>
                      <div className='text-muted-foreground text-xs'>
                        {label}
                      </div>
                      <div className='mt-1 font-mono text-sm break-all'>
                        {String(value || '—')}
                      </div>
                    </div>
                  ))}
                </div>
                <div className='mt-4'>
                  <div className='text-muted-foreground text-xs'>
                    {t('Error message')}
                  </div>
                  <pre className='bg-muted/40 mt-2 overflow-auto rounded-lg p-4 text-xs whitespace-pre-wrap'>
                    {detail.error_message || '—'}
                  </pre>
                </div>
              </>
            )}
            {detailQuery.isLoading && <Skeleton className='h-48 w-full' />}
            {detailQuery.isError && (
              <p className='text-destructive text-sm'>{t('Failed to load')}</p>
            )}
          </DialogContent>
        </Dialog>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
