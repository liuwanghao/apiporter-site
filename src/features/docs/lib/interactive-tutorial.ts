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

export function getTutorialLanguage(language: string): 'zh' | 'zh-TW' | 'en' {
  const normalized = language.toLowerCase()
  if (
    ['zh-tw', 'zh-hk', 'zh-hant'].some((locale) =>
      normalized.startsWith(locale)
    )
  ) {
    return 'zh-TW'
  }
  return normalized.startsWith('zh') ? 'zh' : 'en'
}

export type TutorialProduct = 'codex' | 'claude-code'

type TutorialNavigation = {
  type: `apiporter:${TutorialProduct}-navigate`
  path: '/' | `/docs/${TutorialProduct}`
}

export function isTutorialNavigation(
  data: unknown,
  product: TutorialProduct
): data is TutorialNavigation {
  if (!data || typeof data !== 'object') return false
  return (
    'type' in data &&
    data.type === `apiporter:${product}-navigate` &&
    'path' in data &&
    (data.path === '/' || data.path === `/docs/${product}`)
  )
}
