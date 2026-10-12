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
import { Megaphone, ArrowUpRight } from 'lucide-react'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IconBadge } from '@/components/ui/icon-badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAnnouncements } from '@/features/dashboard/hooks/use-status-data'
import { getPreviewText } from '@/features/dashboard/lib'
import type { AnnouncementItem } from '@/features/dashboard/types'
import { getAnnouncementColorClass } from '@/lib/colors'
import { formatDateTimeObject } from '@/lib/time'
import { cn } from '@/lib/utils'

import { PanelWrapper } from '../ui/panel-wrapper'
import { AnnouncementDetailModal } from './announcement-detail-dialog'

const AnnouncementStatusDot = memo(function AnnouncementStatusDot(props: {
  type?: string
}) {
  return (
    <span
      className={cn(
        'mt-1.5 inline-block size-2 shrink-0 rounded-full ring-2 ring-background',
        getAnnouncementColorClass(props.type)
      )}
    />
  )
})

export function AnnouncementsPanel() {
  const { t } = useTranslation()
  const { items: list, loading } = useAnnouncements()
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAnnouncementClick = (item: AnnouncementItem) => {
    setSelectedAnnouncement(item)
    setIsDialogOpen(true)
  }

  return (
    <PanelWrapper
      title={
        <span className='flex items-center gap-2'>
          <IconBadge tone='warning' size='sm'>
            <Megaphone />
          </IconBadge>
          {t('Announcements')}
        </span>
      }
      description={t('Latest platform updates and notices')}
      loading={loading}
      empty={!list.length}
      emptyMessage={t('No announcements at this time')}
      height='h-full'
      className='flex h-[26rem] flex-col'
      contentClassName='min-h-0 flex-1 overflow-hidden p-3 sm:p-4'
    >
      <ScrollArea className='h-full pr-1'>
        <div className='flex flex-col gap-2.5'>
          {list.map((item: AnnouncementItem, idx: number) => {
            const key = item.id ?? `announcement-${idx}`
            return (
              <button
                key={key}
                type='button'
                onClick={() => handleAnnouncementClick(item)}
                className='group border-border/50 bg-background/50 hover:border-primary/30 hover:bg-muted/40 relative flex flex-col gap-1.5 rounded-md border p-3.5 text-left transition-all duration-200 hover:shadow-2xs'
              >
                <div className='flex items-start gap-2.5'>
                  <AnnouncementStatusDot type={item.type} />
                  <div className='flex min-w-0 flex-1 flex-col gap-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='text-foreground group-hover:text-primary truncate text-sm font-semibold transition-colors'>
                        {getPreviewText(item.content)}
                      </p>
                      <ArrowUpRight className='text-muted-foreground/40 group-hover:text-primary size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100' />
                    </div>
                    {item.publishDate && (
                      <time className='text-muted-foreground/70 font-mono text-[11px]'>
                        {formatDateTimeObject(new Date(item.publishDate))}
                      </time>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>

      <AnnouncementDetailModal
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        announcement={selectedAnnouncement}
      />
    </PanelWrapper>
  )
}
