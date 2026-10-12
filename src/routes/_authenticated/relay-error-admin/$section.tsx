/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { createFileRoute, redirect } from '@tanstack/react-router'

import { RelayErrors } from '@/features/relay-errors'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

const SECTION_IDS = ['logs', 'stats'] as const

export const Route = createFileRoute(
  '/_authenticated/relay-error-admin/$section'
)({
  beforeLoad: ({ params }) => {
    const { auth } = useAuthStore.getState()
    if (!auth.user || auth.user.role < ROLE.ADMIN) {
      throw redirect({ to: '/403' })
    }
    if (!SECTION_IDS.includes(params.section as (typeof SECTION_IDS)[number])) {
      throw redirect({
        to: '/relay-error-admin/$section',
        params: { section: 'logs' },
      })
    }
  },
  component: RelayErrors,
})
