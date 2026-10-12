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

function appendScript(src: string, attributes: Record<string, string>): void {
  if (document.querySelector(`script[src="${CSS.escape(src)}"]`)) return

  const script = document.createElement('script')
  script.src = src
  for (const [name, value] of Object.entries(attributes)) {
    script.setAttribute(name, value)
  }
  document.head.appendChild(script)
}

export function installAnalytics(): void {
  if (typeof document === 'undefined') return

  const umamiWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim()
  if (umamiWebsiteId) {
    const umamiScriptUrl =
      import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim() ||
      'https://analytics.umami.is/script.js'
    appendScript(umamiScriptUrl, {
      defer: '',
      'data-website-id': umamiWebsiteId,
    })
  }

  const googleAnalyticsId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID?.trim()
  if (googleAnalyticsId) {
    appendScript(
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`,
      { async: '' }
    )
    const inlineScript = document.createElement('script')
    inlineScript.textContent = [
      'window.dataLayer = window.dataLayer || [];',
      'function gtag(){dataLayer.push(arguments);}',
      "gtag('js', new Date());",
      `gtag('config', ${JSON.stringify(googleAnalyticsId)});`,
    ].join('')
    document.head.appendChild(inlineScript)
  }
}
