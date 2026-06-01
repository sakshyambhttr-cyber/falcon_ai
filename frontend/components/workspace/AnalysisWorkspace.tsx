'use client'

/**
 * FOUNDER FALCON — ANALYSIS WORKSPACE (Command Center Redesign)
 *
 * Layout: Left nav | Center chat | Right tabbed docs
 * Inspired by: Linear, Cursor, Vercel, Notion
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../Button'
import AssetImage from '../AssetImage'
import { buildDocumentPack } from '../../modules/doc-generator'
import { renderMarkdown } from '../../lib/render-markdown'
import { intelligenceToLegacyResponse } from '../../lib/intelligence-state'
import type { IntelligenceUIState } from '../../lib/intelligence-state'
import { WORKSPACE_NAV, type WorkspaceNavSection } from '../../lib/workspace-sections'
import type { VoiceStyle } from './VoiceAssistantPanel'
import IntelligenceEventRenderer from './IntelligenceEventRenderer'
import type { VoicePhase } from '../WorkspaceScreen'
import { useSpeechInput } from '../../hooks/useSpeechInput'
import { MURF_VOICE_PRESETS } from '../../lib/murf-voices'

// ─── TYPES ────────────────────────────────────────────────────────────────────

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
  onNewIdea: () => void
  voiceConversationMode: boolean
  onToggleConversationMode: (active: boolean) => void
  onRegisterAutoListen: (fn: (() => void) | null) => void
  isStreamingResponse: boolean
  conversationHistory: Array<{ role: 'user' | 'advisor'; text: string }>
}

// ─── SCORE RING ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? '#34d399' : score >= 55 ? '#f59e0b' : '#f87171'
  return (
    <div className="ff-cmd-score-badge" style={{ '--score-color': color } as React.CSSProperties}>
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 100) * 94.2} 94.2`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span>{score}</span>
    </div>
  )
}

// ─── VOICE STATUS INDICATOR ───────────────────────────────────────────────────

function VoiceStatusDot({ phase }: { phase: VoicePhase }) {
  if (phase === 'idle') return null
  const labels: Partial<Record<VoicePhase, string>> = {
    listening: 'Listening',
    thinking: 'Thinking',
    analyzing: 'Analyzing',
    preparing: 'Preparing',
    speaking: 'Speaking',
    error: 'Error',
  }
  const colors: Partial<Record<VoicePhase, string>> = {
    listening: '#34d399',
    thinking: '#f59e0b',
    analyzing: '#4f9cf9',
    preparing: '#a78bfa',
    speaking: '#00d4f5',
    error: '#f87171',
  }
  return (
    <div className="ff-cmd-voice-dot" style={{ '--dot-color': colors[phase] } as React.CSSProperties}>
      <span className="ff-cmd-voice-dot-ring" aria-hidden />
      <span>{labels[phase]}</span>
    </div>
  )
}

// ─── CHAT MESSAGE ─────────────────────────────────────────────────────────────

function ChatMessage({ role, text, isStreaming }: { role: 'user' | 'advisor'; text: string; isStreaming?: boolean }) {
  return (
    <div className={`ff-cmd-msg ff-cmd-msg--${role}`}>
      <div className="ff-cmd-msg-avatar" aria-hidden>
        {role === 'advisor' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </div>
      <div className="ff-cmd-msg-body">
        <span className="ff-cmd-msg-role">{role === 'advisor' ? 'Falcon' : 'You'}</span>
        <p className="ff-cmd-msg-text">
          {text}
          {isStreaming && <span className="ff-stream-cursor" aria-hidden />}
        </p>
      </div>
    </div>
  )
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

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
  onNewIdea,
  voiceConversationMode,
  onToggleConversationMode,
  onRegisterAutoListen,
  isStreamingResponse,
  conversationHistory,
}: AnalysisWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceNavSection>('executive-briefing')
  const [followUp, setFollowUp] = useState('')
  const [mobileView, setMobileView] = useState<'chat' | 'docs'>('chat')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatMessagesRef = useRef<HTMLDivElement>(null)
  const docContentRef = useRef<HTMLDivElement>(null)
  const shouldStickToBottomRef = useRef(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const speech = useSpeechInput()
  const preset = MURF_VOICE_PRESETS[voiceStyle]

  const isLoading = intelligence.status === 'streaming' || intelligence.status === 'connecting'
  const isComplete = intelligence.status === 'complete'
  const legacy = useMemo(() => intelligenceToLegacyResponse(intelligence), [intelligence])
  const score = intelligence.memory.validation?.viability_score
  const startupName = intelligence.memory.final?.startup_name_suggestion || 'Intelligence Pipeline'
  const isAdvisorBusy = ['speaking', 'thinking', 'preparing', 'analyzing'].includes(voicePhase)
  const isListening = speech.phase === 'listening'

  function handleChatScroll() {
    const el = chatMessagesRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    shouldStickToBottomRef.current = distanceFromBottom < 80
  }

  // Scroll chat to bottom on new messages, but only if the user is already near the bottom
  useEffect(() => {
    if (!shouldStickToBottomRef.current) return
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory, voiceText])

  useEffect(() => {
    docContentRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeTab])

  // Register auto-listen
  useEffect(() => {
    if (!voiceConversationMode || !voiceEnabled || !speech.isSupported) {
      onRegisterAutoListen(null)
      return
    }
    onRegisterAutoListen(() => {
      setTimeout(() => { speech.clear(); setFollowUp(''); speech.start() }, 600)
    })
    return () => { onRegisterAutoListen(null) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceConversationMode, voiceEnabled, speech.isSupported])

  // Sync speech → input
  const prevTranscriptRef = useRef('')
  useEffect(() => {
    if (speech.transcript === prevTranscriptRef.current) return
    prevTranscriptRef.current = speech.transcript
    if (speech.transcript) setFollowUp(speech.transcript)
  }, [speech.transcript])

  // Auto-submit on speech ready
  useEffect(() => {
    if (speech.phase !== 'ready') return
    const q = speech.transcript.trim()
    if (!q || isAdvisorBusy || !voiceEnabled) return
    onAskFollowUp(q)
    setFollowUp('')
    speech.clear()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.phase])

  // Barge-in
  useEffect(() => {
    if (isListening && voicePhase === 'speaking') onStopSpeaking()
  }, [isListening, voicePhase, onStopSpeaking])

  function handleMicClick() {
    if (!speech.isSupported) return
    if (isListening) { speech.stop() } else { speech.clear(); setFollowUp(''); speech.start() }
  }

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    const q = followUp.trim()
    if (!q || isAdvisorBusy) return
    if (isListening) speech.stop()
    onAskFollowUp(q)
    setFollowUp('')
    speech.clear()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // Tab document content
  const tabContent = useMemo(() => {
    if (!legacy) {
      if (activeTab === 'executive-briefing') {
        return `# Executive Briefing\n\nAnalyzing your startup concept...\n\n**Idea:** ${idea}`
      }
      return ''
    }
    const pack = buildDocumentPack(legacy)
    switch (activeTab) {
      case 'executive-briefing': return pack.executiveBriefing
      case 'validation': return pack.startupValidationReport
      case 'prd': return pack.prdDocument
      case 'roadmap': return pack.roadmapDocument
      case 'mvp-strategy': return pack.mvpStrategy
      case 'export': return `# Export\n\nDownload the full document pack for **${legacy.startupName}**.`
      default: return ''
    }
  }, [activeTab, idea, legacy])

  const DOC_TABS: { id: WorkspaceNavSection; label: string; short: string }[] = [
    { id: 'executive-briefing', label: 'Summary', short: 'Summary' },
    { id: 'validation', label: 'Validation', short: 'Validation' },
    { id: 'prd', label: 'PRD', short: 'PRD' },
    { id: 'roadmap', label: 'Roadmap', short: 'Roadmap' },
    { id: 'mvp-strategy', label: 'MVP', short: 'MVP' },
  ]

  return (
    <div className="ff-cmd-workspace">

      {/* ══ LEFT NAV ══════════════════════════════════════════════════════════ */}
      <aside className="ff-cmd-nav">
        {/* Project header */}
        <div className="ff-cmd-nav-project">
          <div className="ff-cmd-nav-project-icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="ff-cmd-nav-project-info">
            <span className="ff-cmd-nav-project-name">{startupName}</span>
            <span className="ff-cmd-nav-project-status">
              {isLoading ? 'Analyzing…' : isComplete ? 'Complete' : 'Processing'}
            </span>
          </div>
          {score != null && <ScoreBadge score={score} />}
        </div>

        {/* Nav items */}
        <nav className="ff-cmd-nav-list" aria-label="Workspace sections">
          <span className="ff-cmd-nav-section-label">Documents</span>
          {DOC_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`ff-cmd-nav-item${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => { setActiveTab(tab.id); onNavChange(tab.id) }}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="ff-cmd-nav-item-dot" aria-hidden />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Voice status */}
        <div className="ff-cmd-nav-voice">
          <span className="ff-cmd-nav-section-label">AI Advisor</span>
          <div className="ff-cmd-nav-voice-row">
            <div className={`ff-cmd-nav-voice-indicator ff-cmd-nav-voice-indicator--${voicePhase}`} aria-hidden />
            <span className="ff-cmd-nav-voice-name">{preset.label}</span>
            <button
              type="button"
              className={`ff-cmd-voice-toggle-btn${voiceEnabled ? ' active' : ''}`}
              onClick={() => onToggleVoice(!voiceEnabled)}
              aria-pressed={voiceEnabled}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
          </div>
          <VoiceStatusDot phase={voicePhase} />
        </div>

        {/* Export */}
        <div className="ff-cmd-nav-footer">
          <button
            type="button"
            className="ff-cmd-new-idea-btn"
            onClick={onNewIdea}
            aria-label="Start a new idea"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Idea
          </button>
          {legacy && (
            <button type="button" className="ff-cmd-export-btn" onClick={onExport}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Pack
            </button>
          )}
        </div>
      </aside>

      {/* ══ CENTER: AI CHAT ════════════════════════════════════════════════════ */}
      <main className="ff-cmd-chat" aria-label="AI Co-founder Chat">

        {/* Chat header */}
        <div className="ff-cmd-chat-header">
          <div className="ff-cmd-chat-header-left">
            <span className="ff-cmd-chat-title">AI Co-Founder</span>
            {isLoading && (
              <span className="ff-cmd-chat-live-badge">
                <span className="ff-cmd-live-dot" aria-hidden />
                Live
              </span>
            )}
          </div>
          {voicePhase !== 'idle' && (
            <div className="ff-cmd-chat-voice-status">
              <VoiceStatusDot phase={voicePhase} />
              {voicePhase === 'speaking' && (
                <button type="button" className="ff-cmd-stop-btn" onClick={onStopSpeaking}>
                  ■ Stop
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chat messages */}
        <div
          ref={chatMessagesRef}
          className="ff-cmd-chat-messages"
          role="log"
          aria-live="polite"
          aria-label="Conversation"
          onScroll={handleChatScroll}
        >

        {/* Pipeline feed — shown while streaming — compact status only */}
        {(isLoading || intelligence.events.length > 0) && (
          <div className="ff-cmd-pipeline-feed">
            {isLoading ? (
              <div className="ff-cmd-pipeline-status">
                <span className="ff-cmd-pipeline-dot" aria-hidden />
                <span className="ff-cmd-pipeline-label">
                  {intelligence.pipelineStatus
                    ? intelligence.pipelineStatus.replace('.', ' › ').replace(/_/g, ' ')
                    : 'Initializing pipeline…'}
                </span>
                <div className="ff-cmd-pipeline-steps">
                  {intelligence.memory.analysis && <span className="ff-cmd-step done">Idea</span>}
                  {intelligence.memory.market && <span className="ff-cmd-step done">Market</span>}
                  {intelligence.memory.validation && <span className="ff-cmd-step done">Validation</span>}
                  {Object.keys(intelligence.memory.prd).length > 0 && <span className="ff-cmd-step done">PRD</span>}
                  {intelligence.memory.roadmap.length > 0 && <span className="ff-cmd-step done">Roadmap</span>}
                  {!intelligence.memory.analysis && <span className="ff-cmd-step pending">Idea</span>}
                  {!intelligence.memory.market && <span className="ff-cmd-step pending">Market</span>}
                  {!intelligence.memory.validation && <span className="ff-cmd-step pending">Validation</span>}
                  {Object.keys(intelligence.memory.prd).length === 0 && <span className="ff-cmd-step pending">PRD</span>}
                  {intelligence.memory.roadmap.length === 0 && <span className="ff-cmd-step pending">Roadmap</span>}
                </div>
              </div>
            ) : isComplete ? (
              <div className="ff-cmd-pipeline-complete">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Analysis complete — ask anything about your startup
              </div>
            ) : null}
          </div>
        )}

          {/* Conversation history */}
          {conversationHistory.map((turn, i) => (
            <ChatMessage
              key={i}
              role={turn.role}
              text={turn.text}
              isStreaming={isStreamingResponse && i === conversationHistory.length - 1 && turn.role === 'advisor'}
            />
          ))}

          {/* Streaming response (before it's committed to history) */}
          {isStreamingResponse && voiceText && conversationHistory[conversationHistory.length - 1]?.text !== voiceText && (
            <ChatMessage role="advisor" text={voiceText} isStreaming />
          )}

          {/* Voice error */}
          {voiceError && (
            <div className="ff-cmd-error-msg" role="alert">{voiceError}</div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div className="ff-cmd-chat-input-area">
          {/* Play summary button — shown when analysis is complete and no conversation yet */}
          {isComplete && conversationHistory.length === 0 && !isStreamingResponse && (
            <button
              type="button"
              className="ff-cmd-play-summary-btn"
              onClick={onPlaySummary}
              disabled={isAdvisorBusy}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {hasSpokenSummary ? 'Play Again' : 'Play Advisor Briefing'}
            </button>
          )}

          <form className="ff-cmd-input-form" onSubmit={handleSend} aria-label="Ask a follow-up">
            {speech.isSupported && (
              <button
                type="button"
                className={`ff-cmd-mic-btn${isListening ? ' active' : ''}`}
                onClick={handleMicClick}
                disabled={isAdvisorBusy && !isListening}
                aria-label={isListening ? 'Stop recording' : 'Speak your question'}
                title={isListening ? 'Stop recording' : 'Speak your question'}
              >
                {isListening ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <rect x="5" y="5" width="14" height="14" rx="2" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="8" y1="22" x2="16" y2="22" />
                  </svg>
                )}
              </button>
            )}
            <input
              ref={inputRef}
              type="text"
              className="ff-cmd-input"
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening…' : isAdvisorBusy ? 'Falcon is responding…' : 'Ask anything about your startup…'}
              disabled={isAdvisorBusy && !isListening}
              autoComplete="off"
              maxLength={400}
            />
            <button
              type="submit"
              className="ff-cmd-send-btn"
              disabled={!followUp.trim() || isAdvisorBusy}
              aria-label="Send"
            >
              {isAdvisorBusy ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>

          {speech.phase === 'error' && speech.errorMessage && (
            <p className="ff-cmd-mic-error" role="alert">{speech.errorMessage}</p>
          )}
        </div>
      </main>

      {/* ══ RIGHT: TABBED DOCS ════════════════════════════════════════════════ */}
      <aside className="ff-cmd-docs">
        {/* Tab bar */}
        <div className="ff-cmd-tabs" role="tablist" aria-label="Document tabs">
          {DOC_TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              className={`ff-cmd-tab${activeTab === tab.id ? ' active' : ''}`}
              aria-selected={activeTab === tab.id}
              onClick={() => { setActiveTab(tab.id); onNavChange(tab.id) }}
            >
              {tab.short}
            </button>
          ))}
        </div>

        {/* Doc content */}
        <div ref={docContentRef} className="ff-cmd-doc-content" role="tabpanel">
          {isLoading && !tabContent ? (
            <div className="ff-cmd-doc-loading">
              <div className="ff-skeleton ff-skeleton-line large" />
              <div className="ff-skeleton ff-skeleton-line" />
              <div className="ff-skeleton ff-skeleton-line" />
              <div className="ff-skeleton ff-skeleton-line" style={{ width: '70%' }} />
            </div>
          ) : tabContent ? (
            <div className="ff-cmd-doc-body ff-ws-doc-view">
              {renderMarkdown(tabContent)}
            </div>
          ) : (
            <div className="ff-cmd-doc-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p>Run the analysis to generate this document.</p>
            </div>
          )}
        </div>

        {/* Doc footer actions */}
        {legacy && (
          <div className="ff-cmd-doc-footer">
            <button
              type="button"
              className="ff-cmd-doc-export-btn"
              onClick={onExport}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export all docs
            </button>
          </div>
        )}
      </aside>

      {/* Mobile bottom tabs */}
      <div className="ff-cmd-mobile-tabs">
        <button
          type="button"
          className={`ff-cmd-mobile-tab${mobileView === 'chat' ? ' active' : ''}`}
          onClick={() => setMobileView('chat')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Chat
        </button>
        <button
          type="button"
          className={`ff-cmd-mobile-tab${mobileView === 'docs' ? ' active' : ''}`}
          onClick={() => setMobileView('docs')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Docs
          {isComplete && <span className="ff-cmd-mobile-tab-dot" aria-hidden />}
        </button>
      </div>
    </div>
  )
}
