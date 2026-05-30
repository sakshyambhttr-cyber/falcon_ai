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

export function intelligenceToLegacyResponse(state: IntelligenceUIState) {
  const v = state.memory.validation
  const prdContent = state.memory.prd
  if (!v) return null

  return {
    validation: {
      score: v.viability_score,
      summary:
        state.memory.analysis?.summary ||
        v.opportunities?.join(' ') ||
        'Validation complete'
    },
    prd: {
      title: state.memory.final?.startup_name_suggestion || 'Startup Product',
      features: (prdContent.features || '').split('\n').filter(l => l.startsWith('•')).map(l => l.slice(2)),
      userStories: (prdContent.users || '').split('\n').filter(l => l.startsWith('•')).map(l => l.slice(2))
    },
    roadmap: state.memory.roadmap.map(r => ({
      phase: r.title,
      tasks: r.tasks
    }))
  }
}
