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
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import siteFontUrl from '@/assets/fonts/maple-mono/maple-mono-cn-regular.woff2'
import { PublicLayout } from '@/components/layout'
import { useTheme } from '@/context/theme-provider'
import { toLandingLanguage } from '@/i18n/geo-language'

export function Home() {
  const { resolvedTheme } = useTheme()
  const { i18n } = useTranslation()
  const landingFrameRef = useRef<HTMLIFrameElement>(null)
  const landingLanguage = toLandingLanguage(
    i18n.resolvedLanguage || i18n.language
  )
  const landingSource = `/relay-landing.html?language=${landingLanguage}`

  const syncLandingPreferences = useCallback(() => {
    landingFrameRef.current?.contentWindow?.postMessage(
      {
        type: 'relay-theme',
        theme: resolvedTheme,
        language: landingLanguage,
        fontUrl: siteFontUrl,
      },
      window.location.origin
    )
  }, [landingLanguage, resolvedTheme])

  useEffect(() => {
    syncLandingPreferences()
  }, [syncLandingPreferences])

  return (
    <PublicLayout
      gradientBackground
      showMainContainer={false}
      headerProps={{ className: 'home-topbar' }}
    >
      {/* oxlint-disable-next-line react/iframe-missing-sandbox -- Trusted same-origin landing page needs the bundled app font. */}
      <iframe
        ref={landingFrameRef}
        src={landingSource}
        className='block h-svh w-full border-none'
        title='Relay / 统一 AI 请求路由层'
        onLoad={syncLandingPreferences}
      />
    </PublicLayout>
  )
}
