'use client'

/**
 * MURF FALCON — IDEA CAPTURE
 *
 * Two input modes:
 *   "voice" — big mic button, live transcript preview
 *   "text"  — plain textarea with inline mic button for dictation
 *
 * DATA FLOW (no feedback loops):
 *   Voice mode:  speech.transcript → onIdeaChange (one-way, via useEffect)
 *   Text mode:   textarea onChange → onIdeaChange (direct, no speech involvement)
 *   The textarea is a controlled input driven solely by the `idea` prop.
 *   speech.transcript is NEVER fed back into speech.append() or speech.start().
 */

import React, { useEffect, useRef, useState } from 'react'
import Button from '../Button'
import Card from '../Card'
import Panel from '../Panel'
import AssetImage from '../AssetImage'
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
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const speech = useSpeechInput()

  const trimmed = idea.trim()
  const isEmpty = trimmed.length === 0
  const isTooShort = trimmed.length > 0 && trimmed.length < 10
  const isInvalid = isEmpty || isTooShort

  // ── Voice → idea sync ────────────────────────────────────────────────────────
  // Only runs when speech.transcript changes (i.e. during/after recording).
  // The textarea onChange does NOT touch speech at all — no feedback loop.
  const prevTranscriptRef = useRef('')
  useEffect(() => {
    if (speech.transcript === prevTranscriptRef.current) return
    prevTranscriptRef.current = speech.transcript
    if (speech.transcript) {
      onIdeaChange(speech.transcript)
      if (showValidation) setShowValidation(false)
    }
  }, [speech.transcript, onIdeaChange, showValidation])

  // ── Auto-switch to text mode when transcript is finalized ────────────────────
  useEffect(() => {
    if (speech.phase === 'ready' && speech.transcript) {
      setInputMode('text')
      setTimeout(() => textareaRef.current?.focus(), 80)
    }
  }, [speech.phase, speech.transcript])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (isInvalid) { setShowValidation(true); return }
    if (speech.phase === 'listening') speech.stop()
    setShowValidation(false)
    onSubmit()
  }

  function handleMicClick() {
    if (!speech.isSupported) return
    if (speech.phase === 'listening') {
      speech.stop()
    } else {
      // Clear previous transcript and idea before starting a new session
      speech.clear()
      onIdeaChange('')
      speech.start()
    }
  }

  function handleSwitchToText() {
    if (speech.phase === 'listening') speech.stop()
    setInputMode('text')
    setTimeout(() => textareaRef.current?.focus(), 80)
  }

  function handleSwitchToVoice() {
    setInputMode('voice')
  }

  function handleClear() {
    speech.clear()
    onIdeaChange('')
    setShowValidation(false)
  }

  const isListening  = speech.phase === 'listening'
  const isProcessing = speech.phase === 'processing'

  return (
    <div className="ff-idea-capture">

      {/* ── Hero card ── */}
      <Card className="ff-idea-hero">
        <div className="ff-idea-hero-top">
          <span className="ff-logo-mark-wrap ff-idea-logo">
            <AssetImage asset="logo" size={22} alt="Murf Falcon" brand />
          </span>
          <div>
            <h1>Your AI Co-Founder</h1>
            <p>
              Speak or type your startup idea. Falcon validates the market, generates a PRD,
              builds your roadmap, and briefs you like a real co-founder.
            </p>
          </div>
        </div>
      </Card>

      {/* ── Main input panel ── */}
      <Panel title="Submit Your Startup Idea" className="ff-idea-form-panel">
        <div className="ff-idea-form">

          {/* ── Input mode toggle ── */}
          <div className="ff-idea-mode-toggle" role="tablist" aria-label="Input method">
            <button
              role="tab"
              type="button"
              className={`ff-idea-mode-tab${inputMode === 'voice' ? ' ff-idea-mode-tab--active' : ''}`}
              aria-selected={inputMode === 'voice'}
              onClick={handleSwitchToVoice}
              disabled={isLoading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
              Speak
            </button>
            <button
              role="tab"
              type="button"
              className={`ff-idea-mode-tab${inputMode === 'text' ? ' ff-idea-mode-tab--active' : ''}`}
              aria-selected={inputMode === 'text'}
              onClick={handleSwitchToText}
              disabled={isLoading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
              </svg>
              Type
            </button>
          </div>

          {/* ══ VOICE MODE ══════════════════════════════════════════════════════ */}
          {inputMode === 'voice' && (
            <div className="ff-idea-voice-input" aria-live="polite">

              <div className="ff-idea-mic-stage">
                {isListening && (
                  <>
                    <span className="ff-idea-mic-ring ff-idea-mic-ring-1" aria-hidden="true" />
                    <span className="ff-idea-mic-ring ff-idea-mic-ring-2" aria-hidden="true" />
                    <span className="ff-idea-mic-ring ff-idea-mic-ring-3" aria-hidden="true" />
                  </>
                )}

                <button
                  type="button"
                  className={[
                    'ff-idea-big-mic',
                    isListening  ? 'ff-idea-big-mic--listening'  : '',
                    isProcessing ? 'ff-idea-big-mic--processing' : '',
                    speech.phase === 'ready' && trimmed ? 'ff-idea-big-mic--ready' : '',
                    !speech.isSupported || isLoading ? 'ff-idea-big-mic--disabled' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={handleMicClick}
                  disabled={!speech.isSupported || isLoading || isProcessing}
                  aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                  aria-pressed={isListening}
                  title={!speech.isSupported ? 'Speech recognition requires Chrome or Edge' : undefined}
                >
                  {isProcessing ? (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                      </circle>
                    </svg>
                  ) : isListening ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                  ) : (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="2" width="6" height="12" rx="3" />
                      <path d="M5 10a7 7 0 0 0 14 0" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                      <line x1="8" y1="22" x2="16" y2="22" />
                    </svg>
                  )}
                </button>
              </div>

              <p className={`ff-idea-voice-status ff-idea-voice-status--${speech.phase}`}>
                {isListening && <span className="ff-idea-voice-dot" aria-hidden="true" />}
                {isListening    ? 'Listening… speak your idea'
                : isProcessing  ? 'Processing…'
                : speech.phase === 'ready' && trimmed ? 'Transcript ready — review below'
                : speech.phase === 'error' ? (speech.errorMessage ?? 'Microphone error')
                : !speech.isSupported ? 'Speech input requires Chrome or Edge'
                : 'Tap to speak your startup idea'}
              </p>

              {trimmed && (
                <div className="ff-idea-transcript-preview">
                  <p className="ff-idea-transcript-text">{trimmed}</p>
                  <div className="ff-idea-transcript-actions">
                    <button type="button" className="ff-idea-transcript-edit" onClick={handleSwitchToText}>
                      Edit
                    </button>
                    <button type="button" className="ff-idea-transcript-clear" onClick={handleClear} aria-label="Clear and re-record">
                      Re-record
                    </button>
                  </div>
                </div>
              )}

              {showValidation && isEmpty   && <p className="ff-idea-error" role="alert">Tap the mic and speak your startup idea first.</p>}
              {showValidation && isTooShort && <p className="ff-idea-error" role="alert">Too short — speak a bit more detail.</p>}
            </div>
          )}

          {/* ══ TEXT MODE ═══════════════════════════════════════════════════════ */}
          {inputMode === 'text' && (
            <div className="ff-idea-text-input">

              <div className="ff-idea-input-header">
                <label htmlFor="startup-idea" className="ff-idea-label">Your startup idea</label>
                <p className="ff-idea-hint" id="startup-idea-hint">
                  Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to generate
                </p>
              </div>

              <div className="ff-idea-textarea-wrap">
                {/*
                  CONTROLLED INPUT — onChange writes e.target.value directly to
                  parent state via onIdeaChange. No speech methods are called here.
                  This is the only place that drives the `idea` value when typing.
                */}
                <textarea
                  ref={textareaRef}
                  id="startup-idea"
                  className={`ff-idea-textarea${showValidation && isInvalid ? ' ff-input-error' : ''}`}
                  value={idea}
                  onChange={e => {
                    onIdeaChange(e.target.value)
                    if (showValidation && e.target.value.trim().length >= 10) {
                      setShowValidation(false)
                    }
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="e.g. An AI platform that helps students find scholarships abroad…"
                  disabled={isLoading}
                  rows={6}
                  aria-invalid={showValidation && isInvalid}
                  aria-describedby="startup-idea-hint"
                />

                {/* Inline mic button — starts a new voice session, result flows into idea */}
                {speech.isSupported && (
                  <button
                    type="button"
                    className={`ff-idea-inline-mic${isListening ? ' ff-idea-inline-mic--listening' : ''}`}
                    onClick={handleMicClick}
                    disabled={isLoading || isProcessing}
                    aria-label={isListening ? 'Stop recording' : 'Dictate with microphone'}
                    title={isListening ? 'Stop recording' : 'Dictate with microphone'}
                  >
                    {isListening ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <rect x="5" y="5" width="14" height="14" rx="2" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="2" width="6" height="12" rx="3" />
                        <path d="M5 10a7 7 0 0 0 14 0" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                        <line x1="8" y1="22" x2="16" y2="22" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {isListening && (
                <p className="ff-idea-mic-status ff-idea-mic-status--listening" aria-live="polite">
                  <span className="ff-idea-mic-pulse" aria-hidden="true" />
                  Listening… speak your idea
                </p>
              )}

              {showValidation && isEmpty    && <p className="ff-idea-error" role="alert">Enter or speak your startup idea before generating.</p>}
              {showValidation && isTooShort && <p className="ff-idea-error" role="alert">Add a bit more detail (at least 10 characters).</p>}

              <div className="ff-idea-char-count" aria-live="polite">
                <span className={trimmed.length > 1800 ? 'ff-idea-char-count--warn' : ''}>
                  {trimmed.length} / 2000
                </span>
              </div>
            </div>
          )}

          {/* ── Pipeline mode ── */}
          <div className="ff-idea-mode-block">
            <span className="ff-idea-label">Pipeline mode</span>
            <PipelineModeSelector value={mode} onChange={onModeChange} />
          </div>

          {/* ── Voice output toggle ── */}
          <div className="ff-idea-voice-block">
            <div className="ff-idea-voice-head">
              <span className="ff-idea-label">Murf voice advisor</span>
              <label className="ff-voice-toggle-row ff-voice-toggle-inline">
                <span>{voiceEnabled ? 'On' : 'Off'}</span>
                <button
                  type="button"
                  className={`ff-switch${voiceEnabled ? ' ff-switch-on' : ''}`}
                  onClick={() => onVoiceEnabledChange(!voiceEnabled)}
                  aria-pressed={voiceEnabled}
                >
                  <span className="ff-switch-thumb" />
                </button>
              </label>
            </div>
            {voiceEnabled ? (
              <VoiceStylePicker value={voiceStyle} onChange={onVoiceStyleChange} label="Female voice" id="idea-voice-style" />
            ) : (
              <p className="ff-idea-voice-off">Enable voice to hear your founder briefing after analysis.</p>
            )}
          </div>

          {/* ── Submit ── */}
          <div className="ff-idea-actions">
            <Button variant="primary" onClick={handleSubmit} disabled={isLoading} className="ff-idea-submit-btn">
              {isLoading ? 'Analyzing…' : 'Generate Startup Package'}
            </Button>
          </div>

        </div>
      </Panel>

      {/* ── Feature pills ── */}
      <div className="ff-idea-features">
        <Card>
          <span className="ff-icon-box"><AssetImage asset="prd" size={24} alt="" /></span>
          <strong>Validation + PRD</strong>
          <span>Structured documents, not raw JSON</span>
        </Card>
        <Card>
          <span className="ff-icon-box"><AssetImage asset="waveform" size={24} alt="" /></span>
          <strong>Voice Briefing</strong>
          <span>Murf AI advisor with TTS fallback</span>
        </Card>
        <Card>
          <span className="ff-icon-box"><AssetImage asset="roadmap" size={24} alt="" /></span>
          <strong>Live Roadmap</strong>
          <span>Phased execution plan</span>
        </Card>
      </div>

    </div>
  )
}
