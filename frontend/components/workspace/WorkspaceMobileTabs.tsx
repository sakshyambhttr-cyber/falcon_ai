'use client'

import { BarChart2, BotMessageSquare, FileText, Mic } from 'lucide-react'
import React from 'react'
import type { VoicePhase } from '../WorkspaceScreen'

export type MobileWorkspacePanel = 'stream' | 'nav' | 'voice'

type Props = {
  active: MobileWorkspacePanel
  onChange: (panel: MobileWorkspacePanel) => void
  // Phase 11: show live voice state on the Voice tab
  voicePhase?: VoicePhase
  isComplete?: boolean
}

const VOICE_ACTIVE_PHASES: VoicePhase[] = ['listening', 'thinking', 'preparing', 'speaking']

export default function WorkspaceMobileTabs({ active, onChange, voicePhase, isComplete }: Props) {
  const voiceIsActive = voicePhase ? VOICE_ACTIVE_PHASES.includes(voicePhase) : false

  return (
    <div className="ff-ws-mobile-tabs" role="tablist" aria-label="Workspace panels">

      <button
        type="button"
        role="tab"
        aria-selected={active === 'stream'}
        className={`ff-ws-tab-btn${active === 'stream' ? ' active' : ''}`}
        onClick={() => onChange('stream')}
        id="ws-tab-stream"
        aria-controls="ws-panel-stream"
      >
        <BotMessageSquare size={16} aria-hidden="true" />
        <span>Intelligence</span>
        {isComplete && active !== 'stream' && (
          <span className="ff-ws-tab-dot ff-ws-tab-dot--ready" aria-label="Ready" />
        )}
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={active === 'nav'}
        className={`ff-ws-tab-btn${active === 'nav' ? ' active' : ''}`}
        onClick={() => onChange('nav')}
        id="ws-tab-nav"
        aria-controls="ws-panel-nav"
      >
        <FileText size={16} aria-hidden="true" />
        <span>Documents</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={active === 'voice'}
        className={`ff-ws-tab-btn${active === 'voice' ? ' active' : ''}${voiceIsActive ? ' ff-ws-tab-btn--voice-active' : ''}`}
        onClick={() => onChange('voice')}
        id="ws-tab-voice"
        aria-controls="ws-panel-voice"
      >
        <Mic size={16} aria-hidden="true" />
        <span>
          {voiceIsActive && active !== 'voice'
            ? (voicePhase === 'speaking' ? 'Speaking…'
              : voicePhase === 'listening' ? 'Listening…'
              : 'Thinking…')
            : 'Voice'}
        </span>
        {voiceIsActive && (
          <span className={`ff-ws-tab-dot ff-ws-tab-dot--${voicePhase}`} aria-hidden="true" />
        )}
      </button>

    </div>
  )
}
