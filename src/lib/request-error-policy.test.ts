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
import assert from 'node:assert/strict'

import { afterEach, describe, test } from 'vitest'

import {
  claimSessionExpiration,
  isIntentionalSignOutInProgress,
  requestErrorToastId,
  resetRequestErrorPolicyForTests,
  resetSessionExpirationClaim,
  runDuringIntentionalSignOut,
} from './request-error-policy.ts'

afterEach(() => resetRequestErrorPolicyForTests())

describe('request error policy', () => {
  test('uses the message as a stable toast identity', () => {
    assert.equal(
      requestErrorToastId('Verification code expired'),
      'request-error:Verification code expired'
    )
  })

  test('allows only one handler to claim concurrent session expiration', () => {
    assert.equal(claimSessionExpiration(), true)
    assert.equal(claimSessionExpiration(), false)
    assert.equal(claimSessionExpiration(), false)

    resetSessionExpirationClaim()
    assert.equal(claimSessionExpiration(), true)
  })

  test('marks intentional sign-out only while the operation is running', async () => {
    assert.equal(isIntentionalSignOutInProgress(), false)

    await runDuringIntentionalSignOut(async () => {
      assert.equal(isIntentionalSignOutInProgress(), true)
    })

    assert.equal(isIntentionalSignOutInProgress(), false)
  })

  test('releases intentional sign-out state when the operation fails', async () => {
    await assert.rejects(
      runDuringIntentionalSignOut(async () => {
        assert.equal(isIntentionalSignOutInProgress(), true)
        throw new Error('logout failed')
      }),
      /logout failed/
    )

    assert.equal(isIntentionalSignOutInProgress(), false)
  })
})
