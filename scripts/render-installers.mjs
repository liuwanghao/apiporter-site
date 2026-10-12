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
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const INSTALLER_ORIGIN_MARKER = '__APIPORTER_ORIGIN__'
const INSTALLER_NAMES = ['codex.sh', 'codex.ps1', 'claude.sh', 'claude.ps1']

function readEnvironmentFile(path) {
  if (!existsSync(path)) return {}

  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=')
        const key = line.slice(0, separator).trim()
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/u, '$2')
        return [key, value]
      })
  )
}

const projectRoot = process.cwd()
const productionEnvironment = readEnvironmentFile(
  join(projectRoot, '.env.production')
)
const configuredApiUrl =
  process.env.VITE_API_BASE_URL ||
  process.env.VITE_REACT_APP_SERVER_URL ||
  productionEnvironment.VITE_API_BASE_URL ||
  productionEnvironment.VITE_REACT_APP_SERVER_URL

if (!configuredApiUrl || configuredApiUrl === 'same-origin') {
  console.log('[installers] keeping the same-origin marker for the web server')
  process.exit(0)
}

if (!/^https?:\/\//iu.test(configuredApiUrl)) {
  throw new Error('VITE_API_BASE_URL must be an http(s) URL')
}

const apiOrigin = configuredApiUrl
  .trim()
  .replace(/\/+$/u, '')
  .replace(/\/v1$/iu, '')
const installDirectory = join(projectRoot, 'dist', 'install')

for (const name of INSTALLER_NAMES) {
  const path = join(installDirectory, name)
  const source = readFileSync(path, 'utf8')
  if (!source.includes(INSTALLER_ORIGIN_MARKER)) {
    throw new Error(`${name} does not contain the installer origin marker`)
  }
  writeFileSync(
    path,
    source.replaceAll(INSTALLER_ORIGIN_MARKER, apiOrigin),
    'utf8'
  )
}

console.log(`[installers] embedded API origin: ${apiOrigin}`)
