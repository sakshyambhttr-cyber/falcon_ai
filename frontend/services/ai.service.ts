import type { AIEngineResponse } from '../types/core'
import type { PipelineMode } from '../types/events'
import {
  connectIntelligenceStream,
  submitIdea
} from './intelligence-stream.service'


/**
 * Event-driven intelligence pipeline (preferred).
 */
export async function submitAndStreamIntelligence(
  idea: string,
  onEvent: Parameters<typeof connectIntelligenceStream>[1]['onEvent'],
  options?: { userId?: string; mode?: PipelineMode; fromIndex?: number }
) {
  const { sessionId } = await submitIdea({
    idea,
    userId: options?.userId,
    mode: options?.mode || 'full'
  })

  return connectIntelligenceStream(sessionId, {
    fromIndex: options?.fromIndex ?? 0,
    onEvent
  })
}

/** @deprecated Use submitAndStreamIntelligence — legacy stage wrapper */
export async function streamChatAnalysis(
  idea: string,
  onUpdate: (event: string, data: Record<string, unknown>) => void
): Promise<{ abort: () => void }> {
  const legacyMap: Record<string, string> = {
    'idea.analysis': 'thinking',
    'market.analysis': 'thinking',
    'validation.report': 'validation',
    'prd.section': 'prd',
    'roadmap.step': 'roadmap',
    'final.summary': 'ready',
    error: 'error'
  }

  let prdFeatures: string[] = []
  let prdTitle = ''
  let validation: { score: number; summary: string } | null = null
  let roadmap: { phase: string; tasks: string[] }[] = []

  return submitAndStreamIntelligence(idea, ev => {
    const stage = legacyMap[ev.type] || ev.type

    if (ev.type === 'validation.report') {
      const d = ev.data as { viability_score: number; risks: string[]; opportunities: string[] }
      validation = {
        score: d.viability_score,
        summary: (ev.data as { opportunities?: string[] }).opportunities?.[0] || 'Validation complete'
      }
      onUpdate('stage', { stage: 'validation', data: validation, message: `Score ${d.viability_score}%` })
    }

    if (ev.type === 'prd.section') {
      const d = ev.data as { section: string; content: string }
      if (d.section === 'features') prdFeatures = d.content.split('\n').map(l => l.replace(/^•\s*/, ''))
      if (d.section === 'solution' && !prdTitle) prdTitle = d.content.slice(0, 48)
      onUpdate('stage', {
        stage: 'prd',
        data: { title: prdTitle || 'Product', features: prdFeatures, userStories: [] }
      })
    }

    if (ev.type === 'roadmap.step') {
      const d = ev.data as { phase: number; title: string; tasks: string[] }
      roadmap = [...roadmap.filter(r => r.phase !== d.title), { phase: d.title, tasks: d.tasks }]
      onUpdate('stage', { stage: 'roadmap', data: roadmap })
    }

    if (ev.type === 'final.summary' && validation) {
      const f = ev.data as { startup_name_suggestion: string; one_line_pitch: string }
      onUpdate('stage', {
        stage: 'ready',
        data: {
          validation,
          prd: { title: f.startup_name_suggestion, features: prdFeatures, userStories: [] },
          roadmap
        }
      })
    }

    if (ev.type === 'error') {
      onUpdate('error', ev.data as Record<string, unknown>)
    }
  })
}

export async function analyzeStartupIdea(idea: string): Promise<AIEngineResponse> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea })
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error || 'AI analysis failed')
  }
  return response.json()
}
