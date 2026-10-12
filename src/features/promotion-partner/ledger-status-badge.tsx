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

For commercial licensing, please contact support@quantumnous.com
*/
import { Badge } from '@/components/ui/badge'

import { statusBadgeVariant } from './utils'

const confirmedStatusClassName =
  'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400'

export function LedgerStatusBadge({
  status,
  label,
}: {
  status: string
  label: string
}) {
  return (
    <Badge
      variant={statusBadgeVariant(status)}
      className={status === 'CONFIRMED' ? confirmedStatusClassName : undefined}
    >
      {label}
    </Badge>
  )
}
