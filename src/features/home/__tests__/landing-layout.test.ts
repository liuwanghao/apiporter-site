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
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { Window } from 'happy-dom'
import { describe, test } from 'vitest'

const landingPage = await readFile(
  resolve(import.meta.dirname, '../../../../public/relay-landing.html'),
  'utf8'
)
const homePage = await readFile(
  resolve(import.meta.dirname, '../index.tsx'),
  'utf8'
)
const routeEffectScript = await readFile(
  resolve(
    import.meta.dirname,
    '../../../../public/cloudbridge-route-effect/cloudbridge-route-effect.js'
  ),
  'utf8'
)
const routeEffectStyles = await readFile(
  resolve(
    import.meta.dirname,
    '../../../../public/cloudbridge-route-effect/cloudbridge-route-effect.css'
  ),
  'utf8'
)
const agreementFiles = [
  'AI服務使用規範_V1.0.pdf',
  '充值服務協議_V1.pdf',
  '第三方模型服務說明_V1.0.pdf',
  '數據安全承諾_V1.0.pdf',
  '隱私政策_V1.0.pdf',
  '用戶協議_V1.0.pdf',
]

const footerTranslations = {
  'zh-CN': {
    aiUsage: 'AI服务使用规范',
    recharge: '充值服务协议',
    thirdParty: '第三方模型服务说明',
    agreement: '用户协议',
    privacy: '隐私政策',
    security: '数据安全承诺',
    contactAria: '联系 ApiPorter 客服',
    contactLabel: 'ApiPorter 客服',
    navigation: '法律与安全信息',
  },
  'zh-TW': {
    aiUsage: 'AI服務使用規範',
    recharge: '充值服務協議',
    thirdParty: '第三方模型服務說明',
    agreement: '用戶協議',
    privacy: '隱私政策',
    security: '數據安全承諾',
    contactAria: '聯絡 ApiPorter 客服',
    contactLabel: 'ApiPorter 客服',
    navigation: '法律與安全資訊',
  },
  en: {
    aiUsage: 'AI Service Usage Guidelines',
    recharge: 'Recharge Service Agreement',
    thirdParty: 'Third-Party Model Service Notice',
    agreement: 'User Agreement',
    privacy: 'Privacy Policy',
    security: 'Data Security Commitment',
    contactAria: 'Contact ApiPorter support',
    contactLabel: 'ApiPorter Support',
    navigation: 'Legal and security information',
  },
  fr: {
    aiUsage: 'Règles d’utilisation des services IA',
    recharge: 'Contrat de service de recharge',
    thirdParty: 'Avis sur les services de modèles tiers',
    agreement: 'Conditions d’utilisation',
    privacy: 'Politique de confidentialité',
    security: 'Engagement de sécurité des données',
    contactAria: 'Contacter l’assistance ApiPorter',
    contactLabel: 'Assistance ApiPorter',
    navigation: 'Informations juridiques et sécurité',
  },
  ru: {
    aiUsage: 'Правила использования сервисов ИИ',
    recharge: 'Соглашение об услугах пополнения',
    thirdParty: 'Уведомление о сторонних моделях',
    agreement: 'Пользовательское соглашение',
    privacy: 'Политика конфиденциальности',
    security: 'Обязательства по безопасности данных',
    contactAria: 'Связаться с поддержкой ApiPorter',
    contactLabel: 'Поддержка ApiPorter',
    navigation: 'Правовая информация и безопасность',
  },
  vi: {
    aiUsage: 'Quy định sử dụng dịch vụ AI',
    recharge: 'Thỏa thuận dịch vụ nạp tiền',
    thirdParty: 'Thông báo dịch vụ mô hình bên thứ ba',
    agreement: 'Thỏa thuận người dùng',
    privacy: 'Chính sách quyền riêng tư',
    security: 'Cam kết bảo mật dữ liệu',
    contactAria: 'Liên hệ bộ phận hỗ trợ ApiPorter',
    contactLabel: 'Hỗ trợ ApiPorter',
    navigation: 'Thông tin pháp lý và bảo mật',
  },
  ja: {
    aiUsage: 'AIサービス利用規約',
    recharge: 'チャージサービス契約',
    thirdParty: '第三者モデルサービスに関する説明',
    agreement: '利用規約',
    privacy: 'プライバシーポリシー',
    security: 'データセキュリティへの取り組み',
    contactAria: 'ApiPorter サポートに連絡',
    contactLabel: 'ApiPorter サポート',
    navigation: '法的情報とセキュリティ',
  },
}

