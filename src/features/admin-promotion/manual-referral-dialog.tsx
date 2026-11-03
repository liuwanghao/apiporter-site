/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { UserSearchCombobox } from '@/features/users/components/user-search-combobox'
import type { User } from '@/features/users/types'

import {
  manualReferralSchema,
  type ManualReferralValues,
} from './lib/manual-referral-schema'

const emptyForm: ManualReferralValues = {
  inviterUserID: '',
  inviteeUserID: '',
}

type ManualReferralDialogProps = {
  open: boolean
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: {
    inviter_user_id: number
    invitee_user_id: number
  }) => Promise<boolean>
}

export function ManualReferralDialog(props: ManualReferralDialogProps) {
  const { t } = useTranslation()
  const [inviter, setInviter] = useState<User | null>(null)
  const [invitee, setInvitee] = useState<User | null>(null)
  const form = useForm<ManualReferralValues>({
    resolver: zodResolver(manualReferralSchema),
    defaultValues: emptyForm,
  })

  const handleOpenChange = (open: boolean) => {
    if (!open && props.isPending) return
    if (!open) {
      form.reset(emptyForm)
      setInviter(null)
      setInvitee(null)
    }
    props.onOpenChange(open)
  }
  const submit = async (values: ManualReferralValues) => {
    const created = await props.onSubmit({
      inviter_user_id: Number(values.inviterUserID),
      invitee_user_id: Number(values.inviteeUserID),
    })
    if (created) handleOpenChange(false)
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={handleOpenChange}
      title={t('Bind referral relation')}
      description={t(
        'The relation takes effect now and does not apply to earlier activity.'
      )}
      contentClassName='sm:max-w-md'
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            disabled={props.isPending}
            onClick={() => handleOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            type='submit'
            form='manual-referral-form'
            disabled={props.isPending}
          >
            {props.isPending ? <Loader2 className='animate-spin' /> : null}
            {t('Create relation')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id='manual-referral-form'
          className='space-y-4'
          onSubmit={form.handleSubmit(submit)}
        >
          <FormField
            control={form.control}
            name='inviterUserID'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Inviter user ID')}</FormLabel>
                <UserSearchCombobox
                  disabled={props.isPending}
                  onBlur={field.onBlur}
                  onSearchChange={() => {
                    field.onChange('')
                    setInviter(null)
                  }}
                  onSelect={(user) => {
                    field.onChange(String(user.id))
                    setInviter(user)
                  }}
                />
                {inviter && (
                  <p
                    className='text-muted-foreground text-sm'
                    aria-live='polite'
                  >
                    {inviter.username} · #{inviter.id}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='inviteeUserID'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Invitee user ID')}</FormLabel>
                <UserSearchCombobox
                  disabled={props.isPending}
                  onBlur={field.onBlur}
                  onSearchChange={() => {
                    field.onChange('')
                    setInvitee(null)
                  }}
                  onSelect={(user) => {
                    field.onChange(String(user.id))
                    setInvitee(user)
                  }}
                />
                {invitee && (
                  <p
                    className='text-muted-foreground text-sm'
                    aria-live='polite'
                  >
                    {invitee.username} · #{invitee.id}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Dialog>
  )
}
