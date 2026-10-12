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
  ChartNoAxesCombined,
  GitBranch,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import type { DashboardSectionId } from '../section-registry'

const SECTION_ICONS = {
  overview: LayoutDashboard,
  models: ChartNoAxesCombined,
  flow: GitBranch,
  users: Users,
} satisfies Record<DashboardSectionId, typeof ChartNoAxesCombined>

interface DashboardAnalyticsLayoutProps {
  activeSection: DashboardSectionId
  navigationLabel: string
  sections: DashboardSectionId[]
  sectionLabels: Record<DashboardSectionId, string>
  actions?: ReactNode
  children: ReactNode
  onSectionChange: (section: DashboardSectionId) => void
}

export function DashboardAnalyticsLayout(props: DashboardAnalyticsLayoutProps) {
  return (
    <div
      data-slot='dashboard-analytics-layout'
      className='flex min-w-0 flex-col gap-4'
    >
      <div
        data-slot='dashboard-section-bar'
        className='border-border/80 bg-card/90 flex min-w-0 flex-col gap-2 rounded-lg border p-2 shadow-xs lg:flex-row lg:items-center lg:justify-between'
      >
        <nav
          aria-label={props.navigationLabel}
          className='flex min-w-0 gap-1 overflow-x-auto'
        >
          {props.sections.map((section) => {
            const Icon = SECTION_ICONS[section] ?? ChartNoAxesCombined
            const isActive = section === props.activeSection

            return (
              <button
                key={section}
                type='button'
                data-slot='dashboard-section-link'
                data-state={isActive ? 'active' : 'inactive'}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => props.onSectionChange(section)}
                className={cn(
                  'focus-visible:ring-ring group flex min-h-11 min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none',
                  isActive
                    ? 'bg-muted text-foreground ring-border/80 shadow-2xs ring-1'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-md transition-colors motion-reduce:transition-none',
                    isActive
                      ? 'bg-background text-foreground ring-border/70 shadow-2xs ring-1'
                      : 'bg-muted/70 group-hover:bg-muted'
                  )}
                >
                  <Icon className='size-4' aria-hidden='true' />
                </span>
                <span className='truncate'>{props.sectionLabels[section]}</span>
              </button>
            )
          })}
        </nav>

        {props.actions != null && (
          <div
            data-slot='dashboard-section-actions'
            className='border-border/70 flex shrink-0 items-center justify-end gap-1.5 border-t px-1 pt-2 lg:border-t-0 lg:border-l lg:py-1 lg:pt-1 lg:pl-3'
          >
            {props.actions}
          </div>
        )}
      </div>

      <div
        data-slot='dashboard-analytics-content'
        className='min-w-0 space-y-4'
      >
        {props.children}
      </div>
    </div>
  )
}
