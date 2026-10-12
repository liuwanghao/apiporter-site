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

export const CODEX_EXAMPLE_MODEL = 'gpt-5.6-sol'

export function resolveCodexApiBaseUrl(browserOrigin: string): string {
  const normalizedOrigin = browserOrigin
    .replace(/\/+$/, '')
    .replace(/\/v1$/i, '')

  return `${normalizedOrigin}/v1`
}

export function buildCodexConfig(apiBaseUrl: string): string {
  return `model_provider = "apiporter"
model = "${CODEX_EXAMPLE_MODEL}"
model_reasoning_effort = "high"

[model_providers.apiporter]
name = "CBAPI"
base_url = "${apiBaseUrl}"
env_key = "APIPORTER_API_KEY"
wire_api = "responses"`
}
