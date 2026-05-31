'use client'

/**
 * MURF FALCON — VOICE ASSISTANT PANEL
 *
 * Phase 6: Full voice conversation mode — speak → Gemini → voice response → auto-listen loop
 * Phase 8: Live feedback states — Listening / Thinking / Analyzing / Preparing Briefing / Speaking
 */

import React, { useEffect, useRef, useState } from 'react'
import Card from '../Card'
import Button from '../Button'
import AssetImage from '../AssetImage'
import VoiceStylePicker from './VoiceStylePicker'
import { useSpeechInput } from '../../hooks/useSpeechInput'
import type { VoicePhase } from '../WorkspaceScreen'

export type { VoiceStyle } from '../../lib/murf-voices'
export { MURF_VOICE_PRESETS as VOICE_STYLE_MAP } from '../../lib/murf-voices'

import type { VoiceStyle } from '../../lib/murf-voices'
import { MURF_VOICE_PRESETS } from '../../lib/murf-voices'

type VoiceAssistantPanelProps = {
  voiceEnabled: boolean
  onToggleVoice: (enabled: boolean) => void
  voiceStyle: VoiceStyle
  onVoiceStyleChange: (style: VoiceStyle) => void
  onPlaySummary: () => void
  onReplaySummary: () => void
  onStopSpeaking: () => void
  onAskFollowUp: (question: string) => void
  voicePhase: VoicePhase
  voiceText: string
  voiceError: string | null
  hasSpokenSummary: boolean
  summaryAvailable: boolean
  // Phase 6: conversation mode
  voiceConversationMode: boolean
  onToggleConversationMode: (active: boolean) => void
  onRegisterAutoListen: (fn: (() => void) | null) => void
  // Phase 9: streaming state
  isStreamingResponse: boolean
  // Phase 12: conversation history
  conversationHistory?: Array<{ role: 'user' | 'advisor'; text: string }>
}

// ─── PHASE CONFIG (Phase 8) ───────────────────────────────────────────────────

const PHASE_LABEL: Record<VoicePhase, string> = {
  idle:      'Ready',
  listening: 'Listening…',
  thinking:  'Thinking…',
  analyzing: 'Analyzing…',
  preparing: 'Preparing Briefing…',
  speaking:  'Speaking…',
  error:     'Error'
}

const PHASE_COLOR: Record<VoicePhase, string> = {
  idle:      'idle',
  listening: 'listening',
  thinking:  'thinking',
  analyzing: 'analyzing',
  preparing: 'preparing',
  speaking:  'speaking',
  error:     'error'
}

// ─── WAVEFORM ─────────────────────────────────────────────────────────────────

function LiveWaveform({ bars = 20, height = 48 }: { bars?: number; height?: number }) {
  return (
    <div className="ff-live-waveform active" style={{ height }} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} className="ff-live-bar" style={{ animationDelay: `${(i % 5) * 0.1}s` }} />
      ))}
    </div>
  )
}

function ProcessingDots() {
  return (
    <div className="ff-voice-processing-dots" aria-hidden="true">
      <span /><span /><span />
    </div>
  )
}

// ─── THINKING PULSE (Phase 8) ─────────────────────────────────────────────────

function ThinkingPulse({ label }: { label: string }) {
  return (
    <div className="ff-voice-thinking-pulse" aria-hidden="true">
      <div className="ff-voice-thinking-ring" />
      <div className="ff-voice-thinking-ring ff-voice-thinking-ring--2" />
      <div className="ff-voice-thinking-ring ff-voice-thinking-ring--3" />
      <span className="ff-voice-thinking-label">{label}</span>
    </div>
  )
}

// ─── ICONS ────────────────────────────────────────────────────────────────────

function MicIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}

function StopSquare({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  )
}

function SendIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function SpinnerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"
        strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate"
          from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

function ConversationIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function VoiceAssistantPanel({
  voiceEnabled,
  onToggleVoice,
  voiceStyle,
  onVoiceStyleChange,
  onPlaySummary,
  onReplaySummary,
  onStopSpeaking,
  onAskFollowUp,
  voicePhase,
  voiceText,
  voiceError,
  hasSpokenSummary,
  summaryAvailable,
  voiceConversationMode,
  onToggleConversationMode,
  onRegisterAutoListen,
  isStreamingResponse,
  conversationHistory = []
}: VoiceAssistantPanelProps) {
  const preset = MURF_VOICE_PRESETS[voiceStyle]
  const isSpeaking = voicePhase === 'speaking'
  const isThinking = voicePhase === 'thinking'
  const isPreparing = voicePhase === 'preparing'
  const isAnalyzing = voicePhase === 'analyzing'
  const isAdvisorBusy = isSpeaking || isThinking || isPreparing || isAnalyzing
  const canPlay = summaryAvailable && voiceEnabled && !isAdvisorBusy
  const hasError = voicePhase === 'error'

  const [followUp, setFollowUp] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const speech = useSpeechInput()
  const isListening = speech.phase === 'listening'
  const isMicProcessing = speech.phase === 'processing'

  // ── Phase 6: Register auto-listen callback with parent ────────────────────
  useEffect(() => {
    if (!voiceConversationMode || !voiceEnabled || !speech.isSupported) {
      onRegisterAutoListen(null)
      return
    }
    onRegisterAutoListen(() => {
      // Small delay so the user hears the response end before mic activates
      setTimeout(() => {
        speech.clear()
        setFollowUp('')
        speech.start()
      }, 600)
    })
    return () => { onRegisterAutoListen(null) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceConversationMode, voiceEnabled, speech.isSupported])

  // ── Sync speech transcript → input field ──────────────────────────────────
  const prevTranscriptRef = useRef('')
  useEffect(() => {
    if (speech.transcript === prevTranscriptRef.current) return
    prevTranscriptRef.current = speech.transcript
    if (speech.transcript) setFollowUp(speech.transcript)
  }, [speech.transcript])

  // ── Auto-submit when speech is finalized ──────────────────────────────────
  useEffect(() => {
    if (speech.phase !== 'ready') return
    const q = speech.transcript.trim()
    if (!q || isAdvisorBusy || !voiceEnabled) return
    onAskFollowUp(q)
    setFollowUp('')
    speech.clear()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.phase])

  // ── Barge-in: user starts speaking → stop advisor ─────────────────────────
  useEffect(() => {
    if (isListening && isSpeaking) {
      onStopSpeaking()
    }
  }, [isListening, isSpeaking, onStopSpeaking])

  function handleMicClick() {
    if (!speech.isSupported) return
    if (isListening) {
      speech.stop()
    } else {
      speech.clear()
      setFollowUp('')
      speech.start()
    }
  }

  function handleFollowUpSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = followUp.trim()
    if (!q || isAdvisorBusy || !voiceEnabled) return
    if (isListening) speech.stop()
    onAskFollowUp(q)
    setFollowUp('')
    speech.clear()
  }

  // ── Phase 8: Status label ─────────────────────────────────────────────────
  const statusLabel = (() => {
    if (!voiceEnabled) return 'Voice disabled'
    if (isListening) return 'Listening…'
    if (isMicProcessing) return 'Processing speech…'
    return PHASE_LABEL[voicePhase]
  })()

  const statusColor = (() => {
    if (!voiceEnabled) return 'idle'
    if (isListening) return 'listening'
    return PHASE_COLOR[voicePhase]
  })()

  // ── Phase 8: Center visualization ─────────────────────────────────────────
  const centerVisual = (() => {
    if (isSpeaking || isListening) return <LiveWaveform bars={20} height={48} />
    if (isThinking) return <ThinkingPulse label="Thinking…" />
    if (isPreparing) return <ThinkingPulse label="Preparing Briefing…" />
    if (isAnalyzing) return <ThinkingPulse label="Analyzing…" />
    return <AssetImage asset="waveform" size={48} alt="" className="ff-voice-wave-idle" />
  })()

  return (
    <div className="ff-voice-panel">

      {/* ── Header ── */}
      <div className="ff-voice-panel-header">
        <span className="ff-icon-box ff-feature-icon">
          <AssetImage asset="waveform" size={22} alt="" />
        </span>
        <div>
          <strong>Falcon Voice Advisor</strong>
          <span>{preset.label} · {preset.murfStyle}</span>
        </div>
      </div>

      {/* ── Phase 8: Live status bar ── */}
      <div
        className={`ff-voice-status-bar ff-voice-status-bar--${statusColor}${hasError ? ' ff-voice-status-bar--error' : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className={`ff-voice-status-dot ${statusColor}`} aria-hidden="true" />
        <span className="ff-voice-status-label">{statusLabel}</span>
        {(isThinking || isPreparing || isAnalyzing) && <ProcessingDots />}
        {isSpeaking && <LiveWaveform bars={8} height={24} />}
        {isListening && (
          <div className="ff-voice-listen-bars" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
        )}
      </div>

      {/* ── Advisor response text ── */}
      {voiceText ? (
        <div className="ff-voice-response-card">
          <span className="ff-voice-response-label">
            Advisor response
            {isStreamingResponse && <span className="ff-stream-badge">streaming</span>}
          </span>
          <p className="ff-voice-response-text">
            {voiceText}
            {isStreamingResponse && <span className="ff-stream-cursor" aria-hidden="true" />}
          </p>
        </div>
      ) : summaryAvailable ? (
        <div className="ff-voice-response-card ff-voice-response-card--empty">
          <span className="ff-voice-response-label">Advisor response</span>
          <p className="ff-voice-response-text ff-voice-response-text--muted">
            Press Play to hear the advisor summary.
          </p>
        </div>
      ) : (
        <div className="ff-voice-response-card ff-voice-response-card--empty">
          <span className="ff-voice-response-label">Advisor response</span>
          <p className="ff-voice-response-text ff-voice-response-text--muted">
            Run the intelligence pipeline to generate an advisor response.
          </p>
        </div>
      )}

      {/* ── Error message ── */}
      {voiceError && (
        <div className="ff-voice-error" role="alert">{voiceError}</div>
      )}

      {/* ── Phase 12: Conversation history ── */}
      {conversationHistory.length > 1 && (
        <details className="ff-voice-history">
          <summary className="ff-voice-history-summary">
            Conversation ({Math.floor(conversationHistory.length / 2)} exchanges)
          </summary>
          <div className="ff-voice-history-list">
            {conversationHistory.slice(-8).map((turn, i) => (
              <div
                key={i}
                className={`ff-voice-history-turn ff-voice-history-turn--${turn.role}`}
              >
                <span className="ff-voice-history-role">
                  {turn.role === 'user' ? 'You' : 'Falcon'}
                </span>
                <p className="ff-voice-history-text">{turn.text}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── Phase 8: Center visualization ── */}
      <div className="ff-voice-wave-area" aria-hidden="true">
        {centerVisual}
      </div>

      {/* ── Playback controls ── */}
      <div className="ff-voice-actions">
        {isSpeaking ? (
          <Button variant="outline" className="ff-voice-stop-btn" onClick={onStopSpeaking} aria-label="Stop speaking">
            ■ Stop
          </Button>
        ) : (
          <>
            <Button
              variant="primary"
              className="ff-voice-play-btn"
              onClick={onPlaySummary}
              disabled={!canPlay}
              aria-label={hasSpokenSummary ? 'Play advisor summary again' : 'Play advisor summary'}
            >
              ▶ {hasSpokenSummary ? 'Play Again' : 'Play Summary'}
            </Button>
            {hasSpokenSummary && (
              <Button
                variant="outline"
                className="ff-voice-replay-btn"
                onClick={onReplaySummary}
                disabled={!canPlay}
                aria-label="Replay advisor summary"
              >
                ↺ Replay
              </Button>
            )}
          </>
        )}
      </div>

      {/* ── Phase 6: Voice Conversation Mode toggle ── */}
      {summaryAvailable && voiceEnabled && speech.isSupported && (
        <div className={`ff-voice-convo-mode${voiceConversationMode ? ' ff-voice-convo-mode--active' : ''}`}>
          <div className="ff-voice-convo-mode-header">
            <ConversationIcon size={14} />
            <span>Voice Conversation Mode</span>
            <button
              type="button"
              className={`ff-switch${voiceConversationMode ? ' ff-switch-on' : ''}`}
              onClick={() => onToggleConversationMode(!voiceConversationMode)}
              aria-pressed={voiceConversationMode}
              aria-label={voiceConversationMode ? 'Disable voice conversation mode' : 'Enable voice conversation mode'}
            >
              <span className="ff-switch-thumb" />
            </button>
          </div>
          {voiceConversationMode && (
            <p className="ff-voice-convo-mode-hint">
              {isListening
                ? 'Listening — speak your question…'
                : isSpeaking
                  ? 'Falcon is speaking — start talking to interrupt'
                  : isAdvisorBusy
                    ? statusLabel
                    : 'Mic activates automatically after each response.'}
            </p>
          )}
        </div>
      )}

      {/* ── Follow-up: speak or type ── */}
      {summaryAvailable && voiceEnabled && (
        <form className="ff-voice-followup" onSubmit={handleFollowUpSubmit} aria-label="Ask a follow-up question">
          <label htmlFor="voice-followup-input" className="ff-voice-followup-label">
            Ask a follow-up
          </label>
          <div className="ff-voice-followup-row">
            {speech.isSupported && (
              <button
                type="button"
                className={`ff-voice-followup-mic${isListening ? ' ff-voice-followup-mic--listening' : ''}`}
                onClick={handleMicClick}
                disabled={isAdvisorBusy || isMicProcessing}
                aria-label={isListening ? 'Stop recording' : 'Speak your question'}
                title={isListening ? 'Stop recording' : 'Speak your question'}
              >
                {isListening ? <StopSquare size={12} /> : <MicIcon size={15} />}
              </button>
            )}
            <input
              ref={inputRef}
              id="voice-followup-input"
              type="text"
              className="ff-voice-followup-input"
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              placeholder={isListening ? 'Listening…' : 'Ask anything about your startup…'}
              disabled={isAdvisorBusy}
              autoComplete="off"
              maxLength={300}
            />
            <button
              type="submit"
              className="ff-voice-followup-btn"
              disabled={!followUp.trim() || isAdvisorBusy}
              aria-label="Send question"
            >
              {(isThinking || isPreparing) ? <SpinnerIcon /> : <SendIcon />}
            </button>
          </div>
          {isListening && followUp && (
            <p className="ff-voice-followup-transcript" aria-live="polite">
              <span className="ff-voice-followup-dot" aria-hidden="true" />
              {followUp}
            </p>
          )}
          {speech.phase === 'error' && speech.errorMessage && (
            <p className="ff-voice-followup-error" role="alert">{speech.errorMessage}</p>
          )}
        </form>
      )}

      {/* ── Toggle ── */}
      <Card>
        <label className="ff-voice-toggle-row" htmlFor="voice-toggle">
          <span>Voice Assistant</span>
          <button
            id="voice-toggle"
            type="button"
            className={`ff-switch${voiceEnabled ? ' ff-switch-on' : ''}`}
            onClick={() => onToggleVoice(!voiceEnabled)}
            aria-pressed={voiceEnabled}
            aria-label={voiceEnabled ? 'Disable voice assistant' : 'Enable voice assistant'}
          >
            <span className="ff-switch-thumb" />
          </button>
        </label>
      </Card>

      {voiceEnabled && (
        <Card>
          <VoiceStylePicker value={voiceStyle} onChange={onVoiceStyleChange} label="Voice character" id="panel-voice-style" />
        </Card>
      )}

      <p className="ff-voice-hint">
        {voiceEnabled
          ? (summaryAvailable
              ? (speech.isSupported
                  ? (voiceConversationMode
                      ? 'Conversation mode active — Falcon listens after each response.'
                      : 'Tap the mic or type to ask anything about your startup.')
                  : 'Type a question to continue the conversation.')
              : 'Run the pipeline to start the conversation.')
          : 'Enable voice to hear the startup advisor response after analysis.'}
      </p>
    </div>
  )
}
