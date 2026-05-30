'use client'

import React, { useMemo, useState } from 'react'
import Button from '../Button'
import Card from '../Card'
import Panel from '../Panel'
import AssetImage from '../AssetImage'
import { buildDocumentPack, documentPackToMarkdown } from '../../modules/doc-generator'
import { renderMarkdown } from '../../lib/render-markdown'
import { intelligenceToLegacyResponse } from '../../lib/intelligence-state'
import type { IntelligenceUIState } from '../../lib/intelligence-state'
import { WORKSPACE_NAV, type WorkspaceNavSection } from '../../lib/workspace-sections'
import VoiceAssistantPanel, { type VoiceStyle } from './VoiceAssistantPanel'
import IntelligenceEventRenderer from './IntelligenceEventRenderer'
import WorkspaceMobileTabs, { type MobileWorkspacePanel } from './WorkspaceMobileTabs'

type AnalysisWorkspaceProps = {
  idea: string
  intelligence: IntelligenceUIState
  activeNav: WorkspaceNavSection
  onNavChange: (section: WorkspaceNavSection) => void
  voiceEnabled: boolean
  voiceStyle: VoiceStyle
  isSpeaking: boolean
  onToggleVoice: (v: boolean) => void
  onVoiceStyleChange: (s: VoiceStyle) => void
  onPlaySummary: () => void
  onExport: () => void
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
  isSpeaking,
  onToggleVoice,
  onVoiceStyleChange,
  onPlaySummary,
  onExport
}: AnalysisWorkspaceProps) {
  const [mobilePanel, setMobilePanel] = useState<MobileWorkspacePanel>('stream')
  const isLoading = intelligence.status === 'streaming' || intelligence.status === 'connecting'
  const legacy = useMemo(() => intelligenceToLegacyResponse(intelligence), [intelligence])

  const navContent = useMemo(() => {
    const { memory } = intelligence
    if (!legacy) {
      if (activeNav === 'idea-overview') return `# Idea Overview\n\n${idea}`
      return ''
    }
    const pack = buildDocumentPack(legacy)
    switch (activeNav) {
      case 'idea-overview':
        return `# Idea Overview\n\n${idea}\n\n## Analysis\n${memory.analysis?.summary || ''}\n\n**Category:** ${memory.analysis?.category || '—'}`
      case 'market-analysis':
        return `# Market Analysis\n\n| Metric | Value |\n| --- | --- |\n| Size | ${memory.market?.market_size || '—'} |\n| Growth | ${memory.market?.growth_rate || '—'} |\n| Competition | ${memory.market?.competition_level || '—'} |`
      case 'validation':
        return pack.startupValidationReport
      case 'prd':
        return pack.prdDocument
      case 'roadmap':
        return pack.roadmapDocument
      case 'export':
        return '# Export\n\nDownload the full Founder Pack markdown bundle.'
      default:
        return ''
    }
  }, [activeNav, idea, intelligence, legacy])

  const title =
    intelligence.memory.final?.startup_name_suggestion ||
    legacy?.prd?.title ||
    'Intelligence Pipeline'

  const score = intelligence.memory.validation?.viability_score

  return (
    <div className="ff-analysis-workspace" data-mobile-panel={mobilePanel}>
      <WorkspaceMobileTabs active={mobilePanel} onChange={setMobilePanel} />

      <aside className="ff-ws-nav ff-ws-panel" data-panel="nav">
        <Panel title="Workspace Navigation">
          <nav className="ff-ws-nav-list">
            {WORKSPACE_NAV.map(item => (
              <button
                key={item.id}
                type="button"
                className={`ff-ws-nav-item${activeNav === item.id ? ' active' : ''}`}
                onClick={() => {
                  onNavChange(item.id)
                  setMobilePanel('nav')
                }}
              >
                <AssetImage asset={item.icon} size={20} alt="" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          {activeNav === 'export' && legacy && (
            <Button variant="primary" style={{ width: '100%', marginTop: 12 }} onClick={onExport}>
              Export Founder Pack
            </Button>
          )}
        </Panel>
      </aside>

      <section className="ff-ws-center ff-ws-panel" data-panel="stream">
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

        <Panel title={WORKSPACE_NAV.find(n => n.id === activeNav)?.label || 'Document'} className="ff-ws-doc-panel">
          <div className="ff-tab-content-container ff-ws-doc-view">
            {isLoading && !navContent ? (
              <div className="ff-loading-state">
                <div className="ff-skeleton ff-skeleton-line large" />
                <div className="ff-skeleton ff-skeleton-line" />
              </div>
            ) : (
              <div className="ff-markdown-body">{renderMarkdown(navContent)}</div>
            )}
          </div>
        </Panel>
      </section>

      <aside className="ff-ws-voice ff-ws-panel" data-panel="voice">
        <Panel title="AI Assistant">
          <VoiceAssistantPanel
            voiceEnabled={voiceEnabled}
            onToggleVoice={onToggleVoice}
            voiceStyle={voiceStyle}
            onVoiceStyleChange={onVoiceStyleChange}
            onPlaySummary={onPlaySummary}
            isSpeaking={isSpeaking}
            isAnalyzing={isLoading}
            summaryAvailable={Boolean(intelligence.memory.final || intelligence.memory.validation)}
          />
        </Panel>
      </aside>
    </div>
  )
}
