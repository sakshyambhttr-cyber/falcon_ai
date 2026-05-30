'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Button from './Button'
import Card from './Card'
import Panel from './Panel'
import SidebarShell from './SidebarShell'
import { buildDocumentPack, documentPackToMarkdown } from '../modules/doc-generator'
import { streamChatAnalysis, type StreamStage } from '../services/ai.service'
import type { AIEngineResponse } from '../types/core'

type WorkspaceStatus = 'idle' | 'analyzing' | 'speaking' | 'fallback'
type SidebarView = 'studio' | 'documents' | 'settings'

type SavedProject = {
  id: string
  name: string
  idea: string
  updatedAt: number
}

const defaultIdea =
  'I want to build an AI platform that helps students find scholarships abroad.'

const STAGE_LABELS: Record<StreamStage, string> = {
  thinking: 'Analyzing concept…',
  validation: 'Generating validation report…',
  prd: 'Synthesizing PRD…',
  roadmap: 'Building execution roadmap…',
  ready: 'Package ready',
  error: 'Analysis failed'
}

function renderMarkdown(md: string) {
  if (!md) return null
  const lines = md.split('\n')
  return lines.map((line, idx) => {
    if (line.startsWith('# ')) {
      return (
        <h1
          key={idx}
          style={{
            fontSize: 22,
            color: '#ebfcff',
            marginTop: 18,
            marginBottom: 12,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            paddingBottom: 6,
            fontWeight: 700
          }}
        >
          {line.slice(2)}
        </h1>
      )
    }
    if (line.startsWith('## ')) {
      return (
        <h2
          key={idx}
          style={{ fontSize: 18, color: 'var(--neon-blue)', marginTop: 16, marginBottom: 10, fontWeight: 600 }}
        >
          {line.slice(3)}
        </h2>
      )
    }
    if (line.startsWith('### ')) {
      return (
        <h3
          key={idx}
          style={{ fontSize: 15, color: 'var(--neon-cyan)', marginTop: 14, marginBottom: 8, fontWeight: 600 }}
        >
          {line.slice(4)}
        </h3>
      )
    }
    if (line.startsWith('> ')) {
      return (
        <blockquote
          key={idx}
          style={{
            borderLeft: '3px solid var(--neon-cyan)',
            background: 'rgba(0,255,240,0.02)',
            padding: '10px 14px',
            borderRadius: '0 8px 8px 0',
            margin: '12px 0',
            fontStyle: 'italic',
            color: '#bfeaf6'
          }}
        >
          {line.slice(2)}
        </blockquote>
      )
    }
    if (line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1)
      if (line.includes('---')) return null
      const isHeader = idx === 4 || (lines[idx - 1] && !lines[idx - 1].startsWith('|'))
      return (
        <div
          key={idx}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
            gap: 12,
            padding: '8px 12px',
            background: isHeader ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            fontWeight: isHeader ? 700 : 400
          }}
        >
          {cells.map((c, cIdx) => (
            <div key={cIdx} style={{ fontSize: 13, color: isHeader ? '#fff' : '#dff7fb' }}>
              {c}
            </div>
          ))}
        </div>
      )
    }
    if (line.startsWith('- ')) {
      const content = line.slice(2)
      if (content.startsWith('[ ] ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 6px 12px' }}>
            <input type="checkbox" readOnly checked={false} style={{ accentColor: 'var(--neon-blue)' }} />
            <span style={{ fontSize: 13.5, color: '#cfeff4' }}>{content.slice(4)}</span>
          </div>
        )
      }
      return (
        <li key={idx} style={{ marginLeft: 16, margin: '4px 0', fontSize: 13.5, color: '#cfeff4' }}>
          {content}
        </li>
      )
    }
    if (!line.trim()) return <div key={idx} style={{ height: 6 }} />
    return (
      <p key={idx} style={{ margin: '6px 0', fontSize: 13.5, lineHeight: 1.55, color: '#cfeff4' }}>
        {line}
      </p>
    )
  })
}

function ValidationScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  return (
    <div className="ff-score-ring" style={{ '--score': clamped } as React.CSSProperties}>
      <div className="ff-score-ring-inner">
        <strong>{clamped}</strong>
        <span>VIABILITY</span>
      </div>
    </div>
  )
}

