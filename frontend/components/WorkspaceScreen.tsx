'use client'

/**
 * MURF FALCON — WORKSPACE SCREEN
 *
 * Phase 9: Streaming responses — advisor text streams token-by-token via SSE
 * Phase 10: Workspace integration — chat commands mutate workspace documents live
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { buildDocumentPack, documentPackToMarkdown } from '../modules/doc-generator'
import { intelligenceToLegacyResponse, type IntelligenceUIState } from '../lib/intelligence-state'
import { useIntelligenceStream } from '../hooks/useIntelligenceStream'
import { useProjectMemory } from '../hooks/useProjectMemory'
import { useStreamingAdvisor } from '../hooks/useStreamingAdvisor'
import { detectWorkspaceIntent, applyWorkspaceMutation } from '../lib/workspace-intent'
import {
  generateContextualVoiceResponse,
  cleanForSpeech,
} from '../lib/voice-processor'
import type { WorkspaceNavSection } from '../lib/workspace-sections'
import type { PipelineMode } from '../types/events'
import IdeaCapture from './workspace/IdeaCapture'
import AnalysisWorkspace from './workspace/AnalysisWorkspace'
import WorkspacePageShell from './workspace/WorkspacePageShell'
import { DEFAULT_VOICE_STYLE, type VoiceStyle } from '../lib/murf-voices'

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * Granular voice phase for live feedback (Phase 8).
 *
 * idle        → waiting, nothing happening
 * listening   → mic is active, capturing speech
 * thinking    → question sent to Gemini, awaiting answer
 * analyzing   → intelligence pipeline is running
 * preparing   → Murf/TTS synthesis in progress
 * speaking    → audio is playing
 * error       → something went wrong
 */
export type VoicePhase =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'analyzing'
  | 'preparing'
  | 'speaking'
  | 'error'

// ─── BROWSER TTS FALLBACK ─────────────────────────────────────────────────────

