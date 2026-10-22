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
import { useLocation, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Laptop, Moon, Sun } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useSearch } from '@/context/search-context'
import { useTheme } from '@/context/theme-provider'
import { useSidebarView } from '@/hooks/use-sidebar-view'

export function CommandMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { setTheme } = useTheme()
  const search = useSearch()
  const open = search?.open ?? false

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      search?.setOpen?.(nextOpen)
    },
    [search]
  )

  const { navGroups } = useSidebarView()

  const runCommand = useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  const navigationItems = useMemo(
    () =>
      navGroups
        .flatMap((group) =>
          group.items.flatMap((item) => {
            if (item.url) {
              return [
                {
                  title: item.title,
                  url: item.url,
                  icon: item.icon ?? ArrowRight,
                },
              ]
            }
            return (item.items ?? []).map((child) => ({
              title: `${item.title} / ${child.title}`,
              url: child.url,
              icon: child.icon ?? item.icon ?? ArrowRight,
            }))
          })
        )
        .filter((item) => item.url !== pathname),
    [navGroups, pathname]
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder={t('Type a command or search...')} />
        <CommandList>
          <CommandEmpty>{t('No results found.')}</CommandEmpty>

          {/* 页面导航 */}
          {navigationItems.length > 0 && (
            <CommandGroup heading={t('Navigation')}>
              {navigationItems.map((item) => (
                <CommandItem
                  key={item.url}
                  value={`${item.title} ${item.url}`}
                  onSelect={() => {
                    runCommand(() => navigate({ to: item.url }))
                  }}
                >
                  <item.icon className='mr-2 h-4 w-4' />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* 主题切换 */}
          <CommandGroup heading={t('Theme')}>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun className='mr-2 h-4 w-4' />
              <span>{t('Light')}</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='mr-2 h-4 w-4' />
              <span>{t('Dark')}</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop className='mr-2 h-4 w-4' />
              <span>{t('System')}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
