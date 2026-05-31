'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { playClickSound } from '../lib/ui-sounds'

export const FULL_SPLASH_MS = 2400
export const HOME_SPLASH_MS = 800
const EXIT_MS = 520

export function useAppBootSplash() {
  const pathname = usePathname() || '/'
  const [showLoader, setShowLoader] = useState(true)
  const [loaderExiting, setLoaderExiting] = useState(false)
  const prevPathRef = useRef<string | null>(null)
  const splashTimerRef = useRef<number | null>(null)
  const exitTimerRef = useRef<number | null>(null)
  const failSafeTimerRef = useRef<number | null>(null)
  const bootstrappedRef = useRef(false)
  const showLoaderRef = useRef(true)

  showLoaderRef.current = showLoader

  const clearTimers = useCallback(() => {
    if (splashTimerRef.current) {
      window.clearTimeout(splashTimerRef.current)
      splashTimerRef.current = null
    }
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }
    if (failSafeTimerRef.current) {
      window.clearTimeout(failSafeTimerRef.current)
      failSafeTimerRef.current = null
    }
  }, [])

  const finishSplash = useCallback(() => {
    clearTimers()
    setShowLoader(false)
    setLoaderExiting(false)
  }, [clearTimers])

  const runSplash = useCallback(
    (duration: number, options?: { playSound?: boolean }) => {
      clearTimers()
      setShowLoader(true)
      setLoaderExiting(false)

      splashTimerRef.current = window.setTimeout(() => {
        splashTimerRef.current = null
        if (options?.playSound !== false) {
          playClickSound()
        }
        setLoaderExiting(true)
        exitTimerRef.current = window.setTimeout(() => {
          exitTimerRef.current = null
          finishSplash()
        }, EXIT_MS)
      }, duration)

      failSafeTimerRef.current = window.setTimeout(() => {
        failSafeTimerRef.current = null
        finishSplash()
      }, duration + EXIT_MS + 800)
    },
    [clearTimers, finishSplash]
  )

  /* Boot splash — mount once; avoid deps that re-trigger and cancel the timer */
  useEffect(() => {
    if (bootstrappedRef.current) return
    bootstrappedRef.current = true
    prevPathRef.current = pathname
    runSplash(FULL_SPLASH_MS)

    return () => {
      bootstrappedRef.current = false
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Home splash only after initial boot completes — never reset during first load */
  useEffect(() => {
    if (!bootstrappedRef.current || showLoaderRef.current) {
      prevPathRef.current = pathname
      return
    }

    const prev = prevPathRef.current
    prevPathRef.current = pathname

    if (prev !== null && prev !== '/' && pathname === '/') {
      runSplash(HOME_SPLASH_MS)
    }
  }, [pathname, runSplash])

  const triggerHomeSplash = useCallback(() => {
    if (showLoaderRef.current) return
    runSplash(HOME_SPLASH_MS)
  }, [runSplash])

  return {
    showLoader,
    loaderExiting,
    triggerHomeSplash,
    appReady: !showLoader
  }
}
