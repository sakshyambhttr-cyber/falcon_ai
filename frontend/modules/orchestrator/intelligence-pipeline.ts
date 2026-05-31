import { generateAIEngineResponse, sanitizeStartupIdea } from '../ai-engine'
import { getSessionStore } from '../session-store'
import { compilePrompt } from './prompt-compiler'
import { planStages } from './stage-planner'
import { StreamingController } from './streaming-controller'
import type {
  FalconEvent,
  FinalSummaryData,
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
  const score = engine.validationReport.opportunityScore

  const ideaAnalysis: IdeaAnalysisData = {
    summary: engine.prd.overview,
    category: inferCategory(keywords),
    difficulty: inferDifficulty(score),
    keywords
  }

  const hash = hashText(idea)
  const marketAnalysis: MarketAnalysisData = {
    market_size: engine.validationReport.marketPotential,
    growth_rate: `${12 + (hash % 15)}% CAGR (estimated)`,
    competition_level: score >= 75 ? 'low' : score >= 55 ? 'medium' : 'high'
  }

  const validationReport: ValidationReportData = {
    viability_score: score,
    risks: engine.validationReport.weaknesses,
    opportunities: engine.validationReport.strengths,
    marketPotential: engine.validationReport.marketPotential,
    riskAssessment: engine.validationReport.riskAssessment,
    strengths: engine.validationReport.strengths,
    weaknesses: engine.validationReport.weaknesses
  }

  const prdSections: { section: PrdSectionName; content: string }[] = [
    {
      section: 'overview',
      content: engine.prd.overview
    },
    {
      section: 'problem_statement',
      content: engine.internalAnalysis.painPoints.map(p => `• ${p}`).join('\n')
    },
    {
      section: 'solution',
      content: `${engine.startupName} is designed to solve these pain points by offering: ${engine.prd.overview}`
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
      section: 'requirements',
      content: engine.prd.requirements.map(r => `• ${r}`).join('\n')
    }
  ]

  const roadmapSteps = [
    {
      phase: 1,
      title: engine.roadmap.phase1.name,
      tasks: engine.roadmap.phase1.tasks
    },
    {
      phase: 2,
      title: engine.roadmap.phase2.name,
      tasks: engine.roadmap.phase2.tasks
    },
    {
      phase: 3,
      title: engine.roadmap.phase3.name,
      tasks: engine.roadmap.phase3.tasks
    },
    {
      phase: 4,
      title: 'Milestones & Timeline',
      tasks: engine.roadmap.milestones
    }
  ]

  const finalSummary: FinalSummaryData = {
    startup_name_suggestion: engine.startupName,
    one_line_pitch: `${engine.startupName}: ${engine.prd.overview.slice(0, 120)}…`,
    fundability_score: Math.min(95, Math.max(40, score - 5 + (hash % 8))),
    executive_briefing: engine.executiveBriefing,
    mvp_launch_strategy: engine.mvpStrategy.launchStrategy,
    mvp_minimum_features: engine.mvpStrategy.minimumFeatures,
    mvp_first_users: engine.mvpStrategy.firstUsers
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
