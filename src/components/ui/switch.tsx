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
import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

function Switch({
  className,
  size = 'default',
  checkedChildren,
  unCheckedChildren,
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: 'sm' | 'default'
  checkedChildren?: ReactNode
  unCheckedChildren?: ReactNode
}) {
  const labeled =
    checkedChildren !== undefined || unCheckedChildren !== undefined

  return (
    <SwitchPrimitive.Root
      data-slot='switch'
      data-size={size}
      data-labeled={labeled ? 'true' : undefined}
      className={cn(
        'peer group/switch focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 aria-invalid:ring-3 data-disabled:cursor-not-allowed data-disabled:opacity-50',
        labeled
          ? 'h-7 w-16'
          : 'data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px]',
        className
      )}
      {...props}
    >
      {labeled ? (
        <span
          data-slot='switch-labels'
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 text-xs font-medium'
        >
          <span
            data-slot='switch-checked-label'
            className='text-primary-foreground absolute top-1/2 left-2 -translate-y-1/2 opacity-0 transition-opacity group-data-checked/switch:opacity-100'
          >
            {checkedChildren}
          </span>
          <span
            data-slot='switch-unchecked-label'
            className='text-foreground/70 dark:text-foreground/80 absolute top-1/2 right-2 -translate-y-1/2 transition-opacity group-data-checked/switch:opacity-0'
          >
            {unCheckedChildren}
          </span>
        </span>
      ) : null}
      <SwitchPrimitive.Thumb
        data-slot='switch-thumb'
        className={cn(
          'bg-background dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground pointer-events-none block rounded-full ring-0 transition-transform',
          labeled
            ? 'absolute left-1 z-10 size-5 translate-x-0 group-data-checked/switch:translate-x-9'
            : 'group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
