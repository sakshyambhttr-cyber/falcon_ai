'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { buildDocumentPack, documentPackToMarkdown } from '../modules/doc-generator'
import { intelligenceToLegacyResponse } from '../lib/intelligence-state'
import { useIntelligenceStream } from '../hooks/useIntelligenceStream'
import type { WorkspaceNavSection } from '../lib/workspace-sections'
import type { PipelineMode } from '../types/events'
import IdeaCapture from './workspace/IdeaCapture'
import AnalysisWorkspace from './workspace/AnalysisWorkspace'
import { VOICE_STYLE_MAP, type VoiceStyle } from './workspace/VoiceAssistantPanel'

type WorkspaceStatus = 'idle' | 'speaking'

const defaultIdea =
  'I want to build an AI platform that helps students find scholarships abroad.'

export default function WorkspaceScreen() {
  const searchParams = useSearchParams()
  const { state: intelligence, startPipeline, reset } = useIntelligenceStream()
  const [idea, setIdea] = useState(defaultIdea)
  const [status, setStatus] = useState<WorkspaceStatus>('idle')
  const [activeNav, setActiveNav] = useState<WorkspaceNavSection>('idea-overview')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('neutral')
  const [mode, setMode] = useState<PipelineMode>('full')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoRan = useRef(false)
  const spokeOnComplete = useRef(false)

  const isLoading =
    intelligence.status === 'streaming' || intelligence.status === 'connecting'
  const inAnalysisMode =
    isLoading || intelligence.status === 'complete' || intelligence.events.length > 0

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
    async (text: string, force = false) => {
      if (!voiceEnabled && !force) return
      setStatus('speaking')
      try {
        const res = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: voiceStyle, speed: 1 })
        })
        const payload = await res.json()
        if (payload.audio_url && !payload.fallback) {
          const audioRes = await fetch(payload.audio_url)
          const blob = await audioRes.blob()
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
        speakBrowserFallback(text)
      } catch {
        speakBrowserFallback(text)
      }
    },
    [voiceEnabled, voiceStyle, speakBrowserFallback]
  )

  const runAnalysis = useCallback(async () => {
    if (!idea.trim()) return
    if (audioRef.current) audioRef.current.pause()
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()

    setActiveNav('idea-overview')

    try {
      await startPipeline(idea, mode, 'workspace-user')
    } catch (err) {
      console.error(err)
    }
  }, [idea, mode, startPipeline, voiceEnabled, speak, intelligence.memory.final])

  useEffect(() => {
    if (intelligence.status !== 'complete' || !voiceEnabled || spokeOnComplete.current) return
    const final = intelligence.memory.final
    if (!final) return
    spokeOnComplete.current = true
    speak(
      `${final.startup_name_suggestion}. Fundability ${final.fundability_score} percent. ${final.one_line_pitch}`,
      true
    )
  }, [intelligence.status, intelligence.memory.final, speak, voiceEnabled])

  useEffect(() => {
    if (autoRan.current) return
    if (intelligence.status === 'streaming' || intelligence.sessionId) {
      autoRan.current = true
      return
    }
    if (searchParams?.get('demo') === '1' || searchParams?.get('autostart') === '1') {
      autoRan.current = true
      runAnalysis()
    }
  }, [searchParams, runAnalysis, intelligence.status, intelligence.sessionId])

  function exportDocuments() {
    const legacy = intelligenceToLegacyResponse(intelligence)
    if (!legacy) return
    const pack = buildDocumentPack(legacy)
    const blob = new Blob([documentPackToMarkdown(pack)], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const safeTitle =
      intelligence.memory.final?.startup_name_suggestion?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
      'startup'
    link.download = `founder-falcon-${safeTitle}-pack.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function playSummary() {
    const v = intelligence.memory.validation
    const f = intelligence.memory.final
    if (!v && !f) return
    const text = f
      ? `${f.startup_name_suggestion}. ${f.one_line_pitch} Fundability ${f.fundability_score} percent.`
      : `Viability ${v!.viability_score} percent. ${intelligence.memory.analysis?.summary || ''}`
    speak(text, true)
  }

  function handleIdeaKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      if (!isLoading) runAnalysis()
    }
  }

  return (
    <div className="ff-workspace-page">
      <header className="ff-workspace-toolbar">
        <div className="ff-workspace-topbar-actions">
          {!inAnalysisMode && (
            <select
              className="ff-mode-select"
              value={mode}
              onChange={e => setMode(e.target.value as PipelineMode)}
              aria-label="Pipeline mode"
            >
              <option value="full">Full OS</option>
              <option value="fast">Fast</option>
              <option value="validate_only">Validate only</option>
            </select>
          )}
          {inAnalysisMode && (
            <button
              type="button"
              className="ff-workspace-new-idea"
              onClick={() => {
                reset()
                spokeOnComplete.current = false
                setStatus('idle')
              }}
            >
              New Idea
            </button>
          )}
        </div>
      </header>

      {!inAnalysisMode ? (
        <IdeaCapture
          idea={idea}
          onIdeaChange={setIdea}
          onSubmit={runAnalysis}
          isLoading={isLoading}
          onKeyDown={handleIdeaKey}
        />
      ) : (
        <AnalysisWorkspace
          idea={idea}
          intelligence={intelligence}
          activeNav={activeNav}
          onNavChange={setActiveNav}
          voiceEnabled={voiceEnabled}
          voiceStyle={voiceStyle}
          isSpeaking={status === 'speaking'}
          onToggleVoice={setVoiceEnabled}
          onVoiceStyleChange={setVoiceStyle}
          onPlaySummary={playSummary}
          onExport={exportDocuments}
        />
      )}
    </div>
  )
}
