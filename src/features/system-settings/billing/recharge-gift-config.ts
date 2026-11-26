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

export const MAX_GIFT_TIERS = 100
const MAX_TIER_AMOUNT = 100_000_000

export const rechargeGiftTiersSchema = z
  .object({
    tiers: z.array(
      z.object({
        amount: z
          .string()
          .regex(/^[1-9]\d*$/, {
            error: 'billing.rechargeGift.invalidRecharge',
          })
          .refine(
            (value) => Number(value) >= 5 && Number(value) <= MAX_TIER_AMOUNT,
            { error: 'billing.rechargeGift.invalidRecharge' }
          ),
        gift: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, {
            error: 'billing.rechargeGift.invalidGift',
          })
          .refine((value) => Number(value) <= MAX_TIER_AMOUNT, {
            error: 'billing.rechargeGift.invalidGift',
          }),
      })
    ),
  })
  .superRefine((values, ctx) => {
    const amounts = new Set<string>()
    values.tiers.forEach((tier, index) => {
      if (amounts.has(tier.amount)) {
        ctx.addIssue({
          code: 'custom',
          path: ['tiers', index, 'amount'],
          message: 'billing.rechargeGift.duplicate',
        })
      }
      amounts.add(tier.amount)
    })
  })

export type RechargeGiftTierValues = z.infer<typeof rechargeGiftTiersSchema>

export function readRechargeGiftTiers(value: string): RechargeGiftTierValues {
  const parsed: unknown = JSON.parse(value)
  const tiers = z.record(z.string(), z.number()).parse(parsed)

  return {
    tiers: Object.entries(tiers).map(([amount, gift]) => ({
      amount,
      gift: String(gift),
    })),
  }
}
