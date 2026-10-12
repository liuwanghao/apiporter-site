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
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface LegalConsentProps {
  checked: boolean
  onCheckedChange: (nextValue: boolean) => void
  className?: string
}

export function LegalConsent({
  checked,
  onCheckedChange,
  className,
}: LegalConsentProps) {
  const { t } = useTranslation()

  const handleChange = (value: boolean) => {
    onCheckedChange(value === true)
  }

  return (
    <div
      className={cn(
        'border-border/60 bg-muted/40 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 rounded-md border p-3 sm:gap-x-3',
        className
      )}
    >
      <Checkbox
        id='legal-consent'
        checked={checked}
        onCheckedChange={handleChange}
        aria-required='true'
        aria-describedby='legal-consent-description'
        className='mt-0.5 shrink-0'
      />
      <p
        id='legal-consent-description'
        className='text-muted-foreground min-w-0 text-left text-xs leading-5 font-normal [overflow-wrap:anywhere]'
      >
        <Label
          htmlFor='legal-consent'
          className='inline cursor-pointer text-xs leading-5 font-normal'
        >
          {t('I have read and agree to the')}{' '}
        </Label>
        <a
          href='/pfd/用戶協議_V1.0.pdf'
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary focus-visible:ring-ring rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
        >
          {t('User Agreement')}
        </a>{' '}
        {t('and')}{' '}
        <a
          href='/pfd/隱私政策_V1.0.pdf'
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary focus-visible:ring-ring rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
        >
          {t('Privacy Policy')}
        </a>
        .
      </p>
    </div>
  )
}