function speakWithBrowserTTS(
  text: string,
  onEnd: () => void,
  onError: () => void
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onError()
    return
  }
  window.speechSynthesis.cancel()
  const clean = cleanForSpeech(text)
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.rate = 0.92   // slightly slower for advisor warmth
  utterance.pitch = 1.0
  utterance.volume = 1.0
  // Prefer a female voice if available
  const voices = window.speechSynthesis.getVoices()
  const femaleVoice = voices.find(v =>
    v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Victoria'))
  )
  if (femaleVoice) utterance.voice = femaleVoice
  utterance.onend = onEnd
  utterance.onerror = onError
  window.speechSynthesis.speak(utterance)
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function WorkspaceScreen() {
  const searchParams = useSearchParams()
  const { state: intelligenceBase, startPipeline, reset } = useIntelligenceStream()
  const projectMemory = useProjectMemory()

  // Phase 10: workspace mutations overlay the base intelligence state
  const [intelligenceOverride, setIntelligenceOverride] = useState<IntelligenceUIState | null>(null)
  const intelligence = intelligenceOverride ?? intelligenceBase

  // Phase 10: toast notification for workspace mutations
  const [workspaceToast, setWorkspaceToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Core state
  const [idea, setIdea] = useState('')
  const [activeNav, setActiveNav] = useState<WorkspaceNavSection>('executive-briefing')
  const [mode, setMode] = useState<PipelineMode>('full')

  // Voice state
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>(DEFAULT_VOICE_STYLE)
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle')
  const [voiceText, setVoiceText] = useState('')
  const [hasSpokenSummary, setHasSpokenSummary] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  // Phase 6: continuous voice conversation mode
  const [voiceConversationMode, setVoiceConversationMode] = useState(false)
  const onSpeakEndCallbackRef = useRef<(() => void) | null>(null)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoRan = useRef(false)
  const spokeOnComplete = useRef(false)
  const currentSpeakId = useRef(0)

  const isLoading = intelligence.status === 'streaming' || intelligence.status === 'connecting'
  const inAnalysisMode = isLoading || intelligence.status === 'complete' || intelligence.events.length > 0

  // ─── WORKSPACE TOAST (Phase 10) ─────────────────────────────────────────────

  const showWorkspaceToast = useCallback((message: string) => {
    setWorkspaceToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setWorkspaceToast(null), 3500)
  }, [])

  // ─── STOP SPEAKING ──────────────────────────────────────────────────────────

  const stopSpeaking = useCallback(() => {
    currentSpeakId.current += 1  // invalidate any in-flight speak calls
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    setVoicePhase('idle')
  }, [])

  // ─── CORE SPEAK FUNCTION ────────────────────────────────────────────────────

  /**
   * speak() — the single entry point for all voice output.
   *
   * Flow:
   *   1. Stop any existing speech
   *   2. Set phase to 'preparing' (Murf synthesis in progress — Phase 8)
   *   3. Call /api/voice/synthesize with the advisor-style text
   *   4. If Murf succeeds: fetch audio blob → play
   *   5. If Murf fails: fall back to browser TTS
   *   6. On completion: set phase back to 'idle', fire auto-listen if in conversation mode
   */
  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return

    stopSpeaking()
    const speakId = ++currentSpeakId.current
    setVoiceError(null)
    setVoicePhase('preparing')  // Phase 8: "Preparing Briefing…"

    const onSpeakEnd = () => {
      if (currentSpeakId.current !== speakId) return
      setVoicePhase('idle')
      setHasSpokenSummary(true)
      // Phase 6: fire auto-listen callback if conversation mode is active
      onSpeakEndCallbackRef.current?.()
    }

    const onSpeakError = () => {
      if (currentSpeakId.current !== speakId) return
      setVoicePhase('error')
      setVoiceError('Voice playback failed. Check your connection and try again.')
      setTimeout(() => {
        if (currentSpeakId.current === speakId) setVoicePhase('idle')
      }, 3000)
    }

    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: voiceStyle })
      })

      if (currentSpeakId.current !== speakId) return

      if (!res.ok) throw new Error(`Voice API ${res.status}`)

      // Route now returns audio/mpeg binary directly — no second fetch needed
      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('audio')) {
        const blob = await res.blob()
        if (currentSpeakId.current !== speakId) return

        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio

        audio.onended = () => {
          URL.revokeObjectURL(url)
          audioRef.current = null
          onSpeakEnd()
        }

        audio.onerror = () => {
          URL.revokeObjectURL(url)
          audioRef.current = null
          speakWithBrowserTTS(text, onSpeakEnd, onSpeakError)
        }

        setVoicePhase('speaking')
        await audio.play()
        return
      }

      // JSON response — either fallback signal or error
      await res.json()
      if (currentSpeakId.current !== speakId) return

      // Murf not available — use browser TTS
      setVoicePhase('speaking')
      speakWithBrowserTTS(text, onSpeakEnd, onSpeakError)

    } catch (err) {
      if (currentSpeakId.current !== speakId) return
      console.warn('[WorkspaceScreen] Voice synthesis error, falling back to browser TTS:', err)
      setVoicePhase('speaking')
      speakWithBrowserTTS(text, onSpeakEnd, onSpeakError)
    }
  }, [voiceStyle, stopSpeaking])

  // ─── GENERATE + SPEAK ADVISOR RESPONSE ──────────────────────────────────────

  /**
   * generateAndSpeak() — the dual-output entry point.
   *
   * Workspace output: already rendered by IntelligenceEventRenderer
   * Voice output: generated here via generateVoiceResponse(), then spoken
   */
  const generateAndSpeak = useCallback((isReplay = false) => {
    if (!voiceEnabled) return

    // Generate the conversational advisor response (NOT the workspace output)
    const advisorText = generateContextualVoiceResponse(
      { idea, state: intelligence },
      isReplay
    )

    if (!advisorText.trim()) return

    // Show the advisor text in the voice panel
    setVoiceText(advisorText)

    // Speak it
    void speak(advisorText)
  }, [voiceEnabled, idea, intelligence, speak])

  // ─── VOICE CONTROLS ─────────────────────────────────────────────────────────

  function handlePlaySummary() {
    generateAndSpeak(false)
  }

  function handleReplaySummary() {
    generateAndSpeak(true)
  }

  // ─── PHASE 9: STREAMING ADVISOR HOOK ────────────────────────────────────────

  const streamingAdvisor = useStreamingAdvisor({
    onToken: (_token, accumulated) => {
      // Show progressive text in the voice panel as tokens arrive
      setVoiceText(accumulated)
    },
    onComplete: (finalAnswer) => {
      // Full answer received — record in memory and speak it
      projectMemory.addTurn('advisor', finalAnswer)
      setVoiceText(finalAnswer)
      void speak(finalAnswer)
    },
    onError: (err) => {
      console.warn('[WorkspaceScreen] Streaming advisor error:', err)
      setVoicePhase('idle')
      setVoiceError('Could not reach the advisor. Check your connection and try again.')
      setTimeout(() => setVoiceError(null), 4000)
    }
  })

  // ─── SYNC STREAMING STATE → VOICE PHASE (Phase 9) ──────────────────────────

  useEffect(() => {
    if (streamingAdvisor.isStreaming) {
      setVoicePhase('thinking')
    }
    // When streaming ends, speak() will set the phase to 'preparing' then 'speaking'
    // so we don't reset to idle here — speak() owns the phase after streaming
  }, [streamingAdvisor.isStreaming])

  // ─── RESET OVERRIDE WHEN NEW PIPELINE STARTS (Phase 10) ─────────────────────

  useEffect(() => {
    if (intelligenceBase.status === 'connecting') {
      setIntelligenceOverride(null)
    }
  }, [intelligenceBase.status])

  useEffect(() => {
    if (intelligence.status !== 'complete') return
    if (!intelligence.sessionId) return
    projectMemory.syncFromIntelligence(intelligence, intelligence.sessionId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intelligence.status, intelligence.sessionId])

  // ─── AUTO-SPEAK ON PIPELINE COMPLETE ────────────────────────────────────────

  useEffect(() => {
    if (intelligence.status !== 'complete') return
    if (!voiceEnabled) return
    if (spokeOnComplete.current) return
    if (!intelligence.memory.final) return

    spokeOnComplete.current = true
    generateAndSpeak(false)
  }, [intelligence.status, intelligence.memory.final, voiceEnabled, generateAndSpeak])

  // ─── AUTO-START FROM URL PARAMS ─────────────────────────────────────────────

  useEffect(() => {
    if (autoRan.current) return
    if (intelligence.status === 'streaming' || intelligence.sessionId) {
      autoRan.current = true
      return
    }
    // ?demo=1 or ?autostart=1 — only auto-run if an idea was passed via ?idea=
    if (searchParams?.get('demo') === '1' || searchParams?.get('autostart') === '1') {
      autoRan.current = true
      const urlIdea = searchParams.get('idea')
      if (urlIdea && urlIdea.trim()) {
        setIdea(urlIdea.trim())
        void runAnalysis(urlIdea.trim())
      }
      // If no idea in URL, just let the user type — don't auto-submit empty
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, intelligence.status, intelligence.sessionId])

  // ─── PIPELINE ───────────────────────────────────────────────────────────────

  const runAnalysis = useCallback(async (overrideIdea?: string) => {
    const ideaToRun = (overrideIdea ?? idea).trim()
    if (!ideaToRun) return
    stopSpeaking()
    streamingAdvisor.abort()
    spokeOnComplete.current = false
    setHasSpokenSummary(false)
    setVoiceText('')
    setVoiceError(null)
    setVoicePhase('analyzing')
    setActiveNav('executive-briefing')
    setIntelligenceOverride(null)
    setWorkspaceToast(null)
    projectMemory.clearMemory()
    try {
      await startPipeline(ideaToRun, mode, 'workspace-user')
    } catch (err) {
      console.error('[WorkspaceScreen] Pipeline error:', err)
      setVoicePhase('idle')
    }
  }, [idea, mode, projectMemory, startPipeline, stopSpeaking, streamingAdvisor])

  const handleAskFollowUp = useCallback(async (question: string) => {
    if (!voiceEnabled || !question.trim()) return

    stopSpeaking()
    streamingAdvisor.abort()
    setVoiceError(null)
    setVoiceText('')
    setVoicePhase('thinking')

    // Phase 10: detect workspace mutation intent BEFORE calling the API
    const mutation = detectWorkspaceIntent(question)
    if (mutation) {
      const currentState = intelligenceOverride ?? intelligenceBase
      const nextState = applyWorkspaceMutation(currentState, mutation)
      setIntelligenceOverride(nextState)
      showWorkspaceToast(`✓ ${mutation.description}`)
      if (mutation.focusSection) {
        setActiveNav(mutation.focusSection as WorkspaceNavSection)
      }
    }

    // Record user turn
    projectMemory.addTurn('user', question.trim())

    // Phase 9: stream the response
    const context = projectMemory.getContextForAdvisor()
    if (!context.idea) context.idea = idea

    await streamingAdvisor.ask(question.trim(), context)
    // onComplete callback above handles the rest
  }, [
    voiceEnabled, idea, projectMemory, stopSpeaking,
    streamingAdvisor, intelligenceOverride, intelligenceBase,
    showWorkspaceToast
  ])

  // ─── EXPORT ─────────────────────────────────────────────────────────────────

  function exportDocuments() {
    const legacy = intelligenceToLegacyResponse(intelligence)
    if (!legacy) {
      console.warn('[WorkspaceScreen] Cannot export — validation not yet complete')
      return
    }
    const pack = buildDocumentPack(legacy)
    const blob = new Blob([documentPackToMarkdown(pack)], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const safeTitle =
      intelligence.memory.final?.startup_name_suggestion
        ?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ?? 'startup'
    link.download = `murf-falcon-${safeTitle}-pack.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // ─── KEYBOARD SHORTCUT ──────────────────────────────────────────────────────

  function handleIdeaKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      if (!isLoading) void runAnalysis()
    }
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <WorkspacePageShell>
      <div className="ff-workspace-page">

        {/* Phase 10: Workspace mutation toast */}
        {workspaceToast && (
          <div className="ff-workspace-toast" role="status" aria-live="polite">
            {workspaceToast}
          </div>
        )}

        {inAnalysisMode && (
          <header className="ff-workspace-toolbar">
            <span className="ff-workspace-eyebrow">Murf Falcon · Intelligence Pipeline</span>
            <div className="ff-workspace-topbar-actions">
              <button
                type="button"
                className="ff-workspace-new-idea ff-btn ff-btn-outline"
                onClick={() => {
                  stopSpeaking()
                  streamingAdvisor.abort()
                  reset()
                  spokeOnComplete.current = false
                  setHasSpokenSummary(false)
                  setVoiceText('')
                  setVoiceError(null)
                  setIntelligenceOverride(null)
                  setWorkspaceToast(null)
                  projectMemory.clearMemory()
                }}
                aria-label="Start a new idea"
              >
                ← New Idea
              </button>
            </div>
          </header>
        )}

        {!inAnalysisMode ? (
          <IdeaCapture
            idea={idea}
            onIdeaChange={setIdea}
            onSubmit={() => void runAnalysis()}
            isLoading={isLoading}
            onKeyDown={handleIdeaKey}
            mode={mode}
            onModeChange={setMode}
            voiceEnabled={voiceEnabled}
            onVoiceEnabledChange={setVoiceEnabled}
            voiceStyle={voiceStyle}
            onVoiceStyleChange={setVoiceStyle}
          />
        ) : (
          <AnalysisWorkspace
            idea={idea}
            intelligence={intelligence}
            activeNav={activeNav}
            onNavChange={setActiveNav}
            voiceEnabled={voiceEnabled}
            voiceStyle={voiceStyle}
            voicePhase={voicePhase}
            voiceText={voiceText}
            voiceError={voiceError}
            hasSpokenSummary={hasSpokenSummary}
            onToggleVoice={setVoiceEnabled}
            onVoiceStyleChange={setVoiceStyle}
            onPlaySummary={handlePlaySummary}
            onReplaySummary={handleReplaySummary}
            onStopSpeaking={stopSpeaking}
            onAskFollowUp={handleAskFollowUp}
            onExport={exportDocuments}
            voiceConversationMode={voiceConversationMode}
            onToggleConversationMode={(active) => {
              setVoiceConversationMode(active)
              if (!active) onSpeakEndCallbackRef.current = null
            }}
            onRegisterAutoListen={(fn) => { onSpeakEndCallbackRef.current = fn }}
            isStreamingResponse={streamingAdvisor.isStreaming}
          />
        )}
      </div>
    </WorkspacePageShell>
  )
}
