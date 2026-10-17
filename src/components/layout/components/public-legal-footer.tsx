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
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const CUSTOMER_SERVICE_URL = 'https://csm-cn.cbapi.ai/index.php'

const LEGAL_LINKS = [
  {
    key: 'ai-service-usage',
    translation: 'footer.aiUsageGuidelines',
    href: '/pfd/AI服務使用規範_V1.0.pdf',
  },
  {
    key: 'recharge-service',
    translation: 'footer.rechargeAgreement',
    href: '/pfd/充值服務協議_V1.pdf',
  },
  {
    key: 'third-party-model',
    translation: 'footer.thirdPartyModelNotice',
    href: '/pfd/第三方模型服務說明_V1.0.pdf',
  },
  {
    key: 'data-security',
    translation: 'footer.security',
    href: '/pfd/數據安全承諾_V1.0.pdf',
  },
  {
    key: 'privacy',
    translation: 'footer.privacy',
    href: '/pfd/隱私政策_V1.0.pdf',
  },
  {
    key: 'user-agreement',
    translation: 'footer.agreement',
    href: '/pfd/用戶協議_V1.0.pdf',
  },
] as const

export function PublicLegalFooter() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className='bg-background text-muted-foreground relative z-10'>
      <div className='mx-auto w-[calc(100%-48px)] max-w-[1480px] max-[560px]:w-[calc(100%-24px)] max-[560px]:max-w-[520px]'>
        <div className='border-border/40 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t py-8 text-xs leading-relaxed max-[820px]:flex-col max-[820px]:items-start max-[820px]:gap-3 max-[820px]:py-[26px]'>
          <div className='flex min-w-0 items-center gap-3'>
            <img
              className='size-[38px] shrink-0 object-contain'
              src='/brand/apiporter-logo.png'
              alt=''
              aria-hidden='true'
            />
            <div>
              <p className='text-foreground m-0 text-sm font-bold'>ApiPorter</p>
              <a
                href={CUSTOMER_SERVICE_URL}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={t('footer.contactAria')}
                data-footer-label='contact'
                className='text-muted-foreground hover:text-foreground inline-flex min-h-11 w-fit items-center gap-2 transition-colors duration-200'
              >
                <Mail className='size-3.5' aria-hidden='true' />
                <span>{t('footer.contact')}</span>
              </a>
            </div>
          </div>
          <nav
            aria-label={t('footer.aria')}
            className='flex min-w-0 flex-[1_1_560px] flex-wrap justify-end gap-x-6 gap-y-1 pe-[76px] max-[820px]:grid max-[820px]:w-full max-[820px]:flex-none max-[820px]:grid-cols-2 max-[820px]:justify-start max-[820px]:gap-x-4 max-[820px]:gap-y-0 max-[820px]:pe-0'
          >
            {LEGAL_LINKS.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center transition-colors duration-200 max-[820px]:min-w-0 max-[820px]:py-1.5'
              >
                {t(link.translation)}
              </a>
            ))}
          </nav>
        </div>
      </div>
      <div className='border-border border-t px-6 py-5 text-center max-[820px]:pb-[calc(88px+env(safe-area-inset-bottom))]'>
        <small className='mx-auto block w-full max-w-[1480px] text-[11px] leading-[1.8] [overflow-wrap:anywhere]'>
          Copyright © {currentYear} ApiPorter. All rights reserved.
        </small>
      </div>
    </footer>
  )
}
