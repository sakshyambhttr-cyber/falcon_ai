import { generateAIEngineResponse, sanitizeStartupIdea } from '../ai-engine'
import { getSessionStore } from '../session-store'
import { compilePrompt } from './prompt-compiler'
import { planStages } from './stage-planner'
import { StreamingController } from './streaming-controller'
import type {
  FalconEvent,
  IdeaAnalysisData,
  MarketAnalysisData,
  PipelineMode,
  PrdSectionName,
  ValidationReportData
} from '../../types/events'
import type { AIEngineResponse } from '../../types/core'

function hashText(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  return hash
}

function extractKeywords(idea: string): string[] {
  const stop = new Set(['want', 'build', 'that', 'with', 'from', 'this', 'help', 'platform'])
  return Array.from(
    new Set(
      idea
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stop.has(w))
    )
  ).slice(0, 8)
}

function inferCategory(keywords: string[]): string {
  if (keywords.some(k => ['student', 'scholarship', 'education'].includes(k))) return 'EdTech / Access'
  if (keywords.some(k => ['health', 'medical', 'care'].includes(k))) return 'HealthTech'
  if (keywords.some(k => ['finance', 'payment', 'bank'].includes(k))) return 'FinTech'
  return 'SaaS / AI Platform'
}

function inferDifficulty(score: number): 'low' | 'medium' | 'high' {
  if (score >= 80) return 'low'
  if (score >= 62) return 'medium'
  return 'high'
}

function buildIntelligenceFromEngine(idea: string, engine: AIEngineResponse) {
  const keywords = extractKeywords(idea)
  const score = engine.validation.score

  const ideaAnalysis: IdeaAnalysisData = {
    summary: engine.validation.summary,
    category: inferCategory(keywords),
    difficulty: inferDifficulty(score),
    keywords
  }

  const hash = hashText(idea)
  const marketAnalysis: MarketAnalysisData = {
    market_size: `$${(2 + (hash % 8)).toFixed(1)}B addressable segment`,
    growth_rate: `${12 + (hash % 15)}% CAGR (estimated)`,
    competition_level: score >= 75 ? 'medium' : score >= 55 ? 'high' : 'high'
  }

  const validationReport: ValidationReportData = {
    viability_score: score,
    risks: [
      'Execution velocity vs. well-funded incumbents',
      'Customer acquisition cost in early channels',
      score < 65 ? 'Product-market fit still unproven at scale' : 'Scaling ops before retention is proven'
    ],
    opportunities: [
      `Clear pain around ${keywords[0] || 'target users'}`,
      'AI-native workflow reduces time-to-insight by 10x',
      'Voice + structured output differentiation in founder tooling'
    ]
  }

  const prdSections: { section: PrdSectionName; content: string }[] = [
    {
      section: 'problem_statement',
      content: `Founders struggle to validate and scope: "${idea.slice(0, 160)}${idea.length > 160 ? '…' : ''}"`
    },
    {
      section: 'solution',
      content: `${engine.prd.title} delivers structured intelligence — validation, PRD, and roadmap in one operating session.`
    },
    {
      section: 'features',
      content: engine.prd.features.map(f => `• ${f}`).join('\n')
    },
    {
      section: 'users',
      content: engine.prd.userStories.map(s => `• ${s}`).join('\n')
    },
    {
      section: 'scope',
      content: `MVP focus: core intake, streaming intelligence pipeline, export pack. Post-MVP: team workspaces, investor mode.`
    }
  ]

  const roadmapSteps = engine.roadmap.map((phase, i) => ({
    phase: i + 1,
    title: phase.phase,
    tasks: phase.tasks
  }))

  const finalSummary = {
    startup_name_suggestion: engine.prd.title,
    one_line_pitch: `${engine.prd.title}: ${engine.validation.summary.slice(0, 120)}…`,
    fundability_score: Math.min(95, Math.max(40, score - 5 + (hash % 8)))
  }

  return { ideaAnalysis, marketAnalysis, validationReport, prdSections, roadmapSteps, finalSummary }
}

export async function runIntelligencePipeline(
  sessionId: string,
  idea: string,
  mode: PipelineMode = 'full'
): Promise<void> {
  const store = getSessionStore()
  const session = store.get(sessionId)
  if (!session) return

  store.setStatus(sessionId, 'running')
  compilePrompt(idea, mode)
  const stages = planStages(mode)
  const startIndex = store.getLastIndex(sessionId)
  const stream = new StreamingController(sessionId, startIndex)

  const emit = (event: FalconEvent) => {
    store.appendEvent(sessionId, event)
    switch (event.type) {
      case 'idea.analysis':
        store.updateMemory(sessionId, { analysis: event.data as IdeaAnalysisData })
        break
      case 'market.analysis':
        store.updateMemory(sessionId, { market: event.data as MarketAnalysisData })
        break
      case 'validation.report':
        store.updateMemory(sessionId, { validation: event.data as ValidationReportData })
        break
      case 'prd.section': {
        const d = event.data as { section: PrdSectionName; content: string }
        const mem = store.get(sessionId)!
        store.updateMemory(sessionId, {
          prd: { ...mem.memory.prd, [d.section]: d.content }
        })
        break
      }
      case 'roadmap.step': {
        const mem = store.get(sessionId)!
        store.updateMemory(sessionId, {
          roadmap: [...mem.memory.roadmap, event.data as FalconEvent<'roadmap.step'>['data']]
        })
        break
      }
      case 'final.summary':
        store.updateMemory(sessionId, { final: event.data as FalconEvent<'final.summary'>['data'] })
        break
    }
  }

  try {
    const sanitized = sanitizeStartupIdea(idea)
    const engine = await generateAIEngineResponse(sanitized)
    const intel = buildIntelligenceFromEngine(sanitized, engine)

    let prdIndex = 0
    let roadmapIndex = 0

    for (const stage of stages) {
      await new Promise(r => setTimeout(r, stage.delayMs))

      if (stage.type === 'idea.analysis') {
        emit(stream.createEvent('idea.analysis', intel.ideaAnalysis))
      } else if (stage.type === 'market.analysis') {
        emit(stream.createEvent('market.analysis', intel.marketAnalysis))
      } else if (stage.type === 'validation.report') {
        emit(stream.createEvent('validation.report', intel.validationReport))
      } else if (stage.type === 'prd.section') {
        const section = intel.prdSections[prdIndex]
        if (section) {
          emit(stream.createEvent('prd.section', section))
          prdIndex += 1
        }
      } else if (stage.type === 'roadmap.step') {
        const step = intel.roadmapSteps[roadmapIndex]
        if (step) {
          emit(stream.createEvent('roadmap.step', step))
          roadmapIndex += 1
        }
      } else if (stage.type === 'final.summary') {
        emit(stream.createEvent('final.summary', intel.finalSummary))
      }
    }

    store.setStatus(sessionId, 'complete')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pipeline failed'
    emit(
      stream.createEvent('error', {
        code: 'STREAM_INTERRUPTED',
        recoverable: true,
        message
      })
    )
    store.setStatus(sessionId, 'error')
  }
}

export default { runIntelligencePipeline }
