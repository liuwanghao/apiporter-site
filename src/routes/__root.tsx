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
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  createRootRouteWithContext,
  Outlet,
  redirect,
  useNavigate,
  useLocation,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useEffect } from 'react'

import { NavigationProgress } from '@/components/navigation-progress'
import { PublicSeo } from '@/components/public-seo'
import { Toaster } from '@/components/ui/sonner'
import { SearchProvider } from '@/context/search-provider'
import { ThemeCustomizationProvider } from '@/context/theme-customization-provider'
import {
  saveCommissionReferralCode,
  saveOfficialAffiliateCode,
} from '@/features/auth/lib/storage'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'
import { getSetupStatus } from '@/features/setup/api'
import { useSystemConfig } from '@/hooks/use-system-config'
import { useTranslation } from 'react-i18next'
import {
  bootstrapAuthentication,
  clearAuthenticatedClientState,
  clearAuthentication,
} from '@/lib/auth-session'
import { subscribeAuthSessionEvents } from '@/lib/auth-session-sync'
import { resolveLegacyRoute } from '@/lib/legacy-route'
import { getPage, renderHead } from '@/lib/public-pages'
import { useAuthStore } from '@/stores/auth-store'

function RootComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const { i18n } = useTranslation()

  // Load system configuration (logo, system name, etc.) from backend
  const systemConfig = useSystemConfig({ autoLoad: true })

  // Update SEO meta tags on route change
  useEffect(() => {
    const page = getPage(location.pathname)
    const preview = document.querySelector('meta[name="seo-preview"]')
    const isPreview = preview?.getAttribute('content') === 'true'
    
    document
      .querySelectorAll(
        'title, meta[name="title"], meta[name="description"], meta[name="keywords"], meta[name="robots"], link[rel="canonical"], [data-cbapi-seo]'
      )
      .forEach((el) => el.remove())
    
    const head = document.head
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = renderHead(page, isPreview, systemConfig, i18n.language)
    
    ;[...tempDiv.children].forEach((child) => {
      head.appendChild(child)
    })
  }, [location.pathname, systemConfig, i18n.language])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const ref = searchParams.get('ref')?.trim()
    const aff = searchParams.get('aff')?.trim()
    if (ref) {
      saveCommissionReferralCode(ref)
    } else if (aff) {
      saveOfficialAffiliateCode(aff)
    }
  }, [])

  useEffect(
    () =>
      useAuthStore.subscribe((state, previousState) => {
        const sid = state.auth.session?.sid
        const previousSID = previousState.auth.session?.sid
        if (sid !== previousSID) {
          queryClient.clear()
        }
      }),
    [queryClient]
  )

  useEffect(
    () =>
      subscribeAuthSessionEvents((event) => {
        const currentSID = useAuthStore.getState().auth.session?.sid

        if (event.kind === 'authenticated') {
          if (event.sid === currentSID) return
          if (currentSID) {
            clearAuthentication(false)
          }
          window.location.reload()
          return
        }

        if (currentSID && event.sid === currentSID) {
          clearAuthenticatedClientState(queryClient, false)
          void navigate({ to: '/sign-in', replace: true })
        }
      }),
    [navigate, queryClient]
  )

  return (
    <ThemeCustomizationProvider>
      <SearchProvider>
        <NavigationProgress />
        <Outlet />
        <PublicSeo />
        <Toaster closeButton duration={5000} position='top-center' richColors />
        {import.meta.env.MODE === 'development' && (
          <>
            <ReactQueryDevtools buttonPosition='bottom-left' />
            <TanStackRouterDevtools position='bottom-right' />
          </>
        )}
      </SearchProvider>
    </ThemeCustomizationProvider>
  )
}

// Avoid repeated checks during one page lifetime. This must not persist across
// reloads because the backend database can be replaced or reset independently.
let setupStatusChecked = false

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  // 应用初始化与路由解析前统一校验会话
  beforeLoad: async ({ location }) => {
    const legacyTarget = resolveLegacyRoute(location.href)
    if (legacyTarget) {
      throw redirect({ href: legacyTarget, replace: true })
    }

    const pathname = location?.pathname || ''
    const needsSetupCheck =
      !setupStatusChecked && !pathname.startsWith('/setup')
    const authBootstrap = bootstrapAuthentication()

    // 只检查 setup 状态（如果需要）
    if (needsSetupCheck) {
      const [status] = await Promise.all([
        getSetupStatus().catch((error) => {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn('[root.beforeLoad] setup status check failed', error)
          }
          return null
        }),
        authBootstrap,
      ])

      if (status?.success && status.data) {
        if (!status.data.status) {
          throw redirect({ to: '/setup' })
        }
        setupStatusChecked = true
      }
    } else {
      await authBootstrap
    }
  },
  component: RootComponent,
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
