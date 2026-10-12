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
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { promotionTranslations } from '@/features/promotion-partner/translations'

import { detectIpLanguage } from './geo-language'
import { applyIpLanguagePreference } from './language-persistence'
import { convertDetectedLanguage, toDocumentLanguage } from './languages'
import en from './locales/en.json'
import ja from './locales/ja.json'
import zhTW from './locales/zh-TW.json'
import zhCN from './locales/zh.json'

function withPromotionTranslations(
  resource: { translation: Record<string, string> },
  translation: Record<string, string>
) {
  return {
    translation: {
      ...translation,
      ...resource.translation,
    },
  }
}

export const resources = {
  en: withPromotionTranslations(en, promotionTranslations.en),
  zhCN: withPromotionTranslations(zhCN, promotionTranslations.zhCN),
  ja: withPromotionTranslations(ja, promotionTranslations.ja),
  zhTW: withPromotionTranslations(zhTW, promotionTranslations.zhTW),
} as const

const syncDocumentLanguage = (language?: string) => {
  if (typeof document === 'undefined') return
  document.documentElement.lang = toDocumentLanguage(language)
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zhCN', 'zhTW', 'ja'],
    load: 'currentOnly',
    nsSeparator: false, // Allow literal colons in keys (e.g., URLs, labels)
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      // Browsers report `zh-CN`/`zh-TW`/`zh`; map them onto our `zhCN`/`zhTW`
      // codes (non-Chinese codes pass through for normal supportedLngs matching).
      convertDetectedLanguage,
    },
  })
  .then(async () => {
    syncDocumentLanguage(i18n.resolvedLanguage || i18n.language)
    await applyIpLanguagePreference({
      detectLanguage: detectIpLanguage,
      getCurrentLanguage: () => i18n.resolvedLanguage || i18n.language,
      changeLanguage: (language) => i18n.changeLanguage(language),
    })
  })

i18n.on('languageChanged', syncDocumentLanguage)

export default i18n
