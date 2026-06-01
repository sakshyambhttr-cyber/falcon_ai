'use client'

/**
 * FOUNDER FALCON — MICROPHONE BUTTON
 *
 * A premium, animated microphone button for voice input.
 * Integrates with useSpeechInput() hook.
 *
 * Visual states:
 *   idle       → static mic icon, subtle glow
 *   listening  → pulsing ring animation, cyan glow
 *   processing → spinning indicator
 *   ready      → green check, transcript ready
 *   error      → red, error state
 */

import React from 'react'
import type { SpeechInputPhase } from '../../hooks/useSpeechInput'

type MicrophoneButtonProps = {
  phase: SpeechInputPhase
  isSupported: boolean
  onStart: () => void
  onStop: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: { btn: 40, icon: 18 },
  md: { btn: 52, icon: 24 },
  lg: { btn: 64, icon: 30 }
}

export default function MicrophoneButton({
  phase,
  isSupported,
  onStart,
  onStop,
  disabled = false,
  size = 'md'
}: MicrophoneButtonProps) {
  const { btn, icon } = SIZE_MAP[size]
  const isListening = phase === 'listening'
  const isProcessing = phase === 'processing'
  const isReady = phase === 'ready'
  const isError = phase === 'error'
  const isActive = isListening || isProcessing

  function handleClick() {
    if (!isSupported || disabled) return
    if (isListening) {
      onStop()
    } else if (!isProcessing) {
      onStart()
    }
  }

  const ariaLabel = isListening
    ? 'Stop recording'
    : isProcessing
    ? 'Processing speech…'
    : isReady
    ? 'Start recording again'
    : 'Start voice input'

  return (
    <div className="ff-mic-wrapper" style={{ width: btn, height: btn }}>
      {/* Pulse rings — only when listening */}
      {isListening && (
        <>
          <span className="ff-mic-ring ff-mic-ring-1" style={{ width: btn + 16, height: btn + 16 }} />
          <span className="ff-mic-ring ff-mic-ring-2" style={{ width: btn + 32, height: btn + 32 }} />
        </>
      )}

      <button
        type="button"
        className={[
          'ff-mic-btn',
          isListening  ? 'ff-mic-btn--listening'  : '',
          isProcessing ? 'ff-mic-btn--processing' : '',
          isReady      ? 'ff-mic-btn--ready'      : '',
          isError      ? 'ff-mic-btn--error'      : '',
          !isSupported || disabled ? 'ff-mic-btn--disabled' : ''
        ].filter(Boolean).join(' ')}
        style={{ width: btn, height: btn }}
        onClick={handleClick}
        disabled={!isSupported || disabled || isProcessing}
        aria-label={ariaLabel}
        aria-pressed={isListening}
        title={!isSupported ? 'Speech recognition not supported in this browser' : ariaLabel}
      >
        {isProcessing ? (
          /* Spinner */
          <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
            </circle>
          </svg>
        ) : isListening ? (
          /* Stop square */
          <svg width={icon * 0.6} height={icon * 0.6} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        ) : (
          /* Microphone icon */
          <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        )}
      </button>
    </div>
  )
}
