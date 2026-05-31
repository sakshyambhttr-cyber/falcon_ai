'use client'

import React, { useMemo, useState } from 'react'
import Button from '../Button'
import Card from '../Card'
import Panel from '../Panel'
import AssetImage from '../AssetImage'
import { buildDocumentPack } from '../../modules/doc-generator'
import { renderMarkdown } from '../../lib/render-markdown'
import { intelligenceToLegacyResponse } from '../../lib/intelligence-state'
import type { IntelligenceUIState } from '../../lib/intelligence-state'
import { WORKSPACE_NAV, type WorkspaceNavSection } from '../../lib/workspace-sections'
import VoiceAssistantPanel, { type VoiceStyle } from './VoiceAssistantPanel'
import IntelligenceEventRenderer from './IntelligenceEventRenderer'
import WorkspaceMobileTabs, { type MobileWorkspacePanel } from './WorkspaceMobileTabs'
import type { VoicePhase } from '../WorkspaceScreen'

type AnalysisWorkspaceProps = {
  idea: string
  intelligence: IntelligenceUIState
  activeNav: WorkspaceNavSection
  onNavChange: (section: WorkspaceNavSection) => void
  voiceEnabled: boolean
  voiceStyle: VoiceStyle
  voicePhase: VoicePhase
  voiceText: string
  voiceError: string | null
  hasSpokenSummary: boolean
  onToggleVoice: (v: boolean) => void
  onVoiceStyleChange: (s: VoiceStyle) => void
  onPlaySummary: () => void
  onReplaySummary: () => void
  onStopSpeaking: () => void
  onAskFollowUp: (question: string) => void
  onExport: () => void
  // Phase 6: voice conversation mode
  voiceConversationMode: boolean
  onToggleConversationMode: (active: boolean) => void
  onRegisterAutoListen: (fn: (() => void) | null) => void
  // Phase 9: streaming
  isStreamingResponse: boolean
}

function ValidationScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  return (
    <div className="ff-score-ring" style={{ '--score': clamped } as React.CSSProperties}>
      <div className="ff-score-ring-inner">
        <strong>{clamped}</strong>
        <span>SCORE</span>
      </div>
    </div>
  )
}