describe('landing page layout', () => {
  test('bundles all six agreement PDFs with the homepage', async () => {
    for (const filename of agreementFiles) {
      const pdf = await readFile(
        resolve(import.meta.dirname, `../../../../public/pfd/${filename}`)
      )
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
    }
  })

  test('uses the app font for the complete hero copy group', () => {
    assert.match(landingPage, /--site-font:\s*'Maple Mono CN'/)
    assert.match(landingPage, /--sans:\s*var\(--site-font\);/)
    assert.match(
      landingPage,
      /\.hero-copy,\s*\.hero-copy \*\s*\{[^}]*font-family:\s*var\(--site-font\);/
    )
    assert.match(landingPage, /class="hero-copy reveal"/)
  })

  test('keeps the trusted landing page same-origin so the app font can load', () => {
    assert.match(
      homePage,
      /oxlint-disable-next-line react\/iframe-missing-sandbox -- Trusted same-origin landing page needs the bundled app font/
    )
    assert.doesNotMatch(homePage, /sandbox=/)
    assert.match(homePage, /window\.location\.origin/)
    assert.match(landingPage, /event\.origin !== window\.location\.origin/)
  })

  test('mounts the Cloudbridge route effect in the homepage routing demo', () => {
    assert.match(
      landingPage,
      /href="\/cloudbridge-route-effect\/cloudbridge-route-effect\.css"/
    )
    assert.match(
      landingPage,
      /id="routeEffect"[\s\S]*data-od-id="request-router-demo"/
    )
    assert.match(
      landingPage,
      /import \{ CloudbridgeRouteEffect \} from '\/cloudbridge-route-effect\/cloudbridge-route-effect\.js'/
    )
    assert.match(
      landingPage,
      /new CloudbridgeRouteEffect\([\s\S]*assetBase: '\/cloudbridge-route-effect\/assets'/
    )
    assert.match(landingPage, /effect\.setTheme\(event\.detail\)/)
    assert.doesNotMatch(landingPage, /relay-language-change/)
    assert.doesNotMatch(routeEffectScript, /setCopy\(/)
    assert.doesNotMatch(landingPage, /class="route-node/)
  })

  test('uses the site-wide font in every route-effect label', () => {
    assert.match(
      routeEffectStyles,
      /--cb-font:\s*var\(--site-font,\s*'Maple Mono CN',\s*monospace\)/
    )
    assert.match(routeEffectStyles, /font:\s*700 10px\/1\.2 var\(--cb-font\)/)
    assert.match(routeEffectStyles, /font:\s*800 8px\/1 var\(--cb-font\)/)
    assert.doesNotMatch(routeEffectStyles, /ui-monospace|SFMono-Regular|Menlo/)
  })

  test('keeps all route-effect labels in English for every site language', () => {
    for (const label of [
      'CLIENT REQUEST / MULTI-MODEL ROUTING',
      'CLIENT REQUEST',
      'UNIFIED ENDPOINT',
      'POST',
      '/v1/chat/completions',
      'INPUT MODALITIES',
      'TEXT',
      'VISION',
      'VOICE',
      'EMBEDDING',
      'CAPABILITIES',
      'REASONING',
      'SEARCH',
      'TOOL CALLING',
    ]) {
      assert.match(routeEffectScript, new RegExp(`>${label}<`))
    }
  })

  test('bundles the six-source and twelve-model route visualization assets', async () => {
    const modelAssets = await readdir(
      resolve(
        import.meta.dirname,
        '../../../../public/cloudbridge-route-effect/assets/models/'
      )
    )

    assert.match(
      routeEffectScript,
      /const SOURCES = \['WEB', 'APP', 'SDK', 'SERVER', 'AGENT', 'WORKFLOW'\]/
    )
    assert.equal(
      modelAssets.filter((asset) => asset.endsWith('.svg')).length,
      12
    )
    for (const asset of modelAssets) {
      assert.match(routeEffectScript, new RegExp(`['"]${asset}['"]`))
    }
    assert.match(routeEffectStyles, /@media \(max-width: 720px\)/)
    assert.match(routeEffectScript, /prefers-reduced-motion: reduce/)
  })

  test('pauses route animation when it is hidden and limits high-cost rendering', () => {
    assert.match(routeEffectScript, /document\.visibilityState !== 'hidden'/)
    assert.match(routeEffectScript, /IntersectionObserver/)
    assert.match(routeEffectScript, /this\.width < 600 \? 72 : 120/)
    assert.match(routeEffectScript, /this\.width < 600 \? 1\.25 : 1\.5/)
    assert.match(
      routeEffectScript,
      /const shadowBlur = particle\.orange \? 9 : 0/
    )
    assert.match(
      routeEffectScript,
      /this\.layoutBounds \|\| this\.stage\.getBoundingClientRect\(\)/
    )
    assert.match(
      routeEffectScript,
      /time === this\.frameTime \? this\.frameGate/
    )
  })

  test('centers the guidance text inside the final call-to-action button', () => {
    assert.match(
      landingPage,
      /\.ghost-inverse\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/
    )
  })

  test('lays out all six legal links as a stable mobile grid', () => {
    const mobileStyles = landingPage.match(
      /@media \(max-width: 820px\) \{([\s\S]*?)@media \(max-width: 560px\)/
    )?.[1]

    assert.ok(mobileStyles)
    assert.match(
      mobileStyles,
      /\.footer-legal-links\s*\{[^}]*width:\s*100%;[^}]*flex:\s*none;[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/
    )
    assert.match(
      mobileStyles,
      /\.footer-legal-links a\s*\{[^}]*min-width:\s*0;[^}]*overflow-wrap:\s*anywhere;/
    )
  })

  for (const [locale, labels] of Object.entries(footerTranslations)) {
    test(`${locale}: localizes footer actions while preserving contact details and document destinations`, async () => {
      const window = new Window({
        url: `https://example.com/relay-landing.html?language=${locale}`,
        settings: {
          enableJavaScriptEvaluation: true,
          disableJavaScriptFileLoading: true,
          disableCSSFileLoading: true,
        },
      })

      try {
        window.document.write(landingPage)
        assert.equal(window.document.documentElement.lang, locale)

        const footer = window.document.querySelector('footer')
        assert.ok(footer)
        assert.equal(footer.closest('[lang]')?.getAttribute('lang'), locale)
        assert.equal(
          footer.querySelector('nav')?.getAttribute('aria-label'),
          labels.navigation
        )
        assert.match(
          footer.querySelector('.footer-brand')?.textContent ?? '',
          /ApiPorter/
        )
        assert.equal(
          footer
            .querySelector('small')
            ?.textContent.replaceAll(/\s+/g, ' ')
            .trim(),
          'Copyright © 2026 ApiPorter. All rights reserved.'
        )

        const contact = footer.querySelector('[data-footer-label="contact"]')
        assert.ok(contact)
        assert.equal(contact.textContent.trim(), labels.contactLabel)
        assert.equal(
          contact.getAttribute('href'),
          'https://csm-cn.cbapi.ai/index.php'
        )
        assert.equal(contact.getAttribute('aria-label'), labels.contactAria)
        assert.match(
          landingPage,
          /\.footer-brand,\s*\.footer-contact,\s*\.footer-legal-links\s*\{[^}]*align-items:\s*center;/
        )

        const legalLinks = [...footer.querySelectorAll('.footer-legal-links a')]
        assert.deepEqual(
          legalLinks.map((link) => ({
            label: link.textContent.trim(),
            href: link.getAttribute('href'),
          })),
          [
            {
              label: labels.aiUsage,
              href: '/pfd/AI服務使用規範_V1.0.pdf',
            },
            {
              label: labels.recharge,
              href: '/pfd/充值服務協議_V1.pdf',
            },
            {
              label: labels.thirdParty,
              href: '/pfd/第三方模型服務說明_V1.0.pdf',
            },
            {
              label: labels.security,
              href: '/pfd/數據安全承諾_V1.0.pdf',
            },
            {
              label: labels.privacy,
              href: '/pfd/隱私政策_V1.0.pdf',
            },
            {
              label: labels.agreement,
              href: '/pfd/用戶協議_V1.0.pdf',
            },
          ]
        )
        for (const link of legalLinks) {
          assert.equal(link.getAttribute('target'), '_blank')
          assert.deepEqual(link.getAttribute('rel')?.split(/\s+/).sort(), [
            'noopener',
            'noreferrer',
          ])
        }
        for (const link of footer.querySelectorAll('a')) {
          const destination = new URL(
            link.getAttribute('href') ?? '',
            window.location.href
          )
          assert.notEqual(destination.pathname, '/about')
          assert.notEqual(destination.href, 'mailto:support@cbapi.ai')
        }
        assert.doesNotMatch(
          footer.textContent,
          /Build AI that ships\.|support@cbapi\.ai/
        )
      } finally {
        await window.happyDOM.close()
      }
    })
  }

  test('updates homepage and footer actions when the parent switches language', async () => {
    const window = new Window({
      url: 'https://example.com/relay-landing.html?language=zh-TW',
      settings: {
        enableJavaScriptEvaluation: true,
        disableJavaScriptFileLoading: true,
        disableCSSFileLoading: true,
      },
    })

    try {
      window.document.write(landingPage)
      const footer = window.document.querySelector('footer')
      assert.ok(footer)
      const translations = JSON.parse(
        window.document.querySelector('#landing-translations')?.textContent ??
          '{}'
      ) as Record<string, Record<string, string>>
      for (const [locale, labels] of Object.entries(footerTranslations)) {
        window.dispatchEvent(
          new window.MessageEvent('message', {
            origin: window.location.origin,
            // Match the Window identity used by the page's script context.
            source: window.eval('window.parent'),
            data: { type: 'relay-theme', language: locale, theme: 'light' },
          })
        )

        assert.equal(window.document.documentElement.lang, locale)
        for (const key of ['final.cta', 'code.copy', 'models.filterAll']) {
          assert.equal(
            window.document.querySelector(`[data-i18n="${key}"]`)?.textContent,
            translations[locale][key]
          )
        }
        assert.equal(
          window.document.querySelector('[data-i18n-html="hero.primaryCta"]')
            ?.textContent,
          translations[locale]['hero.primaryCta'].replaceAll(/<[^>]+>/g, '')
        )
        assert.equal(
          footer.querySelector('[data-footer-label="user-agreement"]')
            ?.textContent,
          labels.agreement
        )
        assert.equal(
          footer.querySelector('[data-footer-label="data-security"]')
            ?.textContent,
          labels.security
        )
        assert.equal(
          footer
            .querySelector('[data-footer-label="contact"]')
            ?.getAttribute('aria-label'),
          labels.contactAria
        )
      }
    } finally {
      await window.happyDOM.close()
    }
  })

  test('provides complete copy for every supported landing-page language', () => {
    const translationsMatch = landingPage.match(
      /<script id="landing-translations" type="application\/json">([\s\S]*?)<\/script>/
    )
    assert.ok(translationsMatch)

    const translations = JSON.parse(translationsMatch[1]) as Record<
      string,
      Record<string, string>
    >
    const copyKeys = new Set(
      [
        ...landingPage.matchAll(/data-i18n(?:-html|-route|-aria)?="([^"]+)"/g),
      ].map((match) => match[1])
    )

    assert.ok(copyKeys.size >= 45)
    for (const locale of Object.keys(footerTranslations)) {
      assert.ok(translations[locale], `missing ${locale} translations`)
      for (const key of copyKeys) {
        assert.ok(
          translations[locale][key],
          `missing ${locale} translation for ${key}`
        )
      }
    }
  })

  test('boots the iframe from the persisted app language after a refresh', () => {
    assert.match(
      homePage,
      /`\/relay-landing\.html\?language=\$\{landingLanguage\}`/
    )
    assert.match(
      landingPage,
      /new URLSearchParams\([\s\S]*?window\.location\.search[\s\S]*?\)\.get\('language'\)/
    )
    assert.match(
      landingPage,
      /let activeLandingLanguage = supportedLandingLanguages\.includes\([\s\S]*?requestedLandingLanguage/
    )
  })
})
