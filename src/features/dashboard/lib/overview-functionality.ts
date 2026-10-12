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
export const USER_OVERVIEW_ACTION_PATHS = [
  '/keys',
  '/usage-logs',
  '/pricing',
] as const

interface RequestPreviewKey {
  id: number
  name: string
  key: string
}

interface BuildOverviewRequestExampleArgs {
  sourceUrl?: string
  origin: string
  firstModel?: string
  preferredKey: RequestPreviewKey | null
  noKeyName: string
}

export interface OverviewRequestExample {
  endpoint: string
  model: string
  keyName: string
  keyId?: number
  displayKey: string
  ready: boolean
}

type Translate = (key: string) => string
type NumberFormatter = (value: number) => string

function normalizeEndpoint(sourceUrl: string | undefined, origin: string) {
  const fallback = `${origin}/v1/chat/completions`
  const trimmed = sourceUrl?.trim()
  if (!trimmed) return fallback

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '')
  if (withoutTrailingSlash.endsWith('/v1/chat/completions')) {
    return withoutTrailingSlash
  }
  if (withoutTrailingSlash.endsWith('/v1')) {
    return `${withoutTrailingSlash}/chat/completions`
  }
  return `${withoutTrailingSlash}/v1/chat/completions`
}

function formatDisplayKey(key?: string) {
  if (!key) return 'sk-...'
  if (key.length <= 14) return key
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}

export function buildOverviewRequestExample(
  args: BuildOverviewRequestExampleArgs
): OverviewRequestExample {
  const model = args.firstModel ?? 'gpt-4o-mini'
  const preferredKey = args.preferredKey

  return {
    endpoint: normalizeEndpoint(args.sourceUrl, args.origin),
    model,
    keyName: preferredKey?.name ?? args.noKeyName,
    keyId: preferredKey?.id,
    displayKey: preferredKey
      ? formatDisplayKey(`sk-${preferredKey.key}`)
      : 'sk-...',
    ready: Boolean(preferredKey?.id && model),
  }
}

export function buildCurlCommand(args: {
  endpoint: string
  apiKey: string
  model: string
}): string {
  return [
    `curl ${args.endpoint} \\`,
    '  -H "Content-Type: application/json" \\',
    `  -H "Authorization: Bearer ${args.apiKey}" \\`,
    `  -d '{"model":"${args.model}","messages":[{"role":"user","content":"Say hello in one sentence."}]}'`,
  ].join('\n')
}

export function resolveSetupGuideExpanded(
  manualValue: boolean | null,
  setupStatusReady: boolean,
  setupComplete: boolean
): boolean {
  return manualValue ?? (setupStatusReady && !setupComplete)
}

export function resolveCurrencyEnabled(
  statusValue: boolean | undefined,
  storedValue: boolean
): boolean {
  return statusValue ?? storedValue
}

export function getRunwayDays(
  remainQuota: number,
  recentUsage: number
): number | null {
  if (remainQuota <= 0 || recentUsage <= 0) return null
  const days = remainQuota / recentUsage
  return Number.isFinite(days) ? days : null
}

export function getRunwayDisplay(
  remainQuota: number,
  recentUsage: number,
  t: Translate,
  formatNumber: NumberFormatter = (value) =>
    Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
): string {
  const runwayDays = getRunwayDays(remainQuota, recentUsage)
  if (runwayDays !== null) {
    if (runwayDays < 1) return t('Less than 1 day left')
    if (runwayDays > 999) return `999+ ${t('days')}`
    return `~${formatNumber(Math.floor(runwayDays))} ${t('days')}`
  }

  return remainQuota <= 0 ? t('Balance depleted') : t('No recent usage')
}
