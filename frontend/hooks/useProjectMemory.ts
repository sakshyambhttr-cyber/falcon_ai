'use client'

/**
 * MURF FALCON — useProjectMemory
 *
 * Manages persistent project memory across the session.
 * Automatically saves to localStorage whenever the intelligence
 * pipeline completes or conversation history changes.
 *
 * Usage:
 *   const memory = useProjectMemory()
 *   memory.addTurn('user', question)
 *   memory.addTurn('advisor', answer)
 *   memory.syncFromIntelligence(intelligence, sessionId)
 *   memory.getContextForAdvisor()  → pass to /api/advisor/chat
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  saveProjectMemory,
  loadProjectMemory,
  clearProjectMemory,
  condenseRoadmap,
  trimHistory,
  type ConversationTurn,
  type ProjectMemory
} from '../lib/project-memory'
import type { IntelligenceUIState } from '../lib/intelligence-state'

export type AdvisorContext = {
  idea: string
  startupName?: string
  executiveBriefing?: string
  viabilityScore?: number
  opportunities?: string[]
  risks?: string[]
  mvpStrategy?: string
  prdOverview?: string
  roadmapSummary?: string
  conversationHistory: Array<{ role: 'user' | 'advisor'; text: string }>
}

export function useProjectMemory() {
  const [history, setHistory] = useState<ConversationTurn[]>([])
  const memoryRef = useRef<Omit<ProjectMemory, 'conversationHistory' | 'savedAt'> | null>(null)

  // ── Load persisted memory on mount ──────────────────────────────────────────
  useEffect(() => {
    const saved = loadProjectMemory()
    if (!saved) return
    setHistory(saved.conversationHistory)
    memoryRef.current = {
      sessionId: saved.sessionId,
      idea: saved.idea,
      startupName: saved.startupName,
      executiveBriefing: saved.executiveBriefing,
      viabilityScore: saved.viabilityScore,
      opportunities: saved.opportunities,
      risks: saved.risks,
      mvpStrategy: saved.mvpStrategy,
      mvpFeatures: saved.mvpFeatures,
      prdOverview: saved.prdOverview,
      roadmapSummary: saved.roadmapSummary
    }
  }, [])

  // ── Persist whenever history changes ────────────────────────────────────────
  const persist = useCallback((
    newHistory: ConversationTurn[],
    meta: Omit<ProjectMemory, 'conversationHistory' | 'savedAt'>
  ) => {
    saveProjectMemory({
      ...meta,
      conversationHistory: trimHistory(newHistory, 20)
    })
  }, [])

  // ── Sync from intelligence pipeline when complete ────────────────────────────
  const syncFromIntelligence = useCallback((
    intelligence: IntelligenceUIState,
    sessionId: string
  ) => {
    const { memory } = intelligence
    if (!memory.final && !memory.validation) return

    const roadmapSummary = memory.roadmap.length > 0
      ? condenseRoadmap(memory.roadmap)
      : undefined

    const meta: Omit<ProjectMemory, 'conversationHistory' | 'savedAt'> = {
      sessionId,
      idea: memory.idea,
      startupName: memory.final?.startup_name_suggestion,
      executiveBriefing: memory.final?.executive_briefing,
      viabilityScore: memory.validation?.viability_score,
      opportunities: memory.validation?.opportunities,
      risks: memory.validation?.risks,
      mvpStrategy: memory.final?.mvp_launch_strategy,
      mvpFeatures: memory.final?.mvp_minimum_features,
      prdOverview: memory.prd.overview,
      roadmapSummary
    }

    memoryRef.current = meta
    persist(history, meta)
  }, [history, persist])

  // ── Add a conversation turn ──────────────────────────────────────────────────
  const addTurn = useCallback((role: 'user' | 'advisor', text: string) => {
    const turn: ConversationTurn = { role, text, ts: Date.now() }
    setHistory(prev => {
      const next = trimHistory([...prev, turn], 20)
      if (memoryRef.current) {
        persist(next, memoryRef.current)
      }
      return next
    })
  }, [persist])

  // ── Clear all memory (new project) ──────────────────────────────────────────
  const clearMemory = useCallback(() => {
    setHistory([])
    memoryRef.current = null
    clearProjectMemory()
  }, [])

  // ── Build context object for /api/advisor/chat ───────────────────────────────
  const getContextForAdvisor = useCallback((): AdvisorContext => {
    const meta = memoryRef.current
    return {
      idea: meta?.idea ?? '',
      startupName: meta?.startupName,
      executiveBriefing: meta?.executiveBriefing,
      viabilityScore: meta?.viabilityScore,
      opportunities: meta?.opportunities,
      risks: meta?.risks,
      mvpStrategy: meta?.mvpStrategy,
      prdOverview: meta?.prdOverview,
      roadmapSummary: meta?.roadmapSummary,
      // Only pass last 6 turns to the API to keep context tight
      conversationHistory: history.slice(-6).map(t => ({ role: t.role, text: t.text }))
    }
  }, [history])

  return {
    history,
    addTurn,
    clearMemory,
    syncFromIntelligence,
    getContextForAdvisor
  }
}
