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

const configuredServerUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_REACT_APP_SERVER_URL ||
  ''

/** Backend origin used by both Axios and streaming fetch requests. */
export const API_BASE_URL = configuredServerUrl.trim().replace(/\/+$/, '')

export function apiUrl(path: string): string {
  if (!API_BASE_URL) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
