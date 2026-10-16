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
import { z } from 'zod'

export interface AlipayOfficialValues {
  enabled: boolean
  sandbox: boolean
  app_id: string
  seller_id: string
  private_key: string
  public_key: string
  callback_url: string
  price: number
  min_topup: number
}

export const DEFAULT_ALIPAY_OFFICIAL_VALUES: AlipayOfficialValues = {
  enabled: false,
  sandbox: false,
  app_id: '',
  seller_id: '',
  private_key: '',
  public_key: '',
  callback_url: '',
  price: 7.3,
  min_topup: 1,
}

export function createAlipayOfficialSchema(
  t: (key: string) => string,
  privateKeyConfigured: boolean,
  complianceConfirmed: boolean,
  serverAddress = ''
) {
  return z
    .object({
      enabled: z.boolean(),
      sandbox: z.boolean(),
      app_id: z.string().trim(),
      seller_id: z.string().trim(),
      private_key: z.string().trim(),
      public_key: z.string().trim(),
      callback_url: z.string().trim(),
      price: z.coerce
        .number()
        .finite()
        .positive(t('alipayOfficial.invalidPrice'))
        .max(1000000, t('alipayOfficial.invalidPrice')),
      min_topup: z.coerce
        .number()
        .int(t('alipayOfficial.invalidMinTopup'))
        .min(1, t('alipayOfficial.invalidMinTopup'))
        .max(4000, t('alipayOfficial.invalidMinTopup')),
    })
    .superRefine((values, ctx) => {
      if (values.enabled && !complianceConfirmed) {
        ctx.addIssue({
          code: 'custom',
          path: ['enabled'],
          message: t('alipayOfficial.complianceRequired'),
        })
      }
      for (const field of ['app_id', 'seller_id'] as const) {
        if (values[field] && !/^\d{16}$/.test(values[field])) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: t('alipayOfficial.invalidId'),
          })
        }
      }
      const callbackOrigin = values.callback_url || serverAddress.trim()
      if (values.callback_url || values.enabled) {
        try {
          const url = new URL(callbackOrigin)
          if (
            (url.protocol !== 'https:' &&
              !(values.sandbox && url.protocol === 'http:')) ||
            url.username ||
            url.password ||
            url.pathname !== '/' ||
            url.search ||
            url.hash
          ) {
            throw new Error('Invalid callback origin')
          }
        } catch {
          ctx.addIssue({
            code: 'custom',
            path: ['callback_url'],
            message: t('alipayOfficial.invalidOrigin'),
          })
        }
      }
      if (!values.enabled) return
      for (const field of ['app_id', 'public_key'] as const) {
        if (!values[field]) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: t('alipayOfficial.required'),
          })
        }
      }
      if (!values.private_key && !privateKeyConfigured) {
        ctx.addIssue({
          code: 'custom',
          path: ['private_key'],
          message: t('alipayOfficial.required'),
        })
      }
    })
}
