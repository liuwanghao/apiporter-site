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
import { Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { NotificationPopover } from '@/components/notification-popover'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/hooks/use-notifications'
import { useSystemConfig } from '@/hooks/use-system-config'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { defaultTopNavLinks } from '../config/top-nav.config'
import type { TopNavLink } from '../types'
import { Header } from './header'
import { SystemBrand } from './system-brand'
import { TopNav } from './top-nav'

const AUTH_PROMPT_SECONDS = 5

type AuthPromptTarget = {
  title: string
  href: string
}

export type AppHeaderProps = {
  /**
   * Custom navigation links, uses default global navigation or dynamically generated from backend if not provided
   */
  navLinks?: TopNavLink[]
  /**
   * Whether to show top navigation bar
   * @default true
   */
  showTopNav?: boolean
  /** Backwards-compatible alias used by public layouts. */
  showNavigation?: boolean
  /** Optional custom navigation content. */
  navContent?: React.ReactNode
  /** Optional custom brand values used by public layouts. */
  logo?: React.ReactNode
  siteName?: string
  homeUrl?: string
  /**
   * Left content, overrides default brand if provided
   */
  leftContent?: React.ReactNode
  /**
   * Custom right content, overrides default right content if provided
   */
  rightContent?: React.ReactNode
  /**
   * Whether to show notification button
   * @default true
   */
  showNotifications?: boolean
  /**
   * Whether to show theme switch
   * @default true
   */
  showThemeSwitch?: boolean
  /**
   * Whether to show profile dropdown / auth buttons
   * @default true
   */
  showProfileDropdown?: boolean
  /**
   * Whether to show auth buttons for unauthenticated visitors
   * @default true
   */
  showAuthButtons?: boolean
  /**
   * Additional header className
   */
  className?: string
  /** Use the authenticated console arrangement for the right-side actions. */
  consoleMode?: boolean
}

/**
 * 全站通用的 Header 顶栏组件（主页、控制台、模型广场、排行榜等共用）
 */
export function AppHeader({
  navLinks = defaultTopNavLinks,
  showTopNav = true,
  leftContent,
  rightContent,
  showNotifications = true,
  showThemeSwitch = true,
  showProfileDropdown = true,
  showAuthButtons = true,
  showNavigation,
  navContent,
  logo,
  siteName,
  homeUrl,
  className,
  consoleMode = false,
}: AppHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dynamicLinks = useTopNavLinks()
  const links = dynamicLinks.length > 0 ? dynamicLinks : navLinks
  const shouldShowTopNav = showNavigation ?? showTopNav
  const notifications = useNotifications()
  const { auth } = useAuthStore()
  const { loading } = useSystemConfig()

  const [authPromptTarget, setAuthPromptTarget] =
    useState<AuthPromptTarget | null>(null)
  const [authPromptSecondsLeft, setAuthPromptSecondsLeft] =
    useState(AUTH_PROMPT_SECONDS)

  const user = auth.user
  const isAuthenticated = !!user
  const accountHeader = consoleMode || isAuthenticated

  const closeAuthPrompt = useCallback(() => {
    setAuthPromptTarget(null)
    setAuthPromptSecondsLeft(AUTH_PROMPT_SECONDS)
  }, [])

  useEffect(() => {
    if (!authPromptTarget) return

    const intervalId = window.setInterval(() => {
      setAuthPromptSecondsLeft((seconds) => Math.max(seconds - 1, 0))
    }, 1000)

    const timeoutId = window.setTimeout(() => {
      const redirect = authPromptTarget.href
      setAuthPromptTarget(null)
      navigate({ to: '/sign-in', search: { redirect } })
    }, AUTH_PROMPT_SECONDS * 1000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [authPromptTarget, navigate])

  const navigateToSignIn = useCallback(() => {
    const redirect = authPromptTarget?.href || '/'
    setAuthPromptTarget(null)
    navigate({ to: '/sign-in', search: { redirect } })
  }, [authPromptTarget?.href, navigate])

  const handleNavLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, link: TopNavLink) => {
      if (link.disabled) {
        event.preventDefault()
        return
      }

      if (link.requiresAuth && !isAuthenticated) {
        event.preventDefault()
        setAuthPromptSecondsLeft(AUTH_PROMPT_SECONDS)
        setAuthPromptTarget({
          title: t(link.title),
          href: link.href,
        })
      }
    },
    [isAuthenticated, t]
  )

  const renderProfileOrAuth = () => {
    if (loading) {
      return <Skeleton className='size-8 rounded-full' />
    }
    if (isAuthenticated) {
      return <ProfileDropdown />
    }
    if (showAuthButtons) {
      return (
        <Button
          size='sm'
          className='h-8 rounded-lg px-3.5 text-xs font-medium shadow-xs'
          render={<Link to='/sign-in' />}
        >
          {t('Sign in')}
        </Button>
      )
    }
    return null
  }

  return (
    <>
      <Header className={cn(consoleMode && 'console-topbar', className)}>
        <div className='app-header-inner relative flex min-w-0 flex-1 items-center'>
          {/* Left Area: Brand or Custom Left */}
          <div className='app-header-left absolute inset-y-0 start-0 flex min-w-0 items-center gap-3'>
            {consoleMode && (
              <SidebarTrigger
                aria-label={t('Sidebar')}
                className='console-sidebar-trigger topbar-icon-control md:hidden'
              />
            )}
            {leftContent ?? (
              <SystemBrand
                variant='inline'
                logo={logo}
                siteName={siteName}
                homeUrl={homeUrl}
              />
            )}
          </div>

          {/* Center Area: Primary navigation buttons */}
          <div className='app-header-center absolute inset-y-0 start-1/2 flex -translate-x-1/2 items-center justify-center'>
            {navContent ??
              (shouldShowTopNav && (
                <TopNav links={links} onLinkClick={handleNavLinkClick} />
              ))}
          </div>

          {/* Right Area: Actions */}
          {rightContent ?? (
            <div className='app-header-actions absolute inset-y-0 end-0 flex items-center gap-1.5 sm:gap-2'>
              {showNotifications && (
                <NotificationPopover
                  open={notifications.popoverOpen}
                  onOpenChange={notifications.setPopoverOpen}
                  unreadCount={notifications.unreadCount}
                  activeTab={notifications.activeTab}
                  onTabChange={notifications.setActiveTab}
                  notice={notifications.notice}
                  announcements={notifications.announcements}
                  loading={notifications.loading}
                />
              )}

              {showThemeSwitch && <ThemeSwitch />}

              {showProfileDropdown && (
                <>
                  <div className='bg-border/60 mx-1 h-4 w-px' />
                  {isAuthenticated ? (
                    <ProfileDropdown showName={accountHeader} />
                  ) : (
                    renderProfileOrAuth()
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Header>

      <Dialog
        open={!!authPromptTarget}
        onOpenChange={(open) => {
          if (!open) {
            closeAuthPrompt()
          }
        }}
        title={t('Sign in required')}
        description={t('Please sign in to view {{module}}.', {
          module: authPromptTarget?.title || '',
        })}
        contentClassName='sm:max-w-md'
        contentHeight='auto'
        footer={
          <>
            <Button variant='outline' onClick={closeAuthPrompt}>
              {t('Cancel')}
            </Button>
            <Button onClick={navigateToSignIn}>{t('Sign in now')}</Button>
          </>
        }
      >
        <div className='bg-muted/40 text-muted-foreground rounded-lg px-3 py-2 text-sm'>
          {t('Redirecting to sign in in {{seconds}} seconds.', {
            seconds: authPromptSecondsLeft,
          })}
        </div>
      </Dialog>
    </>
  )
}
