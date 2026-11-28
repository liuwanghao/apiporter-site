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
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { SettingsForm } from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useUpdateCaptchaOptions } from '../hooks/use-update-option'

const botProtectionSchema = z.object({
  CaptchaProvider: z.enum(['none', 'turnstile', 'aliyun']),
  TurnstileSiteKey: z.string().optional(),
  TurnstileSecretKey: z.string().optional(),
  AliyunCaptchaRegion: z.enum(['cn', 'sgp']),
  AliyunCaptchaPrefix: z.string().optional(),
  AliyunCaptchaSceneId: z.string().optional(),
  AliyunCaptchaAccessKeyId: z.string().optional(),
  AliyunCaptchaAccessKeySecret: z.string().optional(),
})

type BotProtectionFormValues = z.infer<typeof botProtectionSchema>

type BotProtectionSectionProps = {
  defaultValues: BotProtectionFormValues
}

export function BotProtectionSection({
  defaultValues,
}: BotProtectionSectionProps) {
  const { t } = useTranslation()
  const updateOptions = useUpdateCaptchaOptions()

  const form = useForm<BotProtectionFormValues>({
    resolver: zodResolver(botProtectionSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const provider = form.watch('CaptchaProvider')
  const onSubmit = async (data: BotProtectionFormValues) => {
    const options: Record<string, string> = {
      CaptchaProvider: data.CaptchaProvider,
    }
    for (const [key, input] of Object.entries(data)) {
      const value = input?.trim()
      if (
        value &&
        value !== defaultValues[key as keyof BotProtectionFormValues]
      ) {
        options[key] = value
      }
    }
    try {
      await updateOptions.mutateAsync(options)
      form.resetField('TurnstileSecretKey')
      form.resetField('AliyunCaptchaAccessKeyId')
      form.resetField('AliyunCaptchaAccessKeySecret')
      updateOptions.reset()
    } catch {
      // The mutation displays the error and preserves the form for retry.
    }
  }

  return (
    <SettingsSection title={t('Bot Protection')}>
      <Form {...form}>
        <SettingsForm onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
          <SettingsPageFormActions
            onSave={form.handleSubmit(onSubmit)}
            isSaving={updateOptions.isPending}
          />
          <FormField
            control={form.control}
            name='CaptchaProvider'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Captcha provider')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value='none'>{t('Disabled')}</SelectItem>
                    <SelectItem value='turnstile'>
                      Cloudflare Turnstile
                    </SelectItem>
                    <SelectItem value='aliyun'>
                      {t('Alibaba Cloud CAPTCHA')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t(
                    'Choose the CAPTCHA service used for login, registration, password reset emails, and check-in'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {provider === 'turnstile' && (
            <>
              <FormField
                control={form.control}
                name='TurnstileSiteKey'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Site Key')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('Your Turnstile site key')}
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='TurnstileSecretKey'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Secret Key')}</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder={t(
                          'Leave blank to keep the existing credential'
                        )}
                        autoComplete='new-password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {provider === 'aliyun' && (
            <>
              <FormField
                control={form.control}
                name='AliyunCaptchaRegion'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Alibaba Cloud CAPTCHA region')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectItem value='cn'>
                          {t('China mainland (cn)')}
                        </SelectItem>
                        <SelectItem value='sgp'>
                          {t('Singapore (sgp)')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='AliyunCaptchaPrefix'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Alibaba Cloud CAPTCHA prefix')}</FormLabel>
                    <FormControl>
                      <Input autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='AliyunCaptchaSceneId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Alibaba Cloud CAPTCHA scene ID')}</FormLabel>
                    <FormControl>
                      <Input autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='AliyunCaptchaAccessKeyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Alibaba Cloud AccessKey ID')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'Leave blank to keep the existing credential'
                        )}
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='AliyunCaptchaAccessKeySecret'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Alibaba Cloud AccessKey Secret')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'Leave blank to keep the existing credential'
                        )}
                        type='password'
                        autoComplete='new-password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
