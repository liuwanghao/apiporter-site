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
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const installerUrl = (name: string) =>
  new URL(`../../../../../public/install/${name}`, import.meta.url)
const readInstaller = (name: string) => readFileSync(installerUrl(name), 'utf8')

const installers = {
  'codex.sh': readInstaller('codex.sh'),
  'codex.ps1': readInstaller('codex.ps1'),
  'claude.sh': readInstaller('claude.sh'),
  'claude.ps1': readInstaller('claude.ps1'),
}

test('installer scripts contain only ApiPorter branding and variables', () => {
  for (const [name, source] of Object.entries(installers)) {
    assert.match(source, /ApiPorter/iu, name)
    assert.match(source, /APIPORTER_BASE_URL/u, name)
    assert.match(source, /APIPORTER_LANG/u, name)
    assert.match(source, /__APIPORTER_ORIGIN__/u, name)
    assert.match(source, /http:\/\/localhost:5180/u, name)
    assert.doesNotMatch(source, /modelflare/iu, name)
  }
})

test('Codex installers back up files, install the CLI, and validate its model', () => {
  for (const name of ['codex.sh', 'codex.ps1'] as const) {
    const source = installers[name]
    assert.match(source, /chatgpt\.com\/codex\/install\.(?:sh|ps1)/u, name)
    assert.match(source, /@openai\/codex@latest/u, name)
    assert.match(source, /backup/iu, name)
    assert.match(source, /auth_mode/u, name)
    assert.match(source, /requires_openai_auth/u, name)
    assert.match(source, /gpt-5\.6-sol/u, name)
    assert.match(source, /\/models/u, name)
  }
})

test('Claude installers preserve settings and validate both configured models', () => {
  for (const name of ['claude.sh', 'claude.ps1'] as const) {
    const source = installers[name]
    assert.match(source, /claude\.ai\/install\.(?:sh|ps1)/u, name)
    assert.match(source, /backup/iu, name)
    assert.match(source, /ANTHROPIC_BASE_URL/u, name)
    assert.match(source, /ANTHROPIC_AUTH_TOKEN/u, name)
    assert.match(source, /claude-opus-4-8/u, name)
    assert.match(source, /claude-sonnet-5/u, name)
    assert.match(source, /\/v1\/models/u, name)
  }

  assert.match(installers['claude.sh'], /json\.load/u)
  assert.match(installers['claude.sh'], /JSON\.parse/u)
  assert.match(installers['claude.ps1'], /ConvertFrom-Json/u)
})

test('shell installers are valid POSIX shell syntax', () => {
  for (const name of ['codex.sh', 'claude.sh']) {
    execFileSync('sh', ['-n', fileURLToPath(installerUrl(name))])
  }
})
