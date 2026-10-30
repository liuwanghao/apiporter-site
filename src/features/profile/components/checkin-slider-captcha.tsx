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
import GoCaptcha from 'go-captcha-react'
import { RotateCw } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { getServerErrorMessage } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'

import '@/styles/checkin-captcha.css'

import { getCheckinCaptcha } from '../api'
import type { SliderCaptchaChallenge, SliderCaptchaSolution } from '../types'

interface CheckinSliderCaptchaProps {
  /** A restart lets the parent obtain a fresh Turnstile verification first. */
  onVerify: (solution: SliderCaptchaSolution) => Promise<boolean | 'restart'>
  className?: string
}

export function CheckinSliderCaptcha(props: CheckinSliderCaptchaProps) {
  const { t } = useTranslation()
  const onVerify = props.onVerify
  const instructionsId = useId()
  const sliderLabelId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [challenge, setChallenge] = useState<SliderCaptchaChallenge | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const [displayWidth, setDisplayWidth] = useState(320)
  const [verifying, setVerifying] = useState(false)
  const [passed, setPassed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const offsetRef = useRef(0)
  const verifyingRef = useRef(false)
  const loadingRef = useRef(false)
  const passedRef = useRef(false)
  const requestID = useRef(0)

  const loadChallenge = useCallback(
    async (clearError = true) => {
      if (loadingRef.current || verifyingRef.current) return
      loadingRef.current = true
      const currentRequest = ++requestID.current
      setLoading(true)
      setLoadError(null)
      if (clearError) setError(null)
      try {
        const res = await getCheckinCaptcha()
        if (currentRequest !== requestID.current) return
        if (res.success && res.data) {
          setChallenge(res.data)
          offsetRef.current = res.data.piece_x
          setOffset(res.data.piece_x)
          setKeyboardOffset(res.data.piece_x)
          passedRef.current = false
          setPassed(false)
        } else {
          setLoadError(getServerErrorMessage(res, t('Failed to load captcha')))
        }
      } catch (error) {
        if (currentRequest !== requestID.current) return
        setLoadError(getServerErrorMessage(error, t('Failed to load captcha')))
      } finally {
        if (currentRequest === requestID.current) {
          loadingRef.current = false
          setLoading(false)
        }
      }
    },
    [t]
  )

  useEffect(() => {
    void loadChallenge()
  }, [loadChallenge])

  useEffect(
    () => () => {
      requestID.current++
      loadingRef.current = false
    },
    []
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container || !challenge) return
    const updateWidth = () => {
      const width = container.getBoundingClientRect().width
      if (width > 0) setDisplayWidth(Math.min(challenge.width, width))
    }
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)
    return () => observer.disconnect()
  }, [challenge, loading])

  const submit = useCallback(
    async (x = offsetRef.current) => {
      if (
        !challenge ||
        loadingRef.current ||
        verifyingRef.current ||
        passedRef.current
      ) {
        return
      }
      verifyingRef.current = true
      const currentRequest = requestID.current
      setVerifying(true)
      setError(null)
      let ok: boolean | 'restart' = false
      try {
        ok = await onVerify({ token: challenge.token, x: Math.round(x) })
      } catch {
        ok = false
      } finally {
        verifyingRef.current = false
      }
      if (currentRequest !== requestID.current) return
      setVerifying(false)
      if (ok === 'restart') return
      if (ok) {
        passedRef.current = true
        setPassed(true)
        return
      }
      setError(t('Verification failed, please try again.'))
      await loadChallenge(false)
    },
    [challenge, loadChallenge, onVerify, t]
  )

  const scale = challenge ? displayWidth / challenge.width : 1
  const config = useMemo(
    () => ({
      width: displayWidth,
      height: (challenge?.height ?? 180) * scale,
      horizontalPadding: 0,
      verticalPadding: 0,
      showTheme: false,
      title: '',
      scope: true,
    }),
    [challenge?.height, displayWidth, scale]
  )
  // Only keyboard input updates thumbX. Updating it during a pointer drag would
  // reset the upstream component's starting position on every movement.
  const data = useMemo(
    () => ({
      thumbX: keyboardOffset * scale,
      thumbY: (challenge?.piece_y ?? 0) * scale,
      thumbWidth: (challenge?.piece_size ?? 0) * scale,
      thumbHeight: (challenge?.piece_size ?? 0) * scale,
      image: challenge?.background ?? '',
      thumb: challenge?.piece ?? '',
    }),
    [challenge, keyboardOffset, scale]
  )
  const events = useMemo(
    () => ({
      move: (x: number) => {
        if (loadingRef.current || verifyingRef.current || passedRef.current) {
          return
        }
        offsetRef.current = Math.round(x / scale)
        setOffset(offsetRef.current)
      },
      confirm: (point: { x: number }) => {
        void submit(point.x / scale)
      },
    }),
    [scale, submit]
  )

  if (loading) {
    return (
      <div className={cn('space-y-3', props.className)}>
        <Skeleton className='aspect-[16/9] w-full rounded-xl' />
        <Skeleton className='h-11 w-full rounded-full' />
      </div>
    )
  }
  if (loadError || !challenge) {
    return (
      <ErrorState
        className={props.className}
        title={t('Failed to load captcha')}
        description={loadError ?? undefined}
        onRetry={() => void loadChallenge()}
      />
    )
  }
  let sliderLabel = t('Drag the slider to complete the puzzle')
  if (verifying) sliderLabel = t('Verifying...')
  if (passed) sliderLabel = t('Verification passed')

  return (
    <div
      ref={containerRef}
      className={cn('checkin-captcha space-y-3', props.className)}
    >
      <div
        role='group'
        aria-label={t('Captcha puzzle background')}
        aria-disabled={verifying || passed}
        className={cn(
          'flex justify-center',
          (verifying || passed) && 'pointer-events-none opacity-70'
        )}
        onMouseDownCapture={(event) => {
          if (loadingRef.current || verifyingRef.current || passedRef.current) {
            event.stopPropagation()
          }
        }}
        onTouchStartCapture={(event) => {
          if (loadingRef.current || verifyingRef.current || passedRef.current) {
            event.stopPropagation()
          }
        }}
      >
        <div aria-hidden='true'>
          <GoCaptcha.Slide
            key={challenge.token}
            config={config}
            data={data}
            events={events}
          />
        </div>
      </div>
      <p
        id={sliderLabelId}
        role='status'
        className='text-muted-foreground text-center text-xs'
      >
        {sliderLabel}
      </p>
      {error ? (
        <p role='alert' className='text-destructive text-xs'>
          {error}
        </p>
      ) : null}
      {/* GoCaptcha handles mouse/touch. The shared slider supplies its missing
        keyboard path and updates the same upstream puzzle through thumbX. */}
      <Slider
        min={0}
        max={challenge.max_offset}
        step={1}
        value={[offset]}
        disabled={verifying || passed}
        aria-labelledby={sliderLabelId}
        aria-describedby={instructionsId}
        onValueChange={(value) => {
          if (loadingRef.current || verifyingRef.current || passedRef.current) {
            return
          }
          const x = Array.isArray(value) ? value[0] : value
          offsetRef.current = x
          setOffset(x)
          setKeyboardOffset(x)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            void submit()
          }
        }}
        className='sr-only focus-within:not-sr-only focus-within:py-3'
      />
      <div className='flex items-center justify-between gap-3'>
        <p id={instructionsId} className='text-muted-foreground text-xs'>
          {t('This helps us prevent automated check-ins.')}{' '}
          {t('Use arrow keys to adjust, then press Enter to verify.')}
        </p>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-7 shrink-0 px-2 text-xs'
          disabled={verifying || passed}
          onClick={() => void loadChallenge()}
        >
          <RotateCw className='mr-1 h-3 w-3' />
          {t('Refresh')}
        </Button>
      </div>
    </div>
  )
}
