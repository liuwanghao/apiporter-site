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
import { Link, useLocation } from '@tanstack/react-router'
import { ExternalLink, Menu, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { TopNavLink } from '../types'

export type TopNavProps = React.HTMLAttributes<HTMLElement> & {
  links: TopNavLink[]
  onLinkClick?: (
    event: React.MouseEvent<HTMLAnchorElement>,
    link: TopNavLink,
    closeMobile?: boolean
  ) => void
}

/**
 * 通用顶部导航栏组件
 * 在主页、控制台、模型广场、排行榜等各页面统一使用
 */
export function TopNav({
  className,
  links,
  onLinkClick,
  ...props
}: TopNavProps) {
  const { t } = useTranslation()
  const pathname = useLocation({ select: (location) => location.pathname })
  const [mobileOpen, setMobileOpen] = useState(false)

  const normalizedLinks = useMemo(
    () =>
      links.map((link) => {
        const isCurrentActive =
          link.href === '/'
            ? pathname === '/'
            : pathname === link.href || pathname.startsWith(`${link.href}/`)

        return {
          isActive: link.isActive ?? isCurrentActive,
          disabled: false,
          external: false,
          ...link,
        }
      }),
    [links, pathname]
  )

  useEffect(() => {
    if (!mobileOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    const closeOnResize = () => {
      if (window.innerWidth > 767) setMobileOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', closeOnResize)
    document.body.classList.toggle('top-nav-menu-open', true)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', closeOnResize)
      document.body.classList.remove('top-nav-menu-open')
    }
  }, [mobileOpen])

  const handleMobileLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    link: TopNavLink
  ) => {
    onLinkClick?.(event, link, true)
    if (!event.defaultPrevented) setMobileOpen(false)
  }

  return (
    <>
      <div className='top-nav-mobile md:hidden'>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          aria-label={mobileOpen ? t('Close menu') : t('Open menu')}
          aria-expanded={mobileOpen}
          aria-controls='top-nav-mobile-menu'
          className='top-nav-mobile-toggle'
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className='size-5' /> : <Menu className='size-5' />}
        </Button>
        <button
          type='button'
          aria-label={t('Close menu')}
          className={cn('top-nav-mobile-backdrop', mobileOpen && 'is-open')}
          tabIndex={mobileOpen ? 0 : -1}
          onClick={() => setMobileOpen(false)}
        />
        <nav
          id='top-nav-mobile-menu'
          aria-label='Primary navigation'
          className={cn('top-nav-mobile-panel', mobileOpen && 'is-open')}
        >
          {normalizedLinks.map((link) => {
            const { title, href, isActive, disabled, external } = link
            const props = {
              'aria-current': isActive ? ('page' as const) : undefined,
              className: cn(
                'top-nav-mobile-link',
                isActive && 'is-active',
                disabled && 'pointer-events-none opacity-50'
              ),
              onClick: (event: React.MouseEvent<HTMLAnchorElement>) =>
                handleMobileLinkClick(event, link),
            }
            return external ? (
              <a
                key={`${title}-${href}`}
                href={href}
                target='_blank'
                rel='noopener noreferrer'
                {...props}
              >
                <span>{title}</span>
                <ExternalLink className='size-3 opacity-60' />
              </a>
            ) : (
              <Link
                key={`${title}-${href}`}
                to={href}
                disabled={disabled}
                {...props}
              >
                {title}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* 桌面端导航 */}
      <nav
        className={cn('hidden items-center gap-1 md:flex', className)}
        {...props}
      >
        {normalizedLinks.map((link) => {
          const { title, href, isActive, disabled, external } = link
          const itemClasses = cn(
            'group focus-visible:ring-ring/40 relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors outline-none select-none focus-visible:ring-2',
            isActive
              ? 'bg-accent/80 text-foreground font-semibold shadow-2xs'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            disabled && 'pointer-events-none opacity-50'
          )

          return external ? (
            <a
              key={`${title}-${href}`}
              href={href}
              target='_blank'
              rel='noopener noreferrer'
              onClick={(e) => onLinkClick?.(e, link)}
              aria-current={isActive ? 'page' : undefined}
              data-active={isActive}
              className={itemClasses}
            >
              <span>{title}</span>
              <ExternalLink className='size-3 opacity-40 transition-opacity group-hover:opacity-70' />
            </a>
          ) : (
            <Link
              key={`${title}-${href}`}
              to={href}
              disabled={disabled}
              onClick={(e) => onLinkClick?.(e, link)}
              aria-current={isActive ? 'page' : undefined}
              data-active={isActive}
              className={itemClasses}
            >
              {title}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
