import { useTranslation } from 'react-i18next'

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
import { PublicLayout } from '@/components/layout'
import { PublicLegalFooter } from '@/components/layout/components/public-legal-footer'
import { PageTransition } from '@/components/page-transition'

const principles = [
  {
    index: '01',
    eyebrow: 'INNOVATION',
    titleKey: 'aboutPage.values.innovation.title',
    descriptionKey: 'aboutPage.values.innovation.description',
  },
  {
    index: '02',
    eyebrow: 'RELIABILITY',
    titleKey: 'aboutPage.values.reliability.title',
    descriptionKey: 'aboutPage.values.reliability.description',
  },
  {
    index: '03',
    eyebrow: 'CUSTOMER',
    titleKey: 'aboutPage.values.customer.title',
    descriptionKey: 'aboutPage.values.customer.description',
  },
]

export function About() {
  const { t } = useTranslation()

  return (
    <PublicLayout gradientBackground showMainContainer={false}>
      <PageTransition className='relative mx-auto w-full max-w-[1492px] px-4 pt-28 pb-20 sm:pt-32 sm:pb-24 xl:pt-36 xl:pb-28'>
        <header className='relative overflow-hidden border-b border-[var(--console-line)] pb-16 sm:pb-20 lg:pb-24'>
          <div
            className='pointer-events-none absolute -top-12 -right-28 size-80 rounded-full border-[44px] border-[color-mix(in_srgb,var(--console-brand)_7%,transparent)] sm:size-[430px] sm:border-[62px]'
            aria-hidden='true'
          />

          <div className='relative max-w-4xl'>
            <p className='mb-7 inline-flex rounded-full border border-[color-mix(in_srgb,var(--console-brand)_24%,var(--console-line))] bg-[color-mix(in_srgb,var(--console-surface)_72%,transparent)] px-3.5 py-1.5 text-[11px] font-bold tracking-[0.12em] text-[var(--console-brand)] uppercase sm:mb-9'>
              {t('aboutPage.eyebrow')}
            </p>
            <h1 className='public-page-title max-w-3xl font-bold text-balance'>
              {t('aboutPage.hero.titleLead')}
              <br />
              <span className='text-[var(--console-brand)]'>
                {t('aboutPage.hero.titleHighlight')}
              </span>
            </h1>
            <p className='public-page-lead mt-7 max-w-3xl text-[var(--console-muted)] sm:mt-8'>
              {t('aboutPage.hero.description')}
              <br className='hidden sm:block' />
              {t('aboutPage.hero.descriptionLine2')}
            </p>
          </div>
        </header>

        <section
          className='grid gap-10 border-b border-[var(--console-line)] py-16 sm:py-20 lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.55fr)] lg:gap-20 lg:py-24'
          aria-labelledby='about-company-title'
        >
          <div>
            <p className='text-[12px] font-bold tracking-[0.12em] text-[var(--console-brand)]'>
              {t('aboutPage.company.eyebrow')}
            </p>
            <h2
              id='about-company-title'
              className='public-section-title mt-4 font-bold'
            >
              {t('aboutPage.company.title')}
            </h2>
          </div>

          <div className='public-page-lead space-y-6 text-[var(--console-muted)]'>
            <p>
              <strong className='font-bold text-[var(--console-ink)]'>
                ApiPorter
              </strong>{' '}
              {t('aboutPage.company.description1')}
            </p>
            <p>{t('aboutPage.company.description2')}</p>
            <p>{t('aboutPage.company.description3')}</p>
            <p>{t('aboutPage.company.description4')}</p>
          </div>
        </section>

        <section
          className='border-b border-[var(--console-line)] py-16 sm:py-20 lg:py-24'
          aria-labelledby='about-values-title'
        >
          <p className='text-[12px] font-bold tracking-[0.12em] text-[var(--console-brand)]'>
            {t('aboutPage.values.eyebrow')}
          </p>
          <h2
            id='about-values-title'
            className='public-section-title mt-4 max-w-3xl font-bold'
          >
            {t('aboutPage.values.title')}
          </h2>

          <div className='mt-10 grid gap-4 sm:mt-12 md:grid-cols-3'>
            {principles.map((principle) => (
              <article
                key={principle.index}
                className='group rounded-2xl border border-[var(--console-line)] bg-[color-mix(in_srgb,var(--console-surface)_82%,transparent)] p-6 shadow-[var(--console-panel-shadow)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--console-brand)_34%,var(--console-line))] hover:shadow-[var(--console-panel-shadow-hover)] sm:p-7'
              >
                <p className='text-[11px] font-bold tracking-[0.1em] text-[var(--console-brand)]'>
                  {principle.index} / {principle.eyebrow}
                </p>
                <h3 className='mt-10 text-xl font-bold text-[var(--console-ink)] sm:mt-12 sm:text-2xl'>
                  {t(principle.titleKey)}
                </h3>
                <p className='mt-4 text-sm leading-7 text-[var(--console-muted)] sm:text-base'>
                  {t(principle.descriptionKey)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className='pt-16 sm:pt-20 lg:pt-24'
          aria-labelledby='about-support-title'
        >
          <div className='rounded-3xl border border-[var(--console-line)] bg-[color-mix(in_srgb,var(--console-surface)_82%,transparent)] p-6 shadow-[var(--console-panel-shadow)] sm:p-9 lg:p-12'>
            <p className='text-[12px] font-bold tracking-[0.12em] text-[var(--console-brand)]'>
              CUSTOMER SUPPORT
            </p>
            <h2
              id='about-support-title'
              className='public-section-title mt-4 max-w-3xl font-bold'
            >
              {t('aboutPage.support.title')}
            </h2>

            <div className='mt-10 grid border-t border-[var(--console-line)] sm:mt-12 md:grid-cols-2'>
              <div className='border-b border-[var(--console-line)] py-8 md:border-r md:border-b-0 md:pr-10'>
                <h3 className='text-lg font-bold text-[var(--console-ink)]'>
                  {t('aboutPage.support.customerService.title')}
                </h3>
                <p className='mt-3 max-w-lg text-sm leading-7 text-[var(--console-muted)] sm:text-base'>
                  {t('aboutPage.support.customerService.description')}
                </p>
                <a
                  href='https://csm-cn.cbapi.ai/index.php'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mt-6 inline-flex min-h-10 items-center font-bold text-[var(--console-brand)] transition-transform hover:translate-x-1'
                >
                  {t('aboutPage.support.customerService.link')} →
                </a>
              </div>

              <div className='py-8 md:pl-10'>
                <h3 className='text-lg font-bold text-[var(--console-ink)]'>
                  {t('aboutPage.support.business.title')}
                </h3>
                <p className='mt-3 max-w-lg text-sm leading-7 text-[var(--console-muted)] sm:text-base'>
                  {t('aboutPage.support.business.description')}
                </p>
                <a
                  href='https://csm-cn.cbapi.ai/index.php'
                  className='mt-6 inline-flex min-h-10 items-center font-bold text-[var(--console-brand)] transition-transform hover:translate-x-1'
                >
                  {t('Customer service center')} →
                </a>
              </div>
            </div>

            <p className='border-t border-[var(--console-line)] pt-6 text-xs leading-6 text-[var(--console-faint)] sm:text-sm'>
              {t('aboutPage.support.securityNotice')}
            </p>
          </div>
        </section>
      </PageTransition>
      <PublicLegalFooter />
    </PublicLayout>
  )
}
