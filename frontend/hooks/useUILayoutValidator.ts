'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { applyLayoutFix, runLayoutHealCycle, type LayoutIssue } from '../lib/layout-heal'

/**
 * Self-healing UI validator — scans each cycle for broken shell/nav/spacing
 * and applies layout patches without user intervention.
 */
export function useUILayoutValidator(enabled = true) {
  const [issues, setIssues] = useState<LayoutIssue[]>([])
  const [healGeneration, setHealGeneration] = useState(0)
  const shellRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  const heal = useCallback(() => {
    const result = runLayoutHealCycle()
    setIssues(result.issues)
    if (result.patched) setHealGeneration(g => g + 1)
    return result
  }, [])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const scheduleCheck = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const detected = runLayoutHealCycle()
        setIssues(detected.issues)
        if (detected.issues.length > 0 && detected.patched) {
          setHealGeneration(g => g + 1)
        }
      })
    }

    scheduleCheck()

    const resizeObs = new ResizeObserver(scheduleCheck)
    if (shellRef.current) resizeObs.observe(shellRef.current)
    resizeObs.observe(document.body)

    window.addEventListener('resize', scheduleCheck)
    window.addEventListener('orientationchange', scheduleCheck)

    const interval = window.setInterval(scheduleCheck, 4000)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      resizeObs.disconnect()
      window.removeEventListener('resize', scheduleCheck)
      window.removeEventListener('orientationchange', scheduleCheck)
      window.clearInterval(interval)
    }
  }, [enabled])

  return {
    shellRef,
    issues,
    healGeneration,
    heal,
    isHealthy: issues.length === 0
  }
}
