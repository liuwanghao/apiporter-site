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
const decimalAmount = /^\d+(\.\d{1,2})?$/

const rechargeAmount = z
  .string()
  .regex(decimalAmount, { error: 'billing.rechargeGift.invalidRecharge' })
  .refine((value) => Number(value) >= 5 && Number(value) <= MAX_TIER_AMOUNT, {
    error: 'billing.rechargeGift.invalidRecharge',
  })

export const rechargeGiftTiersSchema = z
  .object({
    tiers: z.array(
      z.object({
        min: rechargeAmount,
        max: rechargeAmount,
        gift: z
          .string()
          .regex(decimalAmount, { error: 'billing.rechargeGift.invalidGift' })
          .refine((value) => Number(value) <= MAX_TIER_AMOUNT, {
            error: 'billing.rechargeGift.invalidGift',
          }),
      })
    ),
    percentageEnabled: z.boolean(),
    percentage: z.object({ above: z.string(), rate: z.string() }),
  })
  .superRefine((values, ctx) => {
    if (values.percentageEnabled) {
      for (const name of ['above', 'rate'] as const) {
        const value = values.percentage[name]
        const amount = Number(value)
        const valid =
          name === 'above'
            ? amount >= 5 && amount < MAX_TIER_AMOUNT
            : amount > 0 && amount <= 100
        if (!decimalAmount.test(value) || !valid) {
          ctx.addIssue({
            code: 'custom',
            path: ['percentage', name],
            message:
              name === 'above'
                ? 'billing.rechargeGift.invalidPercentageAbove'
                : 'billing.rechargeGift.invalidPercentageRate',
          })
        }
      }
    }

    const sorted = values.tiers
      .map(({ min, max }, index) => ({
        index,
        min: Number(min),
        max: Number(max),
      }))
      .sort((a, b) => a.min - b.min)

    let highestMax = -Infinity
    for (const { index, min, max } of sorted) {
      if (min > max) {
        ctx.addIssue({
          code: 'custom',
          path: ['tiers', index, 'max'],
          message: 'billing.rechargeGift.invalidRange',
        })
        continue
      }
      if (min <= highestMax) {
        ctx.addIssue({
          code: 'custom',
          path: ['tiers', index, 'min'],
          message: 'billing.rechargeGift.overlap',
        })
      }
      if (max > highestMax) highestMax = max
    }
  })

export type RechargeGiftTierValues = z.infer<typeof rechargeGiftTiersSchema>

const storedDecimal = z
  .union([z.number(), z.string().trim().min(1)])
  .transform(Number)
  .pipe(z.number())

const storedGiftRanges = z.array(
  z.object({ min: storedDecimal, max: storedDecimal, gift: storedDecimal })
)

const storedGiftSchedule = z.object({
  tiers: storedGiftRanges,
  percentage: z.object({ above: storedDecimal, rate: storedDecimal }),
})

export function readRechargeGiftTiers(value: string): RechargeGiftTierValues {
  const parsed: unknown = JSON.parse(value)
  const schedule = storedGiftSchedule.safeParse(parsed)
  let ranges = schedule.data?.tiers
  if (!ranges) {
    ranges = Array.isArray(parsed)
      ? storedGiftRanges.parse(parsed)
      : Object.entries(z.record(z.string(), storedDecimal).parse(parsed)).map(
          ([amount, gift]) => ({
            min: Number(amount),
            max: Number(amount),
            gift,
          })
        )
  }
  const percentage = schedule.data?.percentage

  return rechargeGiftTiersSchema.parse({
    tiers: ranges.map(({ min, max, gift }) => ({
      min: String(min),
      max: String(max),
      gift: String(gift),
    })),
    percentageEnabled: !!percentage,
    percentage: {
      above: String(percentage?.above ?? 500),
      rate: String(percentage?.rate ?? 10),
    },
  })
}

export function writeRechargeGiftTiers(values: RechargeGiftTierValues): string {
  const tiers = values.tiers.map(({ min, max, gift }) => ({
    min: Number(min),
    max: Number(max),
    gift: Number(gift),
  }))
  if (!values.percentageEnabled) return JSON.stringify(tiers)

  return JSON.stringify({
    tiers,
    percentage: {
      above: Number(values.percentage.above),
      rate: Number(values.percentage.rate),
    },
  })
}
