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
import { cn } from '@/lib/utils'

import { AppHeader, type AppHeaderProps } from './app-header'

export type PublicHeaderProps = AppHeaderProps & {
  mobileLinks?: AppHeaderProps['navLinks']
  navContent?: React.ReactNode
  logo?: React.ReactNode
  siteName?: string
  homeUrl?: string
  showNavigation?: boolean
}

/**
 * PublicHeader 现在与 AppHeader 保持统一结构与风格
 */
export function PublicHeader(props: PublicHeaderProps) {
  return (
    <AppHeader {...props} className={cn('public-topbar', props.className)} />
  )
}
