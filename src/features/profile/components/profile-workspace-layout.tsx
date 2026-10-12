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
import type { ReactNode } from 'react'

type ProfileWorkspaceLayoutProps = {
  accountSettings: ReactNode
  languagePreferences: ReactNode
  securityActions: ReactNode
  passkey: ReactNode
  twoFactor: ReactNode
  checkin?: ReactNode
  sidebar?: ReactNode
  sessions: ReactNode
}

export function ProfileWorkspaceLayout(props: ProfileWorkspaceLayoutProps) {
  return (
    <div data-profile-workspace>
      <div
        data-profile-shell
        className='grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] xl:items-start'
      >
        <div data-profile-primary className='min-w-0 space-y-4 sm:space-y-6'>
          <div data-profile-account-settings className='min-w-0'>
            {props.accountSettings}
          </div>

          <div
            data-profile-strong-auth-grid
            className='grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2 lg:items-stretch'
          >
            <div
              data-profile-passkey
              className='min-w-0 lg:h-full lg:[&>*]:h-full'
            >
              {props.passkey}
            </div>
            <div
              data-profile-two-factor
              className='min-w-0 lg:h-full lg:[&>*]:h-full'
            >
              {props.twoFactor}
            </div>
          </div>

          {props.checkin ? (
            <div data-profile-checkin className='min-w-0'>
              {props.checkin}
            </div>
          ) : null}

          <div data-profile-sessions className='min-w-0'>
            {props.sessions}
          </div>
        </div>

        <div
          data-profile-settings-rail
          className='min-w-0 space-y-4 sm:space-y-5'
        >
          <div data-profile-language-preferences className='min-w-0'>
            {props.languagePreferences}
          </div>
          <div data-profile-security-actions className='min-w-0'>
            {props.securityActions}
          </div>
          {props.sidebar ? (
            <div data-profile-sidebar className='min-w-0'>
              {props.sidebar}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
