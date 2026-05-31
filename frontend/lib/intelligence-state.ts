import type {
  FalconEvent,
  FinalSummaryData,
  IdeaAnalysisData,
  MarketAnalysisData,
  PrdSectionData,
  RoadmapStepData,
  SessionMemory,
  ValidationReportData
} from '../types/events'
import type { AIEngineResponse } from '../types/core'

export type IntelligenceUIState = {
  sessionId: string | null
  lastEventIndex: number
  status: 'idle' | 'connecting' | 'streaming' | 'complete' | 'error'
  pipelineStatus: string | null
  memory: SessionMemory
  events: FalconEvent[]
  error: { code: string; recoverable: boolean; message?: string } | null
}

export const initialIntelligenceState: IntelligenceUIState = {
  sessionId: null,
  lastEventIndex: 0,
  status: 'idle',
  pipelineStatus: null,
  memory: { idea: '', prd: {}, roadmap: [] },
  events: [],
  error: null
}

function upsertEvent(events: FalconEvent[], event: FalconEvent): FalconEvent[] {
  const idx = events.findIndex(e => e.index === event.index)
  if (idx >= 0) {
    const next = [...events]
    next[idx] = event
    return next
  }
  return [...events, event].sort((a, b) => a.index - b.index)
}

export function reduceIntelligenceEvent(
  state: IntelligenceUIState,
  event: FalconEvent
): IntelligenceUIState {
  const events = upsertEvent(state.events, event)
  const memory = { ...state.memory }

  switch (event.type) {
    case 'idea.analysis':
      memory.analysis = event.data as IdeaAnalysisData
      memory.idea = memory.idea || (event.data as IdeaAnalysisData).summary
      break
    case 'market.analysis':
      memory.market = event.data as MarketAnalysisData
      break
    case 'validation.report':
      memory.validation = event.data as ValidationReportData
      break
    case 'prd.section': {
      const d = event.data as PrdSectionData
      memory.prd = { ...memory.prd, [d.section]: d.content }
      break
    }
    case 'roadmap.step': {
      const step = event.data as RoadmapStepData
      const existing = memory.roadmap.filter(r => r.phase !== step.phase)
      memory.roadmap = [...existing, step].sort((a, b) => a.phase - b.phase)
      break
    }
    case 'final.summary':
      memory.final = event.data as FinalSummaryData
      break
    case 'error':
      return {
        ...state,
        events,
        memory,
        lastEventIndex: event.index,
        status: 'error',
        error: event.data as IntelligenceUIState['error'],
        pipelineStatus: 'error'
      }
  }

  return {
    ...state,
    events,
    memory,
    lastEventIndex: Math.max(state.lastEventIndex, event.index),
    status: event.type === 'final.summary' ? 'complete' : 'streaming',
    pipelineStatus: event.type,
    error: state.error
  }
}

export function intelligenceToLegacyResponse(state: IntelligenceUIState): AIEngineResponse | null {
  const final = state.memory.final
  const validation = state.memory.validation
  const prdContent = state.memory.prd
  const roadmapSteps = state.memory.roadmap

  if (!validation || !final) return null

  const p1 = roadmapSteps.find(r => r.phase === 1) || { title: 'Discovery & Core Validation', tasks: [] }
  const p2 = roadmapSteps.find(r => r.phase === 2) || { title: 'MVP Development', tasks: [] }
  const p3 = roadmapSteps.find(r => r.phase === 3) || { title: 'Beta Launch & Feedback', tasks: [] }
  const p4 = roadmapSteps.find(r => r.phase === 4) || { title: 'Milestones & Timeline', tasks: [] }

  return {
    startupName: final.startup_name_suggestion || 'Startup Product',
    executiveBriefing: final.executive_briefing || '',
    validationReport: {
      marketPotential: validation.marketPotential || state.memory.market?.market_size || 'Clear market validation segment.',
      opportunityScore: validation.viability_score || 80,
      riskAssessment: validation.riskAssessment || 'Standard product CAC and execution velocity risks.',
      strengths: validation.strengths || validation.opportunities || [],
      weaknesses: validation.weaknesses || validation.risks || []
    },
    prd: {
      overview: prdContent.overview || prdContent.solution || 'Product overview specifications.',
      userStories: (prdContent.users || '').split('\n').filter(l => l.trim().startsWith('•')).map(l => l.trim().slice(2)),
      features: (prdContent.features || '').split('\n').filter(l => l.trim().startsWith('•')).map(l => l.trim().slice(2)),
      requirements: (prdContent.requirements || '').split('\n').filter(l => l.trim().startsWith('•')).map(l => l.trim().slice(2))
    },
    roadmap: {
      phase1: { name: p1.title, tasks: p1.tasks },
      phase2: { name: p2.title, tasks: p2.tasks },
      phase3: { name: p3.title, tasks: p3.tasks },
      milestones: p4.tasks
    },
    mvpStrategy: {
      launchStrategy: final.mvp_launch_strategy || 'Visual MVP launch workflow.',
      minimumFeatures: final.mvp_minimum_features || (prdContent.features || '').split('\n').filter(l => l.trim().startsWith('•')).map(l => l.trim().slice(2)).slice(0, 3),
      firstUsers: final.mvp_first_users || 'Beta adopter developer lists.'
    },
    internalAnalysis: {
      concept: state.memory.analysis?.summary || '',
      targetAudience: state.memory.analysis?.category || 'Entrepreneurs',
      painPoints: (prdContent.problem_statement || '').split('\n').filter(l => l.trim().startsWith('•')).map(l => l.trim().slice(2)),
      businessModel: 'Freemium SaaS subscription',
      marketOpportunity: 'High growth builder segment',
      competitors: ['Incumbents'],
      strengths: validation.strengths || [],
      weaknesses: validation.weaknesses || [],
      risks: validation.risks || [],
      monetization: ['Premium plan'],
      productScope: 'MVP visual tabs',
      mvpRecommendations: 'Focus on immediate co-founder briefing',
      technicalComplexity: 'Moderate Next.js structure',
      growthPotential: 'High developer viral coefficient'
    }
  }
}