export default function AnalysisWorkspace({
  idea,
  intelligence,
  activeNav,
  onNavChange,
  voiceEnabled,
  voiceStyle,
  voicePhase,
  voiceText,
  voiceError,
  hasSpokenSummary,
  onToggleVoice,
  onVoiceStyleChange,
  onPlaySummary,
  onReplaySummary,
  onStopSpeaking,
  onAskFollowUp,
  onExport,
  voiceConversationMode,
  onToggleConversationMode,
  onRegisterAutoListen,
  isStreamingResponse
}: AnalysisWorkspaceProps) {
  const [mobilePanel, setMobilePanel] = useState<MobileWorkspacePanel>('stream')
  const isLoading = intelligence.status === 'streaming' || intelligence.status === 'connecting'
  const legacy = useMemo(() => intelligenceToLegacyResponse(intelligence), [intelligence])

  const navContent = useMemo(() => {
    const { memory } = intelligence
    if (!legacy) {
      if (activeNav === 'executive-briefing') {
        return `# Executive Briefing\n\nSynthesizing co-founder advice for your concept...\n\n### Your Idea:\n${idea}`
      }
      return ''
    }
    const pack = buildDocumentPack(legacy)
    switch (activeNav) {
      case 'executive-briefing':
        return pack.executiveBriefing
      case 'validation':
        return pack.startupValidationReport
      case 'prd':
        return pack.prdDocument
      case 'roadmap':
        return pack.roadmapDocument
      case 'mvp-strategy':
        return pack.mvpStrategy
      case 'export':
        return `# Export Document Package\n\nYou're ready to download the full, professional, founder-grade operating pack for **${legacy.startupName || 'your startup idea'}**.\n\nThis complete bundle includes:\n- **Executive Briefing**\n- **Validation Report**\n- **PRD**\n- **Startup Roadmap**\n- **MVP Strategy**\n\nClick the button below in the sidebar to download your markdown package.`
      default:
        return ''
    }
  }, [activeNav, idea, intelligence, legacy])

  const title =
    intelligence.memory.final?.startup_name_suggestion ||
    legacy?.startupName ||
    'Intelligence Pipeline'

  const score = intelligence.memory.validation?.viability_score

  return (
    <div className="ff-analysis-workspace" data-mobile-panel={mobilePanel}>
      <WorkspaceMobileTabs active={mobilePanel} onChange={setMobilePanel} />

      {/* ── Left: Navigation sidebar ── */}
      <aside id="ws-panel-nav" className="ff-ws-nav ff-ws-panel" data-panel="nav">
        <Panel title="Workspace Navigation">
          <nav className="ff-ws-nav-list" aria-label="Workspace sections">
            {WORKSPACE_NAV.map(item => (
              <button
                key={item.id}
                type="button"
                className={`ff-ws-nav-item${activeNav === item.id ? ' active' : ''}`}
                onClick={() => {
                  onNavChange(item.id)
                  setMobilePanel('nav')
                }}
                aria-current={activeNav === item.id ? 'page' : undefined}
              >
                <AssetImage asset={item.icon} size={20} alt="" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          {activeNav === 'export' && legacy && (
            <Button
              variant="primary"
              style={{ width: '100%', marginTop: 12 }}
              onClick={onExport}
            >
              Export Founder Pack
            </Button>
          )}
        </Panel>
      </aside>

      {/* ── Center: Intelligence feed + document viewer ── */}
      <section id="ws-panel-stream" className="ff-ws-center ff-ws-panel" data-panel="stream">
        <Card className="ff-ws-center-header">
          <div>
            <h2>{title}</h2>
            <p>{intelligence.pipelineStatus || intelligence.status.toUpperCase()}</p>
          </div>
          {score != null && <ValidationScoreRing score={score} />}
        </Card>

        <Panel title="Intelligence Feed" className="ff-ws-stream-panel">
          <IntelligenceEventRenderer state={intelligence} />
        </Panel>

        <Panel
          title={WORKSPACE_NAV.find(n => n.id === activeNav)?.label || 'Document'}
          className="ff-ws-doc-panel"
        >
          <div className="ff-tab-content-container ff-ws-doc-view">
            {isLoading && !navContent ? (
              <div className="ff-loading-state">
                <div className="ff-skeleton ff-skeleton-line large" />
                <div className="ff-skeleton ff-skeleton-line" />
                <div className="ff-skeleton ff-skeleton-line" />
              </div>
            ) : (
              <div className="ff-ws-doc-view">{renderMarkdown(navContent)}</div>
            )}
          </div>
        </Panel>
      </section>

      {/* ── Right: Voice advisor panel ── */}
      <aside id="ws-panel-voice" className="ff-ws-voice ff-ws-panel" data-panel="voice">
        <Panel title="AI Voice Advisor">
          <VoiceAssistantPanel
            voiceEnabled={voiceEnabled}
            onToggleVoice={onToggleVoice}
            voiceStyle={voiceStyle}
            onVoiceStyleChange={onVoiceStyleChange}
            onPlaySummary={onPlaySummary}
            onReplaySummary={onReplaySummary}
            onStopSpeaking={onStopSpeaking}
            onAskFollowUp={onAskFollowUp}
            voicePhase={voicePhase}
            voiceText={voiceText}
            voiceError={voiceError}
            hasSpokenSummary={hasSpokenSummary}
            summaryAvailable={Boolean(intelligence.memory.final || intelligence.memory.validation)}
            voiceConversationMode={voiceConversationMode}
            onToggleConversationMode={onToggleConversationMode}
            onRegisterAutoListen={onRegisterAutoListen}
            isStreamingResponse={isStreamingResponse}
          />
        </Panel>
      </aside>
    </div>
  )
}
