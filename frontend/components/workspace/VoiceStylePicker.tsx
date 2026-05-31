'use client'

import React from 'react'
import { MURF_VOICE_PRESETS, type VoiceStyle } from '../../lib/murf-voices'

type VoiceStylePickerProps = {
  value: VoiceStyle
  onChange: (style: VoiceStyle) => void
  label?: string
  id?: string
}

export default function VoiceStylePicker({
  value,
  onChange,
  label = 'Voice style',
  id = 'voice-style'
}: VoiceStylePickerProps) {
  return (
    <div className="ff-voice-styles" role="group" aria-labelledby={id}>
      <span className="ff-voice-styles-label" id={id}>
        {label}
      </span>
      <div className="ff-voice-style-grid">
        {(Object.keys(MURF_VOICE_PRESETS) as VoiceStyle[]).map(style => {
          const preset = MURF_VOICE_PRESETS[style]
          return (
            <button
              key={style}
              type="button"
              className={`ff-voice-style-btn${value === style ? ' active' : ''}`}
              onClick={() => onChange(style)}
              aria-pressed={value === style}
            >
              <span className="ff-voice-style-name">{preset.label}</span>
              <span className="ff-voice-style-desc">{preset.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
