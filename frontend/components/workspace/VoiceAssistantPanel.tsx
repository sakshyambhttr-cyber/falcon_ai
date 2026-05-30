'use client'

import React from 'react'
import Card from '../Card'
import Button from '../Button'
import AssetImage from '../AssetImage'

export type VoiceStyle = 'neutral' | 'deep' | 'energetic' | 'calm'

export const VOICE_STYLE_MAP: Record<VoiceStyle, { label: string; voiceId: string }> = {
  neutral: { label: 'Neutral', voiceId: 'en-US-natalie' },
  deep: { label: 'Deep', voiceId: 'en-US-terrell' },
  energetic: { label: 'Energetic', voiceId: 'en-US-julia' },
  calm: { label: 'Calm', voiceId: 'en-US-miles' }
}

type VoiceAssistantPanelProps = {
  voiceEnabled: boolean
  onToggleVoice: (enabled: boolean) => void
  voiceStyle: VoiceStyle
  onVoiceStyleChange: (style: VoiceStyle) => void
  onPlaySummary: () => void
  isSpeaking: boolean
  isAnalyzing: boolean
  summaryAvailable: boolean
}

export default function VoiceAssistantPanel({
  voiceEnabled,
  onToggleVoice,
  voiceStyle,
  onVoiceStyleChange,
  onPlaySummary,
  isSpeaking,
  isAnalyzing,
  summaryAvailable
}: VoiceAssistantPanelProps) {
  return (
    <div className="ff-voice-panel">
      <div className="ff-voice-panel-header">
        <AssetImage asset="voice" size={24} alt="" />
        <div>
          <strong>Murf Voice Agent</strong>
          <span>AI summary playback</span>
        </div>
      </div>

      <Card>
        <label className="ff-voice-toggle-row">
          <span>Voice Assistant</span>
          <button
            type="button"
            className={`ff-switch${voiceEnabled ? ' ff-switch-on' : ''}`}
            onClick={() => onToggleVoice(!voiceEnabled)}
            aria-pressed={voiceEnabled}
          >
            <span className="ff-switch-thumb" />
          </button>
        </label>
      </Card>

      <Card>
        <div className="ff-voice-styles">
          <span className="ff-voice-styles-label">Voice style</span>
          <div className="ff-voice-style-grid">
            {(Object.keys(VOICE_STYLE_MAP) as VoiceStyle[]).map(style => (
              <button
                key={style}
                type="button"
                className={`ff-voice-style-btn${voiceStyle === style ? ' active' : ''}`}
                onClick={() => onVoiceStyleChange(style)}
              >
                {VOICE_STYLE_MAP[style].label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="ff-voice-wave-area">
        {isSpeaking || isAnalyzing ? (
          <div className="ff-live-waveform active">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="ff-live-bar"
                style={{ animationDelay: `${(i % 5) * 0.1}s` }}
              />
            ))}
          </div>
        ) : (
          <img src="/images/waveform.svg" alt="" className="ff-waveform" style={{ opacity: 0.5 }} />
        )}
      </div>

      <Button
        variant="primary"
        style={{ width: '100%' }}
        onClick={onPlaySummary}
        disabled={!summaryAvailable || isSpeaking || isAnalyzing}
      >
        {isSpeaking ? 'Playing…' : 'Play AI Summary'}
      </Button>

      <p className="ff-voice-hint">
        {voiceEnabled
          ? `Style: ${VOICE_STYLE_MAP[voiceStyle].label} — Murf when configured, browser voice fallback otherwise.`
          : 'Voice is off — enable to hear summaries.'}
      </p>
    </div>
  )
}
