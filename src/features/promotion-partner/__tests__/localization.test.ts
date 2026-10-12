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
import { describe, test } from 'node:test'

import type { TFunction } from 'i18next'

import { toIntlLocale } from '../../../i18n/languages.ts'
import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
} from '../../../stores/system-config-store.ts'
import { promotionTranslations } from '../translations.ts'
import {
  commissionDisplayAmountToUnits,
  commissionUnitsToDisplayAmount,
  formatDate,
  formatCommissionAmount,
  formatCommissionInputAmount,
  formatFen,
  referralTypeLabel,
  statusLabel,
} from '../utils.ts'

const zh = ((key: string) =>
  promotionTranslations.zhCN[key as keyof typeof promotionTranslations.zhCN] ??
  key) as unknown as TFunction

const ja = ((key: string) =>
  promotionTranslations.ja[key as keyof typeof promotionTranslations.ja] ??
  key) as unknown as TFunction

describe('promotion localization', () => {
  test('Chinese resources translate navigation and workflow states', () => {
    assert.equal(promotionTranslations.zhCN['Promotion Partner'], '推广伙伴')
    assert.equal(
      promotionTranslations.zhCN['Promotion Partner Plan'],
      '推广伙伴计划'
    )
    assert.equal(promotionTranslations.zhCN.On, '开启')
    assert.equal(promotionTranslations.zhCN.Off, '关闭')
    assert.equal(promotionTranslations.zhCN.Promotion, '推广')
    assert.equal(promotionTranslations.zhCN.Approved, '已通过')
    assert.equal(promotionTranslations.zhCN['Rejection reason'], '拒绝理由')
    assert.equal(promotionTranslations.zhCN['Partner status'], '伙伴状态')
    assert.equal(promotionTranslations.zhCN['Earnings overview'], '收益概览')
    assert.equal(
      promotionTranslations.zhCN['Consumption commission settings'],
      '消费佣金设置'
    )
    assert.equal(promotionTranslations.zhCN['How to join'], '如何加入')
    assert.equal(promotionTranslations.zhCN['Contact email'], '联系邮箱')
    assert.equal(promotionTranslations.zhCN['Confirmation period'], '确认周期')
    assert.equal(promotionTranslations.zhCN['Setting item'], '设置项')
    assert.equal(promotionTranslations.zhCN['Before change'], '修改前')
    assert.equal(promotionTranslations.zhCN['After change'], '修改后')
    assert.equal(
      promotionTranslations.zhCN['Enter an email address you check regularly.'],
      '填写您经常查看的邮箱。'
    )
    assert.equal(
      promotionTranslations.zhCN['All applications are reviewed manually.'],
      '所有申请均由人工审核。'
    )
    assert.equal(
      promotionTranslations.zhCN[
        'No confirmed commission entries are available for the selected user and period.'
      ],
      '所选用户和时间段内没有可结算的已确认佣金明细。'
    )
    assert.equal(promotionTranslations.zhTW['Promotion Partner'], '推廣夥伴')
    assert.equal(promotionTranslations.zhTW['Select a user'], '選擇使用者')
    assert.equal(referralTypeLabel('aff', zh), '好友邀请')
    assert.equal(referralTypeLabel('ref', zh), '推广伙伴')
  })

  test('Japanese resources translate navigation and workflow states', () => {
    assert.equal(
      promotionTranslations.ja['Promotion Partner'],
      'プロモーションパートナー'
    )
    assert.equal(promotionTranslations.ja.Promotion, 'プロモーション')
    assert.equal(promotionTranslations.ja.Approved, '承認済み')
    assert.equal(
      promotionTranslations.ja['Application status'],
      '申請ステータス'
    )
    assert.equal(promotionTranslations.ja['Search users'], 'ユーザーを検索')
    assert.equal(promotionTranslations.ja['Monthly settlement'], '月次精算')
    assert.equal(
      promotionTranslations.ja['Promotion performance'],
      'プロモーション実績'
    )
    assert.equal(promotionTranslations.ja['Pay settlement action'], '支払う')
    assert.equal(referralTypeLabel('aff', ja), '友達招待')
    assert.equal(referralTypeLabel('ref', ja), 'プロモーションパートナー')
  })

  test('currency formatting follows the selected interface language', () => {
    const zhCN = toIntlLocale('zhCN')
    const en = toIntlLocale('en-US')
    const ja = toIntlLocale('ja')

    assert.equal(formatFen(123_456, zhCN), '¥1,234.56')
    assert.equal(formatFen(123_456, en), 'CN¥1,234.56')
    assert.equal(formatFen(123_456, ja), '元 1,234.56')
  })

  test('commission formatting follows the system currency display mode', () => {
    const store = useSystemConfigStore.getState()
    const originalCurrency = store.config.currency
    const locale = toIntlLocale('en-US')

    try {
      store.setConfig({
        currency: {
          ...DEFAULT_CURRENCY_CONFIG,
          quotaDisplayType: 'USD',
          usdExchangeRate: 7.3,
        },
      })
      assert.match(formatCommissionAmount(1_000_000, locale), /\$1(?:\.00)?/)

      store.setConfig({
        currency: {
          ...DEFAULT_CURRENCY_CONFIG,
          quotaDisplayType: 'CNY',
          usdExchangeRate: 7.3,
        },
      })
      assert.match(formatCommissionAmount(1_000_000, locale), /7\.3/)
    } finally {
      store.setConfig({ currency: originalCurrency })
    }
  })

  test('commission setting inputs follow the system currency display mode', () => {
    const store = useSystemConfigStore.getState()
    const originalCurrency = store.config.currency

    try {
      store.setConfig({
        currency: {
          ...DEFAULT_CURRENCY_CONFIG,
          quotaDisplayType: 'USD',
          usdExchangeRate: 7.3,
        },
      })
      assert.ok(Math.abs(commissionUnitsToDisplayAmount(1_000_000) - 1) < 1e-9)
      assert.equal(commissionDisplayAmountToUnits('1'), 1_000_000)
      assert.equal(formatCommissionInputAmount(5_000), '0.005')
      assert.equal(commissionDisplayAmountToUnits('0.005'), 5_000)

      store.setConfig({
        currency: {
          ...DEFAULT_CURRENCY_CONFIG,
          quotaDisplayType: 'CNY',
          usdExchangeRate: 7.3,
        },
      })
      assert.ok(
        Math.abs(commissionUnitsToDisplayAmount(1_000_000) - 7.3) < 1e-9
      )
      assert.equal(commissionDisplayAmountToUnits('7.3'), 1_000_000)
      assert.equal(formatCommissionInputAmount(5_000), '0.0365')
    } finally {
      store.setConfig({ currency: originalCurrency })
    }
  })

  test('date formatting follows the selected interface language', () => {
    const timestamp = Date.UTC(2024, 0, 2, 12, 34) / 1000

    assert.equal(formatDate(timestamp, toIntlLocale('zhCN')), '2024/01/02')
    assert.equal(formatDate(timestamp, toIntlLocale('en-US')), '01/02/2024')
    assert.equal(formatDate(timestamp, toIntlLocale('ja')), '2024/01/02')
  })

  test('commission status enums use localized labels with unknown fallback', () => {
    assert.equal(statusLabel('CONFIRMED', zh), '已确认')
    assert.equal(statusLabel('FUTURE_STATUS', zh), 'FUTURE_STATUS')
  })
})
