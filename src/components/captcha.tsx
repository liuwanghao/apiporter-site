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
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from 'react'

import { Turnstile } from '@/components/turnstile'

export type CaptchaProvider = 'none' | 'turnstile' | 'aliyun'

type AliyunCaptchaInstance = {
  show: () => void
  destroyCaptcha?: () => void
}

interface AliyunCaptchaOptions {
  SceneId: string
  mode: 'popup'
  element: string
  button: string
  delayBeforeSuccess: boolean
  success: (token: string) => void
  onError: () => void
  onClose: (reason: string) => void
  getInstance: (instance: AliyunCaptchaInstance) => void
}

declare global {
  interface Window {
    AliyunCaptchaConfig?: { region: string; prefix: string }
    initAliyunCaptcha?: (options: AliyunCaptchaOptions) => void
  }
}

export interface CaptchaHandle {
  execute: () => Promise<string>
}

export interface CaptchaConfig {
  provider: CaptchaProvider
  turnstileSiteKey: string
  aliyunRegion: string
  aliyunPrefix: string
  aliyunSceneId: string
}

interface CaptchaProps extends CaptchaConfig {
  onVerify?: (token: string) => void
  onExpire?: () => void
}

let scriptPromise: Promise<boolean> | undefined

function loadAliyunCaptchaScript(): Promise<boolean> {
  if (window.initAliyunCaptcha) return Promise.resolve(true)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script')
    const finish = (loaded: boolean) => {
      window.clearTimeout(timeout)
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
      if (!loaded) {
        script.remove()
        scriptPromise = undefined
      }
      resolve(loaded)
    }
    const onLoad = () => finish(Boolean(window.initAliyunCaptcha))
    const onError = () => finish(false)
    const timeout = window.setTimeout(() => finish(false), 10000)
    script.src =
      'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js'
    script.async = true
    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })
    document.head.appendChild(script)
  })
  return scriptPromise
}

interface AliyunCaptchaCycle {
  ready: Promise<AliyunCaptchaInstance | null>
  finish: (token?: string) => void
}

export const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(
  function Captcha(props, ref) {
    const { provider, aliyunRegion, aliyunPrefix, aliyunSceneId } = props
    const executeRef = useRef<CaptchaHandle['execute'] | null>(null)
    const id = useId().replaceAll(/[^a-zA-Z0-9_-]/g, '')
    const elementId = `aliyun-captcha-element-${id}`
    const buttonId = `aliyun-captcha-button-${id}`

    useImperativeHandle(
      ref,
      () => ({
        execute: async () => (await executeRef.current?.()) ?? '',
      }),
      []
    )

    useEffect(() => {
      if (provider !== 'aliyun' || !aliyunPrefix || !aliyunSceneId) return

      let cycle: AliyunCaptchaCycle | null = null
      let resolveAttempt: ((token: string) => void) | null = null

      const initialize = (): AliyunCaptchaCycle => {
        let active = true
        let instance: AliyunCaptchaInstance | null = null
        let resolveReady: (value: AliyunCaptchaInstance | null) => void
        const ready = new Promise<AliyunCaptchaInstance | null>((resolve) => {
          resolveReady = resolve
        })
        const nextCycle: AliyunCaptchaCycle = {
          ready,
          finish(token = '') {
            if (!active) return
            active = false
            window.clearTimeout(timeout)
            resolveReady(null)
            if (instance) {
              const finishedInstance = instance
              // Give the SDK time to finish its own success/close callback.
              queueMicrotask(() => finishedInstance.destroyCaptcha?.())
            }
            if (cycle === nextCycle) cycle = null
            resolveAttempt?.(token)
            resolveAttempt = null
          },
        }
        const timeout = window.setTimeout(() => nextCycle.finish(), 15000)
        window.AliyunCaptchaConfig = {
          region: aliyunRegion,
          prefix: aliyunPrefix,
        }
        void loadAliyunCaptchaScript()
          .then((loaded) => {
            if (!active) return
            if (!loaded || !window.initAliyunCaptcha) {
              nextCycle.finish()
              return
            }
            window.initAliyunCaptcha({
              SceneId: aliyunSceneId,
              mode: 'popup',
              element: `#${elementId}`,
              button: `#${buttonId}`,
              delayBeforeSuccess: false,
              success: (token) =>
                nextCycle.finish(instance && resolveAttempt ? token : ''),
              onError: () => nextCycle.finish(),
              onClose: (reason) => {
                if (reason === 'userDismiss') nextCycle.finish()
              },
              getInstance: (createdInstance) => {
                if (!active) {
                  createdInstance.destroyCaptcha?.()
                  return
                }
                instance = createdInstance
                window.clearTimeout(timeout)
                resolveReady(instance)
              },
            })
          })
          .catch(() => nextCycle.finish())
        return nextCycle
      }

      cycle = initialize()
      executeRef.current = () => {
        if (resolveAttempt) return Promise.resolve('')
        const current = cycle ?? (cycle = initialize())
        return new Promise<string>((resolve) => {
          resolveAttempt = resolve
          void current.ready
            .then((instance) => {
              if (instance && cycle === current) instance.show()
            })
            .catch(() => current.finish())
        })
      }

      return () => {
        executeRef.current = null
        cycle?.finish()
      }
    }, [
      aliyunPrefix,
      aliyunRegion,
      aliyunSceneId,
      buttonId,
      elementId,
      provider,
    ])

    if (provider === 'turnstile' && props.onVerify) {
      return (
        <Turnstile
          siteKey={props.turnstileSiteKey}
          onVerify={props.onVerify}
          onExpire={props.onExpire}
        />
      )
    }

    if (provider !== 'aliyun') return null

    return (
      <>
        <div id={elementId} />
        <button id={buttonId} type='button' hidden />
      </>
    )
  }
)
