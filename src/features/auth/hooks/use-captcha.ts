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
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { CaptchaConfig, CaptchaHandle } from '@/components/captcha'
import { useStatus } from '@/hooks/use-status'

import type { CaptchaProof, SystemStatus } from '../types'

export function getCaptchaConfig(status: SystemStatus | null): CaptchaConfig {
  const data = status?.data
  return {
    provider:
      status?.captcha_provider ??
      data?.captcha_provider ??
      ((status?.turnstile_check ?? data?.turnstile_check)
        ? 'turnstile'
        : 'none'),
    turnstileSiteKey:
      status?.turnstile_site_key ?? data?.turnstile_site_key ?? '',
    aliyunRegion:
      status?.aliyun_captcha_region ?? data?.aliyun_captcha_region ?? 'cn',
    aliyunPrefix:
      status?.aliyun_captcha_prefix ?? data?.aliyun_captcha_prefix ?? '',
    aliyunSceneId:
      status?.aliyun_captcha_scene_id ?? data?.aliyun_captcha_scene_id ?? '',
  }
}

export function useCaptcha() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const config = getCaptchaConfig(status)
  const captchaRef = useRef<CaptchaHandle | null>(null)
  const token = useRef<{ siteKey: string; value: string } | null>(null)
  const [widgetVersion, setWidgetVersion] = useState(0)
  const [verifiedSiteKey, setVerifiedSiteKey] = useState<string | null>(null)
  const onVerify = useCallback(
    (value: string) => {
      token.current = { siteKey: config.turnstileSiteKey, value }
      setVerifiedSiteKey(config.turnstileSiteKey)
    },
    [config.turnstileSiteKey]
  )
  const onExpire = useCallback(() => {
    token.current = null
    setVerifiedSiteKey(null)
  }, [])

  const validateCaptcha = async (): Promise<CaptchaProof | null> => {
    if (config.provider === 'none') return {}

    if (config.provider === 'aliyun') {
      const value = await captchaRef.current?.execute()
      if (value) return { captcha_token: value }
      toast.info(t('Please complete the human verification first'))
      return null
    }

    if (token.current && token.current.siteKey === config.turnstileSiteKey) {
      const value = token.current.value
      onExpire()
      setWidgetVersion((version) => version + 1)
      return { turnstile: value }
    }
    toast.info(t('Please wait a moment, human check is initializing...'))
    return null
  }

  return {
    captchaProps: { ...config, ref: captchaRef, onVerify, onExpire },
    captchaKey: `${config.turnstileSiteKey}:${widgetVersion}`,
    isCaptchaEnabled: config.provider !== 'none',
    isCaptchaReady:
      config.provider !== 'turnstile' ||
      verifiedSiteKey === config.turnstileSiteKey,
    validateCaptcha,
  }
}
