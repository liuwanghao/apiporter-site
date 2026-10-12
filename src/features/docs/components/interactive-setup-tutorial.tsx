/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import siteFontUrl from '@/assets/fonts/maple-mono/maple-mono-cn-regular.woff2'

import {
  getTutorialLanguage,
  isTutorialNavigation,
  type TutorialProduct,
} from '../lib/interactive-tutorial'

export function InteractiveSetupTutorial(props: { product: TutorialProduct }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const frame = useRef<HTMLIFrameElement>(null)
  const language = getTutorialLanguage(i18n.language)

  useEffect(() => {
    const iframe = frame.current
    const syncTheme = () => {
      const document = iframe?.contentDocument
      const host = iframe?.parentElement
      if (!document || !host) return

      const theme = getComputedStyle(host)
      for (const token of [
        'background',
        'foreground',
        'card',
        'muted',
        'muted-foreground',
        'primary',
        'primary-foreground',
        'border',
        'ring',
        'success',
        'radius',
      ]) {
        document.documentElement.style.setProperty(
          `--site-${token}`,
          theme.getPropertyValue(`--${token}`)
        )
      }
      document.documentElement.style.setProperty(
        '--site-font',
        theme.fontFamily
      )
      document.documentElement.style.setProperty(
        '--site-color-scheme',
        window.document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'light'
      )
      if (!document.querySelector('#site-tutorial-font')) {
        const style = document.createElement('style')
        style.id = 'site-tutorial-font'
        style.textContent = `@font-face { font-family: 'Maple Mono CN'; src: url('${siteFontUrl}') format('woff2'); font-weight: 400; font-display: swap; }`
        document.head.append(style)
      }
    }

    iframe?.addEventListener('load', syncTheme)
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true })
    observer.observe(document.body, { attributes: true })
    syncTheme()
    return () => {
      iframe?.removeEventListener('load', syncTheme)
      observer.disconnect()
    }
  }, [language, props.product])

  useEffect(() => {
    const onNavigate = (event: MessageEvent<unknown>) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        !isTutorialNavigation(event.data, props.product)
      ) {
        return
      }
      if (event.data.path !== '/') {
        void navigate({ to: '/docs/$guide', params: { guide: props.product } })
      } else {
        void navigate({ to: '/' })
      }
    }
    window.addEventListener('message', onNavigate)
    return () => window.removeEventListener('message', onNavigate)
  }, [navigate, props.product])

  return (
    <main
      id='main-content'
      className='console-public bg-background fixed inset-0 z-50'
    >
      {/* First-party code: the iframe isolates styles; origin/source checks protect the navigation bridge. */}
      {/* oxlint-disable-next-line react/iframe-missing-sandbox -- Trusted same-origin application code needs clipboard and local navigation. */}
      <iframe
        ref={frame}
        src={`/tutorials/${props.product}/index.html?lang=${language}`}
        title={
          props.product === 'codex'
            ? t('Interactive Codex setup')
            : t('Interactive Claude Code setup')
        }
        className='block size-full border-0'
        allow='clipboard-write'
      />
    </main>
  )
}
