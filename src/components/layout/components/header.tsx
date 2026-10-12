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
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

type HeaderProps = React.HTMLAttributes<HTMLElement>

export function Header({ className, children, ...props }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    let headerScrolled = false
    const updateScrollState = () => {
      const scrollY = Math.max(0, window.scrollY || 0)
      if (!headerScrolled && scrollY > 8) headerScrolled = true
      else if (headerScrolled && scrollY < 4) headerScrolled = false
      setIsScrolled((current) =>
        current === headerScrolled ? current : headerScrolled
      )
    }
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === 'relay-scroll'
      ) {
        setIsScrolled(Boolean(event.data.scrolled))
      }
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return (
    <header
      className={cn(
        'border-border/60 bg-background/80 sticky top-0 z-40 h-[var(--app-header-height,3.5rem)] w-full shrink-0 border-b backdrop-blur-xl transition-all',
        className
      )}
      data-scrolled={isScrolled ? 'true' : 'false'}
      {...props}
    >
      <div className='relative flex h-full items-center gap-2 px-[18px] sm:px-4 md:px-6'>
        <div className='flex min-w-0 flex-1 items-center justify-between gap-2'>
          {children}
        </div>
      </div>
    </header>
  )
}
