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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import {
  SettingsForm,
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { saveAlipayOfficialSettings } from './alipay-official-api'
import {
  createAlipayOfficialSchema,
  type AlipayOfficialValues,
} from './alipay-official-config'

interface AlipayOfficialSettingsProps {
  defaultValues: AlipayOfficialValues
  privateKeyConfigured: boolean
  complianceConfirmed: boolean
  serverAddress: string
}

export function AlipayOfficialSettingsSection({
  defaultValues,
  privateKeyConfigured,
  complianceConfirmed,
  serverAddress,
}: AlipayOfficialSettingsProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [hasPrivateKey, setHasPrivateKey] = useState(privateKeyConfigured)
  const [saveError, setSaveError] = useState('')
  const form = useForm<AlipayOfficialValues>({
    resolver: zodResolver(
      createAlipayOfficialSchema(
        t,
        hasPrivateKey,
        complianceConfirmed,
        serverAddress
      )
    ) as Resolver<AlipayOfficialValues>,
    defaultValues: { ...defaultValues, private_key: '' },
  })
  const saveSettings = useMutation({ mutationFn: saveAlipayOfficialSettings })
  const { isDirty, isSubmitting } = form.formState
  const callbackOrigin = (
    form.watch('callback_url').trim() || serverAddress.trim()
  ).replace(/\/+$/, '')
  const saving = isSubmitting || saveSettings.isPending

  async function onSubmit(values: AlipayOfficialValues) {
    setSaveError('')
    try {
      const response = await saveSettings.mutateAsync({
        ...values,
        callback_url: values.callback_url.replace(/\/+$/, ''),
      })
      if (!response.success) {
        setSaveError(response.message || t('alipayOfficial.saveError'))
        return
      }
      setHasPrivateKey(hasPrivateKey || Boolean(values.private_key))
      form.reset({ ...values, private_key: '' })
      saveSettings.reset()
      await queryClient.invalidateQueries({ queryKey: ['system-options'] })
      toast.success(t('alipayOfficial.saved'))
    } catch {
      setSaveError(t('alipayOfficial.saveError'))
    }
  }

  return (
    <SettingsSection title={t('alipayOfficial.title')}>
      <p className='text-muted-foreground text-sm'>
        {t('alipayOfficial.description')}
      </p>
      <p className='text-muted-foreground text-xs'>
        {t('alipayOfficial.credentialsHint')}
      </p>
      <Form {...form}>
        <SettingsForm
          onSubmit={form.handleSubmit(onSubmit)}
          autoComplete='off'
          aria-label={t('alipayOfficial.title')}
        >
          <SettingsPageFormActions
            onSave={form.handleSubmit(onSubmit)}
            onReset={() => {
              form.reset()
              setSaveError('')
            }}
            isSaving={saving}
            isSaveDisabled={!isDirty}
            isResetDisabled={!isDirty}
            saveLabel='alipayOfficial.save'
          />
          <Alert>
            <AlertTitle>{t('alipayOfficial.title')}</AlertTitle>
            <AlertDescription>{t('alipayOfficial.product')}</AlertDescription>
          </Alert>
          {!complianceConfirmed && (
            <Alert>
              <AlertDescription>
                {t('alipayOfficial.complianceRequired')}
              </AlertDescription>
            </Alert>
          )}
          {saveError && (
            <Alert variant='destructive'>
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          <FormField
            control={form.control}
            name='enabled'
            render={({ field }) => (
              <SettingsSwitchItem>
                <SettingsSwitchContent>
                  <FormLabel>{t('alipayOfficial.enabled')}</FormLabel>
                  <FormDescription>
                    {t('alipayOfficial.enabledHint')}
                  </FormDescription>
                  <FormMessage />
                </SettingsSwitchContent>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={saving || (!complianceConfirmed && !field.value)}
                  />
                </FormControl>
              </SettingsSwitchItem>
            )}
          />
          <FormField
            control={form.control}
            name='sandbox'
            render={({ field }) => (
              <SettingsSwitchItem>
                <SettingsSwitchContent>
                  <FormLabel>{t('alipayOfficial.sandbox')}</FormLabel>
                  <FormDescription>
                    {t('alipayOfficial.sandboxHint')}
                  </FormDescription>
                </SettingsSwitchContent>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={saving}
                  />
                </FormControl>
              </SettingsSwitchItem>
            )}
          />
          {(['app_id', 'seller_id'] as const).map((name) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      name === 'app_id'
                        ? 'alipayOfficial.appId'
                        : 'alipayOfficial.sellerId'
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} inputMode='numeric' disabled={saving} />
                  </FormControl>
                  {name === 'seller_id' && (
                    <FormDescription>
                      {t('alipayOfficial.sellerIdHint')}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <FormField
            control={form.control}
            name='private_key'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('alipayOfficial.privateKey')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    spellCheck={false}
                    autoComplete='off'
                    className='font-mono text-xs'
                    placeholder={
                      hasPrivateKey
                        ? t('alipayOfficial.keyPlaceholder')
                        : '-----BEGIN PRIVATE KEY-----'
                    }
                    disabled={saving}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    hasPrivateKey
                      ? 'alipayOfficial.privateKeySaved'
                      : 'alipayOfficial.privateKeyHint'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='public_key'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('alipayOfficial.publicKey')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    spellCheck={false}
                    className='font-mono text-xs'
                    placeholder='-----BEGIN PUBLIC KEY-----'
                    disabled={saving}
                  />
                </FormControl>
                <FormDescription>
                  {t('alipayOfficial.publicKeyHint')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='callback_url'
            render={({ field }) => (
              <FormItem data-settings-form-span='full'>
                <FormLabel>{t('alipayOfficial.callbackOrigin')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={serverAddress || 'https://api.example.com'}
                    disabled={saving}
                  />
                </FormControl>
                <FormDescription>
                  {t('alipayOfficial.callbackOriginHint')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {(['price', 'min_topup'] as const).map((name) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      name === 'price'
                        ? 'alipayOfficial.unitPrice'
                        : 'alipayOfficial.minTopup'
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      min={name === 'price' ? 0.01 : 1}
                      max={name === 'price' ? 1000000 : 4000}
                      step={name === 'price' ? 'any' : 1}
                      disabled={saving}
                    />
                  </FormControl>
                  {name === 'price' && (
                    <FormDescription>
                      {t('alipayOfficial.unitPriceHint')}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          {callbackOrigin && (
            <div className='bg-muted/20 min-w-0 space-y-3 rounded-xl border p-4'>
              {(
                [
                  ['alipayOfficial.notifyUrl', '/api/user/alipay/notify'],
                  [
                    'alipayOfficial.subscriptionNotifyUrl',
                    '/api/subscription/alipay/notify',
                  ],
                ] as const
              ).map(([label, path]) => (
                <div key={path} className='min-w-0 space-y-1'>
                  <p className='text-sm font-medium'>{t(label)}</p>
                  <code className='block text-xs break-all select-all'>
                    {callbackOrigin}
                    {path}
                  </code>
                </div>
              ))}
              <p className='text-muted-foreground text-xs'>
                {t('alipayOfficial.callbackHint')}
              </p>
            </div>
          )}
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
