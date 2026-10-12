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
import { Gift, ExternalLink, Loader2, WalletCards } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

import {
  getDiscountLabel,
  getMinTopupAmount,
  calculatePresetPricing,
} from '../lib'
import type { PresetAmount, TopupInfo, CreemProduct } from '../types'
import { CreemProductsSection } from './creem-products-section'
import { PaymentSummary } from './payment-summary'
import { SupportedPaymentChannels } from './supported-payment-channels'

interface RechargeFormCardProps {
  topupInfo: TopupInfo | null
  presetAmounts: PresetAmount[]
  selectedPreset: number | null
  onSelectPreset: (preset: PresetAmount) => void
  topupAmount: number
  onTopupAmountChange: (amount: number) => void
  paymentAmount: number
  calculating: boolean
  onOnlinePay: () => void
  onlinePaying: boolean
  onlinePaymentDisabled?: boolean
  redemptionCode: string
  onRedemptionCodeChange: (code: string) => void
  onRedeem: () => void
  redeeming: boolean
  topupLink?: string
  loading?: boolean
  priceRatio?: number
  usdExchangeRate?: number
  creemProducts?: CreemProduct[]
  enableCreemTopup?: boolean
  onCreemProductSelect?: (product: CreemProduct) => void
}

export function RechargeFormCard({
  topupInfo,
  presetAmounts,
  selectedPreset,
  onSelectPreset,
  topupAmount,
  onTopupAmountChange,
  paymentAmount,
  calculating,
  onOnlinePay,
  onlinePaying,
  onlinePaymentDisabled,
  redemptionCode,
  onRedemptionCodeChange,
  onRedeem,
  redeeming,
  topupLink,
  loading,
  priceRatio = 1,
  usdExchangeRate = 1,
  creemProducts,
  enableCreemTopup,
  onCreemProductSelect,
}: RechargeFormCardProps) {
  const { t } = useTranslation()
  const [localAmount, setLocalAmount] = useState(topupAmount.toString())

  useEffect(() => {
    // Empty string must survive, otherwise the field can never be cleared
    setLocalAmount((prev) =>
      prev === '' && topupAmount === 0 ? prev : topupAmount.toString()
    )
  }, [topupAmount])

  const handleAmountChange = (value: string) => {
    setLocalAmount(value)
    const numValue = Number.parseInt(value) || 0
    if (numValue >= 0) {
      onTopupAmountChange(numValue)
    }
  }

  const hasConfigurableTopup =
    topupInfo?.enable_online_topup ||
    topupInfo?.enable_stripe_topup ||
    topupInfo?.enable_waffo_topup ||
    topupInfo?.enable_waffo_pancake_topup
  const hasAnyTopup = hasConfigurableTopup || enableCreemTopup
  const minTopup = getMinTopupAmount(topupInfo)
  const presetDisplayValues = presetAmounts.map(
    (preset) => preset.value * usdExchangeRate
  )
  const presetDisplayRange =
    presetDisplayValues.length > 0
      ? {
          min: Math.min(...presetDisplayValues),
          max: Math.max(...presetDisplayValues),
        }
      : null
  const redemptionEnabled = topupInfo?.enable_redemption !== false

  if (loading) {
    return (
      <Card data-card-hover='false' className='gap-0 overflow-hidden py-0'>
        <CardHeader className='border-b p-3 !pb-3 sm:p-5 sm:!pb-5'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='mt-2 h-4 w-48' />
        </CardHeader>
        <CardContent className='space-y-4 p-3 sm:space-y-6 sm:p-5'>
          <div className='space-y-4 sm:space-y-6'>
            {/* Preset Amounts Skeleton */}
            <div className='space-y-3'>
              <Skeleton className='h-3 w-16' />
              <div className='grid auto-cols-[minmax(112px,1fr)] grid-flow-col gap-2 overflow-x-auto pb-1 sm:gap-3'>
                {['first', 'second', 'third', 'fourth'].map((key) => (
                  <Skeleton key={key} className='h-14 rounded-xl' />
                ))}
              </div>
            </div>

            {/* Custom Amount Input Skeleton */}
            <div className='space-y-3'>
              <Skeleton className='h-3 w-28' />
              <Skeleton className='h-[42px] w-full' />
            </div>

            {/* Payment Summary Skeleton */}
            <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
              {['amount', 'subtotal', 'tax', 'total'].map((key) => (
                <Skeleton key={key} className='h-20 rounded-xl' />
              ))}
            </div>
          </div>

          {/* Redemption Code Section Skeleton */}
          <div className='space-y-3 border-t pt-8'>
            <Skeleton className='h-3 w-24' />
            <div className='flex gap-2'>
              <Skeleton className='h-10 flex-1' />
              <Skeleton className='h-10 w-20' />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TitledCard
      title={t('Add Funds')}
      description={t('Recharge Amount')}
      icon={<WalletCards className='h-4 w-4' />}
      iconTone='success'
      disableHoverEffect
      action={
        presetDisplayRange ? (
          <span className='text-muted-foreground text-sm font-medium tabular-nums'>
            ${formatNumber(presetDisplayRange.min)}–$
            {formatNumber(presetDisplayRange.max)} {t('USD')}
          </span>
        ) : null
      }
      contentClassName='space-y-4 sm:space-y-6'
    >
      {/* Online Topup Section */}
      {hasAnyTopup ? (
        <div className='space-y-4 sm:space-y-6'>
          {hasConfigurableTopup && (
            <>
              {presetAmounts.length > 0 && (
                <div className='space-y-2.5 sm:space-y-3'>
                  <Label className='border-primary/40 bg-primary/5 text-primary inline-flex h-8 w-fit items-center rounded-lg border px-3 text-xs font-semibold'>
                    {t('Amount')}
                  </Label>
                  <div
                    data-preset-amounts
                    className='grid auto-cols-[minmax(112px,1fr)] grid-flow-col gap-2 overflow-x-auto pb-1 sm:gap-3'
                  >
                    {presetAmounts.map((preset) => {
                      const discount =
                        preset.discount ||
                        topupInfo?.discount?.[preset.value] ||
                        1.0
                      const { displayValue, hasDiscount } =
                        calculatePresetPricing(
                          preset.value,
                          priceRatio,
                          discount,
                          usdExchangeRate
                        )
                      return (
                        <Button
                          key={preset.value}
                          variant='outline'
                          className={cn(
                            'bg-muted/45 flex min-h-14 items-center rounded-xl px-4 py-2 text-left whitespace-nowrap shadow-none',
                            selectedPreset === preset.value
                              ? 'border-primary bg-primary/5 text-primary ring-primary/15 ring-2'
                              : 'border-border/60 hover:border-primary/40 hover:bg-primary/5'
                          )}
                          onClick={() => onSelectPreset(preset)}
                          aria-pressed={selectedPreset === preset.value}
                        >
                          <div className='flex w-full items-center justify-between'>
                            <div className='text-lg font-bold tabular-nums'>
                              <span
                                data-preset-amount-currency
                                aria-hidden='true'
                              >
                                $
                              </span>
                              {formatNumber(displayValue)}
                            </div>
                            {hasDiscount && (
                              <div className='text-xs font-medium text-green-600'>
                                {getDiscountLabel(discount)}
                              </div>
                            )}
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className='space-y-2.5 sm:space-y-3'>
                <Label
                  htmlFor='topup-amount'
                  className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
                >
                  {t('Recharge Amount')} ({t('USD')})
                </Label>
                <div className='grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center'>
                  <div className='relative'>
                    <span
                      data-custom-amount-currency
                      aria-hidden='true'
                      className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base font-semibold'
                    >
                      $
                    </span>
                    <Input
                      id='topup-amount'
                      type='number'
                      inputMode='decimal'
                      value={localAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      min={minTopup}
                      placeholder={`Minimum ${minTopup}`}
                      className='h-12 pl-7 text-base font-medium tabular-nums sm:text-lg'
                    />
                  </div>
                  <Button
                    type='button'
                    onClick={onOnlinePay}
                    disabled={
                      onlinePaymentDisabled || onlinePaying || calculating
                    }
                    className='h-12 min-w-32 px-6 text-sm font-semibold sm:min-w-36'
                  >
                    {onlinePaying ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : null}
                    {t('Pay Online')}
                  </Button>
                </div>
              </div>

              <PaymentSummary
                topupAmount={topupAmount}
                paymentAmount={paymentAmount}
                calculating={calculating}
              />

              <SupportedPaymentChannels />
            </>
          )}
        </div>
      ) : (
        <Alert>
          <AlertDescription>
            {t(
              'Online topup is not enabled. Please use redemption code or contact administrator.'
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Creem Products Section */}
      {enableCreemTopup &&
        Array.isArray(creemProducts) &&
        creemProducts.length > 0 &&
        onCreemProductSelect && (
          <div className='space-y-2.5 border-t pt-4 sm:space-y-3 sm:pt-6'>
            <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
              {t('Creem Payment')}
            </Label>
            <CreemProductsSection
              products={creemProducts}
              onProductSelect={onCreemProductSelect}
            />
          </div>
        )}

      {/* Redemption Code Section */}
      {redemptionEnabled ? (
        <div className='space-y-2.5 border-t pt-4 sm:space-y-3 sm:pt-6'>
          <div className='flex items-center gap-2'>
            <IconBadge tone='warning' size='xs'>
              <Gift />
            </IconBadge>
            <Label
              htmlFor='redemption-code'
              className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
            >
              {t('Have a Code?')}
            </Label>
          </div>
          <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-2'>
            <Input
              id='redemption-code'
              value={redemptionCode}
              onChange={(e) => onRedemptionCodeChange(e.target.value)}
              placeholder={t('Enter your redemption code')}
              className='h-9 min-w-0'
            />
            <Button
              onClick={onRedeem}
              disabled={redeeming}
              variant='outline'
              className='h-9 px-4'
            >
              {redeeming && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {t('Redeem')}
            </Button>
          </div>
          {topupLink && (
            <p className='text-muted-foreground text-xs'>
              {t('Need a redemption code?')}{' '}
              <a
                href={topupLink}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 underline-offset-4 hover:underline'
              >
                {t('Get one here')}
                <ExternalLink className='h-3 w-3' />
              </a>
            </p>
          )}
        </div>
      ) : (
        <Alert className='border-t'>
          <AlertDescription>
            {t(
              'Redemption codes are disabled until the administrator confirms compliance terms.'
            )}
          </AlertDescription>
        </Alert>
      )}
    </TitledCard>
  )
}
