'use client'

import React, { useEffect, useState } from 'react'
import { resolveAssetSrc } from '../lib/asset-registry'
import { APP_NAME, APP_TAGLINE } from '../lib/brand'
import { FULL_SPLASH_MS } from '../hooks/useAppBootSplash'
import AmbientBackground from './AmbientBackground'

const INIT_STEPS = [
  'Booting AI cofounder engine…',
  'Syncing intelligence modules…',
  'Calibrating voice pipeline…',
  'Mapping startup frameworks…',
  'Preparing your workspace…'
]

type LoadingScreenProps = {
  exiting?: boolean
}

export default function LoadingScreen({ exiting = false }: LoadingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const logoSrc = resolveAssetSrc('logo', 'svg') ?? '/assets/logo.svg'

  useEffect(() => {
    const stepTimer = window.setInterval(() => {
      setStepIndex(i => (i + 1) % INIT_STEPS.length)
    }, 700)
    return () => window.clearInterval(stepTimer)
  }, [])

  useEffect(() => {
    const started = Date.now()
    const tickMs = 50

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started
      const pct = Math.min(100, (elapsed / FULL_SPLASH_MS) * 100)
      setProgress(pct)
      if (pct >= 100) {
        window.clearInterval(timer)
      }
    }, tickMs)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      className={`ff-loading-screen${exiting ? ' ff-loading-screen-exit' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${APP_NAME}`}
    >
      <AmbientBackground />

      <div className="ff-loading-screen-inner">
        <div className="ff-loading-logo-stage">
          <div className="ff-loading-orbit ff-loading-orbit-1" aria-hidden />
          <div className="ff-loading-orbit ff-loading-orbit-2" aria-hidden />
          <div className="ff-loading-orbit ff-loading-orbit-3" aria-hidden />
          <div className="ff-loading-logo-wrap">
            <div className="ff-loading-logo-glow" aria-hidden />
            <img
              src={logoSrc}
              alt={APP_NAME}
              width={88}
              height={88}
              className="ff-brand-logo ff-loading-logo-img"
              decoding="async"
            />
          </div>
        </div>

        <h1 className="ff-loading-brand">
          <span className="ff-loading-brand-gradient ff-brand-font">{APP_NAME}</span>
        </h1>
        <p className="ff-loading-tagline">{APP_TAGLINE}</p>

        <div className="ff-loading-status-wrap">
          <span className="ff-loading-status-dot" aria-hidden />
          <p className="ff-loading-status" key={stepIndex}>
            {INIT_STEPS[stepIndex]}
          </p>
        </div>

        <div className="ff-loading-progress" aria-hidden>
          <div className="ff-loading-progress-track">
            <div
              className="ff-loading-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="ff-loading-progress-label">{Math.round(progress)}%</span>
        </div>

        <div className="ff-loading-waveform" aria-hidden>
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${(i * 0.06).toFixed(2)}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
