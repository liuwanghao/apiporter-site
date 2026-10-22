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
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, test } from 'vitest'

import { DOC_GUIDES } from '../guide-catalog.ts'

const pageKeys = [
  'Documentation',
  'Build with every model through one gateway',
  'Choose a client or API workflow, connect a ApiPorter key, and move from configuration to a verified request without leaving this site.',
  'Copy base URL',
  'Create API key',
  'Browse models',
  'ApiPorter API guides',
  'Choose your integration path',
  '{{count}} practical guides, all maintained inside ApiPorter.',
  'Search guides, protocols, or models',
  'Search documentation',
  'Open {{title}}',
  'View setup guide',
  'No guides found',
  'Try a client name such as Codex, a protocol such as Responses API, or a model family.',
  'Show all guides',
  'Example model',
  'Choose in the client',
  'Interactive tutorial',
  '{{product}} quick setup',
  'Start interactive tutorial: {{title}}',
  'Interactive Codex setup',
  'Interactive Claude Code setup',
  'Step 1',
  'Step 2',
  'Step 3',
  'Step 4',
  'Create an API key',
  'Open the API key page, create a key, and give it access to the model you plan to use. The example below uses {{model}}, but any Responses-compatible model available to your key will work.',
  'Keep the key private',
  'Do not paste a real key into screenshots, tickets, source code, or this documentation. Revoke it immediately if it is exposed.',
  'Install Codex CLI',
  'Use the official OpenAI installer for your operating system. The npm command is available as a fallback when the standalone installer is unavailable.',
  'Configure ApiPorter',
  'Codex reads user defaults from the config.toml file in your .codex directory. Add the custom provider below, then expose your API key through the APIPORTER_API_KEY environment variable.',
  'macOS / Linux path',
  'Windows path',
  'Set the API key for this terminal',
  'Replace YOUR_APIPORTER_API_KEY locally. The commands above only set the variable for the current terminal session.',
  'Verify the connection',
  'Open a project directory, start Codex with your selected model, and inspect the active session before sending a small test prompt.',
  'Inside Codex, run {{statusCommand}}, then enter:',
  'Reply with only the current model name and provider identifier.',
  'Test prompt',
  'If the provider is apiporter and the model responds normally, the setup is complete.',
  'Reference',
  'Troubleshooting',
  'Symptom',
  'What to do',
  'Still not working?',
  'Include the Codex version, operating system, error code, and model name when asking for help. Never include your API key.',
  '401 / Unauthorized',
  'Create a new API key, then check that APIPORTER_API_KEY contains the complete key without extra spaces.',
  'Choose a model and group available to your API key, then update the model value in config.toml.',
  'Codex still asks for ChatGPT sign-in',
  'Confirm that config.toml is in the user-level .codex directory, then fully restart Codex.',
  'The codex command is not found',
  'Open a new terminal after installation. On Windows, also try codex.cmd --version.',
  'Responses API or streaming error',
  'Keep wire_api set to responses and confirm that the selected model supports the Responses endpoint.',
  'Guide not found',
  'This guide is not available. Return to the documentation home to choose a supported integration.',
  'Back to documentation',
] as const

const catalogKeys = DOC_GUIDES.flatMap((guide) => [
  guide.provider,
  guide.title,
  guide.category,
  guide.description,
  ...guide.protocols,
])
const documentationKeys = [...new Set([...pageKeys, ...catalogKeys])]

async function loadTranslations(locale: 'en' | 'ja') {
  const file = resolve(
    import.meta.dirname,
    `../../../../i18n/locales/${locale}.json`
  )
  return JSON.parse(await readFile(file, 'utf8')).translation as Record<
    string,
    string
  >
}

describe('documentation page localization', () => {
  test('has English and Japanese copy for every page and guide-card key', async () => {
    const en = await loadTranslations('en')
    const ja = await loadTranslations('ja')

    for (const key of documentationKeys) {
      assert.ok(en[key]?.trim(), `English is missing ${key}`)
      assert.ok(ja[key]?.trim(), `Japanese is missing ${key}`)
      assert.doesNotMatch(en[key], /[\u3400-\u9fff]/u, key)
    }
  })

  test('uses Japanese copy for the primary documentation experience', async () => {
    const ja = await loadTranslations('ja')

    for (const key of [
      'Documentation',
      'Build with every model through one gateway',
      'Choose your integration path',
      'Search documentation',
      'View setup guide',
      'Back to documentation',
    ]) {
      assert.match(ja[key], /[\u3040-\u30ff\u3400-\u9fff]/u, key)
    }
  })
})
