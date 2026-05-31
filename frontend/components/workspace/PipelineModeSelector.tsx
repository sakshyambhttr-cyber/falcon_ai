'use client'

import React from 'react'
import type { PipelineMode } from '../../types/events'

const MODES: Array<{ id: PipelineMode; label: string; description: string }> = [
  {
    id: 'full',
    label: 'Full OS',
    description: 'Validation, PRD, roadmap & export'
  },
  {
    id: 'fast',
    label: 'Fast',
    description: 'Core intelligence in fewer stages'
  },
  {
    id: 'validate_only',
    label: 'Validate Only',
    description: 'Market fit & viability focus'
  }
]

type PipelineModeSelectorProps = {
  value: PipelineMode
  onChange: (mode: PipelineMode) => void
}

export default function PipelineModeSelector({ value, onChange }: PipelineModeSelectorProps) {
  return (
    <div className="ff-mode-selector" role="radiogroup" aria-label="Pipeline mode">
      {MODES.map(mode => (
        <button
          key={mode.id}
          type="button"
          role="radio"
          aria-checked={value === mode.id}
          className={`ff-mode-option${value === mode.id ? ' ff-mode-option-active' : ''}`}
          onClick={() => onChange(mode.id)}
        >
          <span className="ff-mode-option-label">{mode.label}</span>
          <span className="ff-mode-option-desc">{mode.description}</span>
        </button>
      ))}
    </div>
  )
}