export default function WorkspaceScreen() {
  const searchParams = useSearchParams()
  const [idea, setIdea] = useState(defaultIdea)
  const [response, setResponse] = useState<AIEngineResponse | null>(null)
  const [status, setStatus] = useState<WorkspaceStatus>('idle')
  const [streamStage, setStreamStage] = useState<StreamStage | null>(null)
  const [transcript, setTranscript] = useState(
    'Founder Falcon is ready. Describe your startup idea and I will generate validation, PRD, and roadmap outputs.'
  )
  const [activeTab, setActiveTab] = useState<'validation' | 'prd' | 'roadmap' | 'architecture' | 'pitch'>(
    'validation'
  )
  const [sidebarView, setSidebarView] = useState<SidebarView>('studio')
  const [projects, setProjects] = useState<SavedProject[]>([
    { id: 'default', name: 'Current concept', idea: defaultIdea, updatedAt: Date.now() }
  ])
  const [activeProjectId, setActiveProjectId] = useState('default')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoRan = useRef(false)

  const isLoading = status === 'analyzing'
  const hasOutput = Boolean(response)
  const showOutputPanel = hasOutput || isLoading

  const activeTabText = useMemo(() => {
    if (!response) return ''
    const pack = buildDocumentPack(response)
    switch (activeTab) {
      case 'validation':
        return pack.startupValidationReport
      case 'prd':
        return pack.prdDocument
      case 'roadmap':
        return pack.roadmapDocument
      case 'architecture':
        return pack.technicalDesignDocument
      case 'pitch':
        return pack.pitchDeckContent
      default:
        return ''
    }
  }, [response, activeTab])

  const documentList = useMemo(() => {
    if (!response) return []
    const pack = buildDocumentPack(response)
    return [
      { id: 'validation', label: 'Validation Report', tab: 'validation' as const },
      { id: 'prd', label: 'PRD Document', tab: 'prd' as const },
      { id: 'roadmap', label: 'Roadmap', tab: 'roadmap' as const },
      { id: 'architecture', label: 'Technical Design', tab: 'architecture' as const },
      { id: 'pitch', label: 'Pitch Deck', tab: 'pitch' as const },
      { id: 'export', label: 'Full Founder Pack', tab: 'validation' as const, full: documentPackToMarkdown(pack) }
    ]
  }, [response])

  const speakBrowserFallback = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setStatus('idle')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#>`\-|]/g, '').trim())
    utterance.onend = () => setStatus('idle')
    utterance.onerror = () => setStatus('idle')
    setStatus('speaking')
    window.speechSynthesis.speak(utterance)
  }, [])

  const speak = useCallback(
    async (text: string) => {
      setStatus('speaking')
      try {
        const res = await fetch('/api/murf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('audio/mpeg')) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current = audio
          audio.onended = () => {
            setStatus('idle')
            URL.revokeObjectURL(url)
          }
          audio.onerror = () => speakBrowserFallback(text)
          await audio.play()
          return
        }
        const payload = await res.json().catch(() => ({}))
        if (payload.fallback) speakBrowserFallback(text)
        else throw new Error('No audio stream')
      } catch {
        speakBrowserFallback(text)
      }
    },
    [speakBrowserFallback]
  )

  const runAnalysis = useCallback(async () => {
    if (audioRef.current) audioRef.current.pause()
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()

    setStatus('analyzing')
    setStreamStage('thinking')
    setTranscript(STAGE_LABELS.thinking)
    setResponse(null)

    const projectName =
      idea.length > 42 ? `${idea.slice(0, 42).trim()}…` : idea.trim() || 'Untitled concept'
    setProjects(prev => {
      const existing = prev.find(p => p.id === activeProjectId)
      const next = existing
        ? prev.map(p =>
            p.id === activeProjectId ? { ...p, name: projectName, idea, updatedAt: Date.now() } : p
          )
        : [
            { id: `proj-${Date.now()}`, name: projectName, idea, updatedAt: Date.now() },
            ...prev
          ]
      return next
    })

    try {
      await streamChatAnalysis(idea, (event, payload) => {
        if (event !== 'stage') return
        const { stage, message, data } = payload as {
          stage: StreamStage
          message?: string
          data?: AIEngineResponse['validation'] | AIEngineResponse['prd'] | AIEngineResponse['roadmap'] | AIEngineResponse
        }

        setStreamStage(stage)
        if (message) setTranscript(message)

        if (stage === 'validation' && data) {
          setResponse({
            validation: data as AIEngineResponse['validation'],
            prd: { title: 'Synthesizing…', features: [], userStories: [] },
            roadmap: []
          })
          setActiveTab('validation')
        } else if (stage === 'prd' && data) {
          setResponse(prev =>
            prev
              ? { ...prev, prd: data as AIEngineResponse['prd'] }
              : {
                  validation: { score: 0, summary: '' },
                  prd: data as AIEngineResponse['prd'],
                  roadmap: []
                }
          )
          setActiveTab('prd')
        } else if (stage === 'roadmap' && data) {
          setResponse(prev =>
            prev
              ? { ...prev, roadmap: data as AIEngineResponse['roadmap'] }
              : {
                  validation: { score: 0, summary: '' },
                  prd: { title: '', features: [], userStories: [] },
                  roadmap: data as AIEngineResponse['roadmap']
                }
          )
          setActiveTab('roadmap')
        } else if (stage === 'ready' && data) {
          const full = data as AIEngineResponse
          setResponse(full)
          setStatus('idle')
          setStreamStage('ready')
          setTranscript(full.validation.summary)
          const speechPrompt = `Analysis complete for ${full.prd.title}. Validation score is ${full.validation.score} percent. ${full.validation.summary}`
          speak(speechPrompt)
        }
      })
    } catch (err) {
      console.error('Analysis streaming failed:', err)
      setTranscript('Error streaming analysis. Check your connection and try again.')
      setStatus('fallback')
      setStreamStage('error')
      window.setTimeout(() => setStatus('idle'), 2500)
    }
  }, [idea, activeProjectId, speak])

  useEffect(() => {
    if (autoRan.current) return
    if (searchParams?.get('demo') === '1' || searchParams?.get('autostart') === '1') {
      autoRan.current = true
      runAnalysis()
    }
  }, [searchParams, runAnalysis])

  function exportDocuments() {
    if (!response) return
    const pack = buildDocumentPack(response)
    const blob = new Blob([documentPackToMarkdown(pack)], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const safeTitle = response.prd?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'startup'
    link.download = `founder-falcon-${safeTitle}-pack.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function loadProject(project: SavedProject) {
    setActiveProjectId(project.id)
    setIdea(project.idea)
    setResponse(null)
    setTranscript('Project loaded. Run analysis to regenerate deliverables for this concept.')
  }

  function handleComposerKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!isLoading) runAnalysis()
    }
  }

  return (
    <main className="ff-workspace">
      <SidebarShell>
        <Card style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="ff-workspace-title"
                  style={{ fontSize: 20, fontWeight: 700, color: 'var(--neon-blue)', letterSpacing: '0.04em' }}
                >
                  🦅 FOUNDER FALCON
                </div>
              </Link>
              <div className="ff-workspace-subtitle" style={{ opacity: 0.8 }}>
                AI STARTUP OS
              </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <Button
                variant={sidebarView === 'studio' ? 'primary' : 'ghost'}
                style={{ justifyContent: 'flex-start' }}
                onClick={() => setSidebarView('studio')}
              >
                🔮 Concept Studio
              </Button>
              <Button
                variant={sidebarView === 'documents' ? 'primary' : 'ghost'}
                style={{ justifyContent: 'flex-start' }}
                onClick={() => setSidebarView('documents')}
              >
                📂 Document vault
              </Button>
              <Button
                variant={sidebarView === 'settings' ? 'primary' : 'ghost'}
                style={{ justifyContent: 'flex-start' }}
                onClick={() => setSidebarView('settings')}
              >
                ⚙️ System Settings
              </Button>
            </nav>

            {sidebarView === 'studio' && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: '#8aaab5', marginBottom: 8, letterSpacing: '0.06em' }}>PROJECTS</div>
                {projects.map(project => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => loadProject(project)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      marginBottom: 6,
                      borderRadius: 8,
                      border:
                        activeProjectId === project.id
                          ? '1px solid rgba(0,229,255,0.35)'
                          : '1px solid rgba(255,255,255,0.05)',
                      background:
                        activeProjectId === project.id ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.02)',
                      color: '#dff7fb',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            )}

            {sidebarView === 'documents' && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {documentList.length === 0 ? (
                  <span style={{ fontSize: 12, color: '#8aaab5' }}>Run analysis to populate documents.</span>
                ) : (
                  documentList.map(doc => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setActiveTab(doc.tab)}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.02)',
                        color: '#bfeaf6',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      {doc.label}
                    </button>
                  ))
                )}
              </div>
            )}

            {sidebarView === 'settings' && (
              <div style={{ fontSize: 12, color: '#8aaab5', lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 8px' }}>Voice: Murf API when configured, browser TTS fallback otherwise.</p>
                <p style={{ margin: 0 }}>AI: Gemini when <code>GEMINI_API_KEY</code> is set; local structured engine otherwise.</p>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
            <div style={{ fontSize: 11, color: '#8aaab5', display: 'flex', justifyContent: 'space-between' }}>
              <span>Version</span>
              <span>1.0.0</span>
            </div>
          </div>
        </Card>
      </SidebarShell>

      <section className="ff-workspace-main">
        <Card className="ff-workspace-header">
          <div>
            <h1 className="ff-workspace-title" style={{ fontSize: 22, fontWeight: 800 }}>
              Futuristic Workspace
            </h1>
            <p className="ff-workspace-subtitle">
              {streamStage ? STAGE_LABELS[streamStage] : 'Voice-first co-founder, PRD developer, and validation engine.'}
            </p>
          </div>
          <Button variant="primary" onClick={runAnalysis} disabled={isLoading}>
            {isLoading ? 'Analyzing…' : 'Run Analysis'}
          </Button>
        </Card>

        <div className="ff-workspace-grid">
          <Panel title="AI Voice Assistant Interface" className="ff-chat-panel">
            <div className="ff-chat-feed">
              <div className="ff-chat-bubble ff-chat-bubble-ai">
                <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--neon-blue)', marginBottom: 6, fontWeight: 700 }}>
                  assistant
                </div>
                <div className={isLoading ? 'ff-typing' : ''}>
                  {isLoading ? (
                    <>
                      <span />
                      <span />
                      <span />
                    </>
                  ) : (
                    transcript
                  )}
                </div>
              </div>

              <div className="ff-chat-bubble ff-chat-bubble-user">
                <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--neon-cyan)', marginBottom: 6, fontWeight: 700 }}>
                  user
                </div>
                <div>{idea}</div>
              </div>
            </div>

            <button
              type="button"
              className="ff-voice-orb"
              onClick={() => !isLoading && runAnalysis()}
              aria-label="Run voice analysis"
              style={{ border: 'none', background: 'transparent', cursor: isLoading ? 'wait' : 'pointer', width: '100%' }}
            >
              <div
                className="ff-voice-orb-glow"
                style={{
                  position: 'absolute',
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 70%)',
                  animation:
                    status === 'speaking' || status === 'analyzing'
                      ? 'ff-orb-breathe 0.9s ease-in-out infinite'
                      : 'ff-orb-breathe 3.4s ease-in-out infinite'
                }}
              />
              <img
                className={status === 'speaking' || status === 'analyzing' ? 'ff-voice-orb-active' : ''}
                src="/images/voice.svg"
                alt="Voice orb"
                style={{
                  zIndex: 2,
                  transition: 'all 0.3s ease',
                  transform: status === 'speaking' ? 'scale(1.08)' : 'scale(1)'
                }}
              />
            </button>

            <div className="ff-chat-composer">
              <input
                className="ff-chat-input"
                value={idea}
                onChange={event => setIdea(event.target.value)}
                onKeyDown={handleComposerKey}
                placeholder="Describe your startup idea..."
                disabled={isLoading}
              />
              <Button variant="primary" onClick={runAnalysis} disabled={isLoading}>
                {isLoading ? '…' : 'Send'}
              </Button>
            </div>
          </Panel>

          <Panel title="Real-time Voice Waveform" className="ff-chat-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {status === 'speaking' ? (
                <div className="ff-live-waveform active" style={{ display: 'flex', alignItems: 'center', gap: 5, height: 80, width: '100%', justifyContent: 'center' }}>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="ff-live-bar"
                      style={{
                        width: 4,
                        height: 8,
                        background: 'var(--neon-cyan)',
                        borderRadius: 2,
                        animation: 'ff-bounce 0.9s ease-in-out infinite alternate',
                        animationDelay: `${(i % 6) * 0.12}s`
                      }}
                    />
                  ))}
                </div>
              ) : (
                <img
                  className={`ff-waveform ${status === 'analyzing' ? 'ff-waveform-active' : ''}`}
                  src="/images/waveform.svg"
                  alt="Speaking waveform"
                  style={{ opacity: status === 'analyzing' ? 1 : 0.4 }}
                />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
              <Card>
                <div className="ff-output-meta">
                  <span>Pipeline</span>
                  <span>{streamStage?.toUpperCase() || status.toUpperCase()}</span>
                </div>
                <div className="ff-output-body" style={{ fontSize: 12 }}>
                  {isLoading ? STAGE_LABELS[streamStage || 'thinking'] : status === 'speaking' ? 'Voice playback active.' : 'Standby — send an idea to begin.'}
                </div>
              </Card>
              <Card>
                <div className="ff-output-meta">
                  <span>Score</span>
                  <span>{response?.validation?.score ?? '—'}%</span>
                </div>
                <div className="ff-output-body" style={{ fontSize: 12 }}>
                  {response?.prd?.title ? `Product: ${response.prd.title}` : 'Awaiting validation…'}
                </div>
              </Card>
            </div>
          </Panel>
        </div>
      </section>

      <aside className="ff-output-stack" style={{ width: 400 }}>
        <Panel title="Workspace Document Pack" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
          {!showOutputPanel ? (
            <div className="ff-empty-state" style={{ minHeight: 320, flex: 1, justifyContent: 'center' }}>
              <strong style={{ color: 'var(--neon-blue)', fontSize: 16 }}>No documents yet</strong>
              <span style={{ fontSize: 12.5, opacity: 0.8 }}>
                Enter your startup idea and press Send or Run Analysis. Outputs stream live into this panel.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', minHeight: 0 }}>
              {response?.validation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '4px 0 8px' }}>
                  <ValidationScoreRing score={response.validation.score} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#8aaab5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Live validation
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.5, color: '#bfeaf6' }}>
                      {response.validation.summary}
                    </p>
                  </div>
                </div>
              )}

              {response?.roadmap && response.roadmap.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, color: '#8aaab5', letterSpacing: '0.06em' }}>ROADMAP PREVIEW</div>
                  {response.roadmap.map((phase, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neon-cyan)' }}>{phase.phase}</div>
                      <div style={{ fontSize: 11, color: '#8aaab5', marginTop: 4 }}>
                        {phase.tasks.length} tasks
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="ff-tabs-bar"
                style={{
                  display: 'flex',
                  gap: 3,
                  background: 'rgba(255,255,255,0.02)',
                  padding: 4,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.04)',
                  overflowX: 'auto'
                }}
              >
                {(['validation', 'prd', 'roadmap', 'architecture', 'pitch'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      padding: '7px 6px',
                      borderRadius: 7,
                      border: 'none',
                      background: activeTab === tab ? 'var(--neon-cyan)' : 'transparent',
                      color: activeTab === tab ? '#001' : '#8aaab5',
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="ff-tab-content-container" style={{ flex: 1, overflowY: 'auto', paddingRight: 6, minHeight: 0 }}>
                {isLoading && !activeTabText ? (
                  <div className="ff-loading-state" style={{ marginTop: 12 }}>
                    <div className="ff-loading-chip ff-skeleton" style={{ width: 140 }} />
                    <div className="ff-skeleton ff-skeleton-line large" style={{ height: 24, margin: '14px 0' }} />
                    <div className="ff-skeleton ff-skeleton-line" />
                    <div className="ff-skeleton ff-skeleton-line short" />
                  </div>
                ) : (
                  <div className="ff-markdown-body">{renderMarkdown(activeTabText)}</div>
                )}
              </div>

              {response && !isLoading && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                  <Button variant="primary" style={{ width: '100%' }} onClick={exportDocuments}>
                    Export Founder Pack (.md)
                  </Button>
                </div>
              )}
            </div>
          )}
        </Panel>
      </aside>
    </main>
  )
}
