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
import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const OFFICIAL_WIDGET_ID = 'cloudbridge-support-widget'
const OFFICIAL_WIDGET_LAUNCHER_STYLE_ID =
  'cloudbridge-support-widget-launcher-style'
const SUPPORT_WIDGET_ERROR_EVENT = 'cloudbridge-support-error'
const FALLBACK_DELAY_MS = 1200

function styleOfficialWidgetLauncher(label: string) {
  const host = document.querySelector<HTMLElement>(`#${OFFICIAL_WIDGET_ID}`)
  const shadowRoot = host?.shadowRoot
  const launcher = shadowRoot?.querySelector<HTMLButtonElement>('.launcher')

  if (!shadowRoot || !launcher) return false

  launcher.setAttribute('aria-label', label)
  launcher.title = label

  if (!shadowRoot.querySelector(`#${OFFICIAL_WIDGET_LAUNCHER_STYLE_ID}`)) {
    const style = document.createElement('style')
    style.id = OFFICIAL_WIDGET_LAUNCHER_STYLE_ID
    style.textContent = `
      .wrap {
        bottom: max(66px, calc(env(safe-area-inset-bottom) + 50px)) !important;
      }
      @media (min-width: 641px) {
        .wrap {
          bottom: max(70px, calc(env(safe-area-inset-bottom) + 50px)) !important;
        }
      }
      .wrap .launcher {
        width: 58px !important;
        min-width: 0 !important;
        height: 58px !important;
        box-sizing: border-box !important;
        justify-content: center !important;
        gap: 0 !important;
        padding: 0 !important;
        border-radius: 18px 18px 6px 18px !important;
      }
      .wrap .launcher span {
        display: none !important;
      }
      @media (max-width: 640px) {
        .wrap .launcher {
          width: 56px !important;
          height: 56px !important;
        }
      }
    `
    shadowRoot.append(style)
  }

  return true
}

export function CustomerSupportFallback() {
  const { t } = useTranslation()
  const label = t('Customer service center')
  const [officialWidgetMounted, setOfficialWidgetMounted] = useState(false)
  const [fallbackVisible, setFallbackVisible] = useState(false)

  useEffect(() => {
    const hasOfficialWidget = () => styleOfficialWidgetLauncher(label)
    const syncOfficialWidget = () => {
      const mounted = hasOfficialWidget()
      setOfficialWidgetMounted(mounted)
      if (mounted) setFallbackVisible(false)
    }
    const showFallback = () => {
      if (!hasOfficialWidget()) setFallbackVisible(true)
    }

    syncOfficialWidget()
    window.addEventListener(SUPPORT_WIDGET_ERROR_EVENT, showFallback)

    const observer = new MutationObserver(syncOfficialWidget)
    observer.observe(document.body, { childList: true })
    const fallbackTimer = window.setTimeout(showFallback, FALLBACK_DELAY_MS)

    return () => {
      window.removeEventListener(SUPPORT_WIDGET_ERROR_EVENT, showFallback)
      window.clearTimeout(fallbackTimer)
      observer.disconnect()
    }
  }, [label])

  if (officialWidgetMounted || !fallbackVisible) return null

  return (
    <a
      href='mailto:support@cbapi.ai?subject=Cloudbridge%20Support'
      aria-label={label}
      title={label}
      data-customer-support-fallback='true'
      className='fixed end-4 bottom-[max(66px,calc(env(safe-area-inset-bottom)+50px))] z-[2147482999] inline-flex size-14 items-center justify-center rounded-[18px_18px_6px_18px] border border-white/25 bg-[#f2653c] text-white shadow-[0_16px_40px_rgba(16,46,40,0.28)] transition-[transform,background-color,box-shadow] duration-200 outline-none hover:-translate-y-0.5 hover:bg-[#e95731] hover:shadow-[0_18px_44px_rgba(16,46,40,0.36)] focus-visible:ring-2 focus-visible:ring-[#f2653c] focus-visible:ring-offset-2 active:scale-95 motion-reduce:transition-none sm:end-5 sm:bottom-[max(70px,calc(env(safe-area-inset-bottom)+50px))] sm:size-[58px]'
    >
      <MessageCircle
        aria-hidden='true'
        className='size-6 shrink-0 stroke-[1.9]'
      />
    </a>
  )
}
