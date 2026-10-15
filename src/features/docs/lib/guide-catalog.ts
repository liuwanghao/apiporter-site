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

export type GuideIconName =
  | 'bot'
  | 'braces'
  | 'code'
  | 'image'
  | 'settings'
  | 'sparkles'
  | 'terminal'
  | 'video'

export type GuideEndpoint = 'root' | 'v1'

export type DocsGuide = {
  slug: string
  provider: string
  title: string
  category: string
  description: string
  protocols: readonly string[]
  endpoint: GuideEndpoint
  exampleModel?: string
  icon: GuideIconName
}

export const DOC_GUIDES: readonly DocsGuide[] = [
  {
    slug: 'codex',
    provider: 'Codex / OpenAI',
    title: 'Codex quick start',
    category: 'Codex / Responses API',
    description:
      'Connect Codex CLI to ApiPorter on macOS, Linux, or Windows and validate a first coding request.',
    protocols: ['Chat Completions', 'Responses API'],
    endpoint: 'v1',
    exampleModel: 'gpt-5.6-sol',
    icon: 'terminal',
  },
  {
    slug: 'claude-code',
    provider: 'Claude Code',
    title: 'Claude Code quick start',
    category: 'Claude Code / Anthropic Messages',
    description:
      'Configure Claude Code with a ApiPorter key, supported Claude model IDs, and the Anthropic-compatible endpoint.',
    protocols: ['Anthropic Messages'],
    endpoint: 'root',
    exampleModel: 'claude-opus-5',
    icon: 'bot',
  },
  {
    slug: 'opencode',
    provider: 'OpenCode',
    title: 'OpenCode configuration',
    category: 'OpenCode / OpenAI compatibility',
    description:
      'Connect OpenCode to ApiPorter as an OpenAI-compatible provider and switch between supported models.',
    protocols: ['Chat Completions'],
    endpoint: 'v1',
    exampleModel: 'gpt-5.6-sol',
    icon: 'code',
  },
  {
    slug: 'grok-build',
    provider: 'Grok Build / xAI',
    title: 'Grok Build configuration',
    category: 'Grok Build / Responses API',
    description:
      'Connect the official Grok Build CLI with a ApiPorter key, grok-4.5, and the Responses API endpoint.',
    protocols: ['Responses API'],
    endpoint: 'v1',
    exampleModel: 'grok-4.5',
    icon: 'braces',
  },
  {
    slug: 'gemini-cli',
    provider: 'Gemini CLI',
    title: 'Gemini CLI quick start',
    category: 'Gemini CLI / Gemini API',
    description:
      'Install the official Gemini CLI, configure a ApiPorter key and Gemini API endpoint, then verify the connection.',
    protocols: ['Gemini API'],
    endpoint: 'root',
    exampleModel: 'gemini-3.6-flash',
    icon: 'sparkles',
  },
  {
    slug: 'seedance',
    provider: 'Video API',
    title: 'Seedance Video API integration',
    category: 'Seedance / Asynchronous Video API',
    description:
      'Create Seedance 2.0 or 2.5 text-to-video and image-to-video jobs, poll their state, and download the result.',
    protocols: ['Video API'],
    endpoint: 'v1',
    exampleModel: 'seedance-2.5',
    icon: 'video',
  },
  {
    slug: 'images',
    provider: 'Image generation',
    title: 'GPT Image 2 and Gemini image-generation APIs',
    category: 'OpenAI Images + Gemini Images',
    description:
      'Use GPT Image 2 through the OpenAI-compatible Images API, or Nano Banana models through the native Gemini API.',
    protocols: ['Images API', 'Gemini API', 'SSE'],
    endpoint: 'root',
    exampleModel: 'gpt-image-2',
    icon: 'image',
  },
  {
    slug: 'cc-switch',
    provider: 'CC-Switch',
    title: 'CC-Switch configuration',
    category: 'Local provider switching',
    description:
      'Create and switch ApiPorter profiles in CC-Switch for Codex, Claude Code, OpenCode, and other coding tools.',
    protocols: ['Responses API', 'Anthropic Messages', 'Gemini API'],
    endpoint: 'root',
    icon: 'settings',
  },
] as const

type Translate = (value: string) => string

export function filterGuideCatalog(
  guides: readonly DocsGuide[],
  query: string,
  translate: Translate = (value) => value
): DocsGuide[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return [...guides]

  return guides.filter((guide) => {
    const translatableValues = [
      guide.provider,
      guide.title,
      guide.category,
      guide.description,
      ...guide.protocols,
    ]
      .map((value) => `${value} ${translate(value)}`)
      .join(' ')
    const searchableText =
      `${translatableValues} ${guide.exampleModel || ''}`.toLocaleLowerCase()

    return searchableText.includes(normalizedQuery)
  })
}

export function findGuideBySlug(slug: string): DocsGuide | undefined {
  return DOC_GUIDES.find((guide) => guide.slug === slug)
}

export function resolveGuideBaseUrl(
  apiBaseUrl: string,
  endpoint: GuideEndpoint
): string {
  if (endpoint === 'v1') return apiBaseUrl.replace(/\/+$/, '')
  return apiBaseUrl.replace(/\/v1\/?$/i, '').replace(/\/+$/, '')
}
