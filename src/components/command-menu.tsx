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
import {
  Laptop,
  Moon,
  Sun,
  Key,
  LayoutDashboard,
  User,
  Users,
  CreditCard,
  Settings,
  Bot,
  Activity,
  DollarSign,
  Gift,
  Server,
  Layers,
} from 'lucide-react'
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
import { useIsSidebarModuleVisible } from '@/hooks/use-sidebar-config'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

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

  const user = useAuthStore((state) => state.auth.user)
  const isSuperAdmin = user?.role === ROLE.SUPER_ADMIN
  const isDashboardVisible = useIsSidebarModuleVisible('/dashboard')
  const isPlaygroundVisible = useIsSidebarModuleVisible('/playground')
  const isKeysVisible = useIsSidebarModuleVisible('/keys')
  const isChannelsVisible = useIsSidebarModuleVisible('/channels')
  const isModelsVisible = useIsSidebarModuleVisible('/models')
  const isUsersVisible = useIsSidebarModuleVisible('/users')
  const isSubscriptionsVisible = useIsSidebarModuleVisible('/subscriptions')
  const isRedemptionCodesVisible =
    useIsSidebarModuleVisible('/redemption-codes')
  const isUsageLogsVisible = useIsSidebarModuleVisible('/usage-logs')
  const isWalletVisible = useIsSidebarModuleVisible('/wallet')

  const runCommand = useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  // 导航项列表
  const navigationItems = useMemo(() => {
    const items = [
      {
        title: t('Dashboard'),
        icon: LayoutDashboard,
        url: '/dashboard',
        keywords: ['dashboard', 'home', 'overview', '控制台', '仪表盘', '首页'],
        visible: isDashboardVisible,
      },
      {
        title: t('Playground'),
        icon: Bot,
        url: '/playground',
        keywords: ['playground', 'chat', 'test', '演练场', '测试', '对话'],
        visible: isPlaygroundVisible,
      },
      {
        title: t('API Keys'),
        icon: Key,
        url: '/keys',
        keywords: ['api', 'key', 'token', 'access', '令牌', '密钥'],
        visible: isKeysVisible,
      },
      {
        title: t('Channels'),
        icon: Layers,
        url: '/channels',
        keywords: ['channel', 'upstream', 'provider', '渠道', '通道', '上游'],
        visible: isSuperAdmin && isChannelsVisible,
      },
      {
        title: t('Models'),
        icon: Server,
        url: '/models',
        keywords: ['model', 'ai', 'llm', '模型', '列表'],
        visible: isSuperAdmin && isModelsVisible,
      },
      {
        title: t('Users'),
        icon: Users,
        url: '/users',
        keywords: ['user', 'account', 'member', '用户', '账号', '成员'],
        visible: isSuperAdmin && isUsersVisible,
      },
      {
        title: t('Subscriptions'),
        icon: CreditCard,
        url: '/subscriptions',
        keywords: ['subscription', 'plan', 'pricing', '订阅', '套餐'],
        visible: isSuperAdmin && isSubscriptionsVisible,
      },
      {
        title: t('Redemption Codes'),
        icon: Gift,
        url: '/redemption-codes',
        keywords: ['redemption', 'code', 'coupon', 'gift', '兑换码', '充值卡'],
        visible: isSuperAdmin && isRedemptionCodesVisible,
      },
      {
        title: t('Usage Logs'),
        icon: Activity,
        url: '/usage-logs',
        keywords: ['log', 'usage', 'history', 'call', '日志', '使用记录'],
        visible: isUsageLogsVisible,
      },
      {
        title: t('Wallet'),
        icon: DollarSign,
        url: '/wallet',
        keywords: ['wallet', 'balance', 'topup', 'pay', '钱包', '余额', '充值'],
        visible: isWalletVisible,
      },
      {
        title: t('Profile'),
        icon: User,
        url: '/profile',
        keywords: [
          'profile',
          'user',
          'account',
          'setting',
          '个人',
          '设置',
          '资料',
        ],
        visible: true,
      },
      {
        title: t('System Settings'),
        icon: Settings,
        url: '/system-settings',
        keywords: [
          'system',
          'settings',
          'config',
          'admin',
          '系统',
          '设置',
          '配置',
        ],
        visible: isSuperAdmin,
      },
    ]

    return items.filter((item) => item.visible && item.url !== pathname)
  }, [
    t,
    isSuperAdmin,
    isDashboardVisible,
    isPlaygroundVisible,
    isKeysVisible,
    isChannelsVisible,
    isModelsVisible,
    isUsersVisible,
    isSubscriptionsVisible,
    isRedemptionCodesVisible,
    isUsageLogsVisible,
    isWalletVisible,
    pathname,
  ])

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
                  value={`${item.title} ${item.keywords.join(' ')}`}
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
