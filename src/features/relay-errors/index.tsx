/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { getRouteApi } from '@tanstack/react-router'

import { RelayErrorCenter } from './error-center'
import { RelayErrorStatistics } from './error-stats'

const route = getRouteApi('/_authenticated/relay-error-admin/$section')

export function RelayErrors() {
  const params = route.useParams()
  return params.section === 'stats' ? (
    <RelayErrorStatistics />
  ) : (
    <RelayErrorCenter />
  )
}
