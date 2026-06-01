'use client'

import React, { useEffect, useRef, useState } from 'react'
import Button from '../Button'
import VoiceStylePicker from './VoiceStylePicker'
import PipelineModeSelector from './PipelineModeSelector'
import { useSpeechInput } from '../../hooks/useSpeechInput'
import type { PipelineMode } from '../../types/events'
import type { VoiceStyle } from './VoiceAssistantPanel'

type IdeaCaptureProps = {
  idea: string
  onIdeaChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  mode: PipelineMode
  onModeChange: (mode: PipelineMode) => void
  voiceEnabled: boolean
  onVoiceEnabledChange: (enabled: boolean) => void
  voiceStyle: VoiceStyle
  onVoiceStyleChange: (style: VoiceStyle) => void
}

export default function IdeaCapture({
  idea,
  onIdeaChange,
  onSubmit,
  isLoading,
  onKeyDown,
  mode,
  onModeChange,
  voiceEnabled,
  onVoiceEnabledChange,
  voiceStyle,
  onVoiceStyleChange,
}: IdeaCaptureProps) {
  const [showValidation, setShowValidation] = useState(false)
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const speech = useSpeechInput()

  const trimmed = idea.trim()
  const isEmpty = trimmed.length === 0
  const isTooShort = trimmed.length > 0 && trimmed.length < 10
  const isInvalid = isEmpty || isTooShort
  const isListening = speech.phase === 'listening'
  const isProcessing = speech.phase === 'processing'

  // Voice → idea sync
  const prevTranscriptRef = useRef('')
  useEffect(() => {
    if (speech.transcript === prevTranscriptRef.current) return
    prevTranscriptRef.current = speech.transcript
    if (speech.transcript) {
      onIdeaChange(speech.transcript)
      if (showValidation) setShowValidation(false)
    }
  }, [speech.transcript, onIdeaChange, showValidation])

  // Auto-switch to text when transcript ready
  useEffect(() => {
    if (speech.phase === 'ready' && speech.transcript) {
      setInputMode('text')
      setTimeout(() => textareaRef.current?.focus(), 80)
    }
  }, [speech.phase, speech.transcript])

  function handleSubmit() {
    if (isInvalid) { setShowValidation(true); return }
    if (speech.phase === 'listening') speech.stop()
    setShowValidation(false)
    onSubmit()
  }

  function handleMicClick() {
    if (!speech.isSupported) return
    if (isListening) {
      speech.stop()
    } else {
      speech.clear()
      onIdeaChange('')
      speech.start()
    }
  }

  function handleClear() {
    speech.clear()
    onIdeaChange('')
    setShowValidation(false)
  }

  return (
    <div className="ff-ic-root">

      {/* ── Header ── */}
      <div className="ff-ic-header">
        <div className="ff-ic-logo" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <h1 className="ff-ic-title">Describe your startup idea</h1>
          <p className="ff-ic-subtitle">Falcon will validate the market, generate a PRD, roadmap, and brief you like a co-founder.</p>
        </div>
      </div>

      {/* ── Input card ── */}
      <div className="ff-ic-card">

        {/* Mode toggle */}
        <div className="ff-ic-mode-row">
          <div className="ff-ic-mode-tabs" role="tablist">
            <button
              role="tab"
              type="button"
              className={`ff-ic-tab${inputMode === 'text' ? ' active' : ''}`}
              aria-selected={inputMode === 'text'}
              onClick={() => { setInputMode('text'); setTimeout(() => textareaRef.current?.focus(), 60) }}
              disabled={isLoading}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="9" y1="20" x2="15" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
              Type
            </button>
            <button
              role="tab"
              type="button"
              className={`ff-ic-tab${inputMode === 'voice' ? ' active' : ''}`}
              aria-selected={inputMode === 'voice'}
              onClick={() => setInputMode('voice')}
              disabled={isLoading}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
              Speak
            </button>
          </div>
          <span className="ff-ic-hint">
            <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to generate
          </span>
        </div>

        {/* ── TEXT MODE ── */}
        {inputMode === 'text' && (
          <div className="ff-ic-text-area-wrap">
            <textarea
              ref={textareaRef}
              id="startup-idea"
              className={`ff-ic-textarea${showValidation && isInvalid ? ' ff-ic-textarea--error' : ''}`}
              value={idea}
              onChange={e => {
                onIdeaChange(e.target.value)
                if (showValidation && e.target.value.trim().length >= 10) setShowValidation(false)
              }}
              onKeyDown={onKeyDown}
              placeholder="e.g. An AI platform that helps students find scholarships abroad…"
              disabled={isLoading}
              rows={5}
              aria-label="Your startup idea"
              aria-invalid={showValidation && isInvalid}
            />
            {speech.isSupported && (
              <button
                type="button"
                className={`ff-ic-inline-mic${isListening ? ' active' : ''}`}
                onClick={handleMicClick}
                disabled={isLoading || isProcessing}
                aria-label={isListening ? 'Stop recording' : 'Dictate with microphone'}
                title={isListening ? 'Stop recording' : 'Dictate'}
              >
                {isListening ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <rect x="5" y="5" width="14" height="14" rx="2" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="8" y1="22" x2="16" y2="22" />
                  </svg>
                )}
              </button>
            )}
            {isListening && (
              <div className="ff-ic-listening-bar" aria-live="polite">
                <span className="ff-ic-listening-dot" aria-hidden />
                Listening…
              </div>
            )}
          </div>
        )}

        {/* ── VOICE MODE ── */}
        {inputMode === 'voice' && (
          <div className="ff-ic-voice-stage" aria-live="polite">
            <button
              type="button"
              className={[
                'ff-ic-mic-btn',
                isListening ? 'ff-ic-mic-btn--listening' : '',
                isProcessing ? 'ff-ic-mic-btn--processing' : '',
                speech.phase === 'ready' && trimmed ? 'ff-ic-mic-btn--ready' : '',
                !speech.isSupported || isLoading ? 'ff-ic-mic-btn--disabled' : '',
              ].filter(Boolean).join(' ')}
              onClick={handleMicClick}
              disabled={!speech.isSupported || isLoading || isProcessing}
              aria-label={isListening ? 'Stop recording' : 'Start voice input'}
              aria-pressed={isListening}
            >
              {isListening && (
                <>
                  <span className="ff-ic-mic-ring ff-ic-mic-ring-1" aria-hidden />
                  <span className="ff-ic-mic-ring ff-ic-mic-ring-2" aria-hidden />
                </>
              )}
              {isProcessing ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                </svg>
              ) : isListening ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="5" y="5" width="14" height="14" rx="3" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </svg>
              )}
            </button>

            <p className="ff-ic-voice-label">
              {isListening ? 'Listening — speak your idea'
                : isProcessing ? 'Processing…'
                : speech.phase === 'ready' && trimmed ? 'Transcript ready'
                : speech.phase === 'error' ? (speech.errorMessage ?? 'Microphone error')
                : !speech.isSupported ? 'Requires Chrome or Edge'
                : 'Tap to speak'}
            </p>

            {trimmed && (
              <div className="ff-ic-transcript">
                <p>{trimmed}</p>
                <div className="ff-ic-transcript-actions">
                  <button type="button" onClick={() => setInputMode('text')}>Edit</button>
                  <button type="button" onClick={handleClear}>Re-record</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation errors */}
        {showValidation && isEmpty && (
          <p className="ff-ic-error" role="alert">Enter or speak your startup idea first.</p>
        )}
        {showValidation && isTooShort && (
          <p className="ff-ic-error" role="alert">Add a bit more detail (at least 10 characters).</p>
        )}

        {/* Char count */}
        {inputMode === 'text' && (
          <div className="ff-ic-char-count">
            <span className={trimmed.length > 1800 ? 'warn' : ''}>{trimmed.length} / 2000</span>
          </div>
        )}
      </div>

      {/* ── Settings row ── */}
      <div className="ff-ic-settings">

        {/* Pipeline mode */}
        <div className="ff-ic-setting-group">
          <span className="ff-ic-setting-label">Pipeline</span>
          <PipelineModeSelector value={mode} onChange={onModeChange} />
        </div>

        {/* Voice toggle */}
        <div className="ff-ic-setting-group ff-ic-setting-group--voice">
          <span className="ff-ic-setting-label">Voice advisor</span>
          <div className="ff-ic-voice-row">
            <button
              type="button"
              className={`ff-switch${voiceEnabled ? ' ff-switch-on' : ''}`}
              onClick={() => onVoiceEnabledChange(!voiceEnabled)}
              aria-pressed={voiceEnabled}
              aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              <span className="ff-switch-thumb" />
            </button>
            {voiceEnabled && (
              <VoiceStylePicker value={voiceStyle} onChange={onVoiceStyleChange} label="" id="ic-voice-style" />
            )}
          </div>
        </div>
      </div>

      {/* ── Submit ── */}
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading}
        className="ff-ic-submit"
      >
        {isLoading ? (
          <span className="ff-ic-submit-loading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
              </circle>
            </svg>
            Analyzing…
          </span>
        ) : (
          <>
            Generate Startup Package
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </>
        )}
      </Button>

      {/* ── Feature pills ── */}
      <div className="ff-ic-pills">
        <span className="ff-ic-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Market validation
        </span>
        <span className="ff-ic-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Full PRD
        </span>
        <span className="ff-ic-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Execution roadmap
        </span>
        <span className="ff-ic-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Voice briefing
        </span>
      </div>

    </div>
  )
}
