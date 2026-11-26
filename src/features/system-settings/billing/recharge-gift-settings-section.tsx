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
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { SettingsForm } from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'
import {
  MAX_GIFT_TIERS,
  rechargeGiftTiersSchema,
  type RechargeGiftTierValues,
} from './recharge-gift-config'

type RechargeGiftSettingsSectionProps = {
  defaultValues: RechargeGiftTierValues
}

export function RechargeGiftSettingsSection(
  props: RechargeGiftSettingsSectionProps
) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const form = useForm<RechargeGiftTierValues>({
    resolver: zodResolver(rechargeGiftTiersSchema),
    defaultValues: props.defaultValues,
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tiers',
  })
  const { isDirty, isSubmitting } = form.formState
  const disabled = isSubmitting || updateOption.isPending

  const submit = form.handleSubmit(async (values) => {
    try {
      await updateOption.mutateAsync({
        key: 'TopUpGiftTiers',
        value: JSON.stringify(
          Object.fromEntries(
            values.tiers.map((tier) => [tier.amount, Number(tier.gift)])
          )
        ),
      })
      form.reset(values)
    } catch {
      // The shared option mutation reports the server error.
    }
  })

  return (
    <SettingsSection title={t('billing.rechargeGift.title')}>
      <SettingsPageFormActions
        onSave={() => void submit()}
        onReset={() => form.reset()}
        isSaving={disabled}
        isSaveDisabled={!isDirty}
        isResetDisabled={!isDirty}
      />
      <Form {...form}>
        <SettingsForm noValidate onSubmit={submit}>
          {fields.length === 0 && (
            <p className='text-muted-foreground text-sm'>
              {t('billing.rechargeGift.empty')}
            </p>
          )}
          {fields.map((tier, index) => (
            <div
              key={tier.id}
              className='grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-3 sm:max-w-lg'
            >
              <FormField
                control={form.control}
                name={`tiers.${index}.amount`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('billing.rechargeGift.rechargeCny')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode='numeric'
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`tiers.${index}.gift`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('billing.rechargeGift.giftCny')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode='decimal'
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='mt-5.5'
                aria-label={t('billing.rechargeGift.remove', {
                  index: index + 1,
                })}
                title={t('billing.rechargeGift.remove', { index: index + 1 })}
                disabled={disabled}
                onClick={() => remove(index)}
              >
                <Trash2 aria-hidden='true' />
              </Button>
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='justify-self-start'
            disabled={disabled || fields.length >= MAX_GIFT_TIERS}
            onClick={() => append({ amount: '', gift: '' })}
          >
            <Plus data-icon='inline-start' aria-hidden='true' />
            {t('billing.rechargeGift.add')}
          </Button>
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
