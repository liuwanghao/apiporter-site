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
import { Activity, RotateCw } from 'lucide-react'
import { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { IconBadge } from '@/components/ui/icon-badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getUptimeStatus } from '@/features/dashboard/api'
import type {
  UptimeGroupResult,
  UptimeMonitor,
} from '@/features/dashboard/types'
import { cn } from '@/lib/utils'

import { PanelWrapper } from '../ui/panel-wrapper'

const STATUS_COLOR_MAP: Record<number, string> = {
  1: 'bg-emerald-500 shadow-emerald-500/50',
  0: 'bg-rose-500 shadow-rose-500/50',
  2: 'bg-amber-500 shadow-amber-500/50',
  3: 'bg-blue-500 shadow-blue-500/50',
}
const DEFAULT_STATUS_COLOR = 'bg-muted-foreground/40'

const StatusDot = memo(function StatusDot(props: { status: number }) {
  const color = STATUS_COLOR_MAP[props.status] ?? DEFAULT_STATUS_COLOR
  return (
    <span
      className={cn('inline-block size-2 rounded-full shadow-xs', color)}
      aria-hidden='true'
    />
  )
})

export function UptimePanel() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState<UptimeGroupResult[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const refreshAbortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const abortController = new AbortController()

    void getUptimeStatus()
      .then((res) => {
        if (abortController.signal.aborted) return
        setGroups(res?.data || [])
      })
      .catch(() => {
        if (abortController.signal.aborted) return
        setGroups([])
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      abortController.abort()
      refreshAbortControllerRef.current?.abort()
    }
  }, [])

  const handleRefresh = () => {
    refreshAbortControllerRef.current?.abort()
    const abortController = new AbortController()
    refreshAbortControllerRef.current = abortController
    setRefreshing(true)

    void getUptimeStatus()
      .then((res) => {
        if (abortController.signal.aborted) return
        setGroups(res?.data || [])
      })
      .catch(() => {
        if (abortController.signal.aborted) return
        setGroups([])
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setRefreshing(false)
        }
        if (refreshAbortControllerRef.current === abortController) {
          refreshAbortControllerRef.current = null
        }
      })
  }

  return (
    <PanelWrapper
      title={
        <span className='flex items-center gap-2'>
          <IconBadge tone='success' size='sm'>
            <Activity />
          </IconBadge>
          {t('Uptime')}
        </span>
      }
      description={t('Grouped monitor status from Uptime Kuma')}
      loading={loading}
      empty={!groups.length}
      emptyMessage={t('No uptime monitoring configured')}
      height='h-80'
      contentClassName='p-3 sm:p-4'
      headerActions={
        <Button
          variant='ghost'
          size='sm'
          onClick={handleRefresh}
          disabled={refreshing}
          className='hover:bg-muted/80 size-8 rounded-md p-0'
          aria-label={t('Refresh')}
        >
          <RotateCw
            className={cn('size-3.5', refreshing && 'animate-spin')}
            aria-hidden='true'
          />
        </Button>
      }
    >
      <ScrollArea className='h-80 pr-1'>
        <div className='flex flex-col gap-3'>
          {groups.map((group) => (
            <div key={group.categoryName} className='flex flex-col gap-1.5'>
              <div className='text-muted-foreground flex items-center justify-between px-1 text-xs font-semibold tracking-wider uppercase'>
                <span>{group.categoryName}</span>
                <span className='font-mono text-[10px] opacity-70'>
                  {group.monitors?.length || 0} {t('nodes')}
                </span>
              </div>

              <div className='flex flex-col gap-1.5'>
                {group.monitors?.map((monitor: UptimeMonitor) => (
                  <div
                    key={monitor.name}
                    className='border-border/50 bg-background/50 hover:bg-muted/40 flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs transition-colors'
                  >
                    <div className='flex min-w-0 items-center gap-2.5'>
                      <StatusDot status={monitor.status} />
                      <span className='text-foreground truncate font-medium'>
                        {monitor.name}
                      </span>
                      {monitor.group && (
                        <span className='text-muted-foreground/60 truncate text-[10px]'>
                          ({monitor.group})
                        </span>
                      )}
                    </div>
                    <span className='text-foreground font-mono font-bold'>
                      {((monitor.uptime ?? 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </PanelWrapper>
  )
}
