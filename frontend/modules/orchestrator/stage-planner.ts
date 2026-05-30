import type { FalconEventType, PipelineMode } from '../../types/events'

export type PlannedStage = {
  type: FalconEventType
  delayMs: number
}

const FULL_PIPELINE: PlannedStage[] = [
  { type: 'idea.analysis', delayMs: 400 },
  { type: 'market.analysis', delayMs: 500 },
  { type: 'validation.report', delayMs: 600 },
  { type: 'prd.section', delayMs: 350 },
  { type: 'prd.section', delayMs: 350 },
  { type: 'prd.section', delayMs: 350 },
  { type: 'prd.section', delayMs: 350 },
  { type: 'prd.section', delayMs: 350 },
  { type: 'roadmap.step', delayMs: 450 },
  { type: 'roadmap.step', delayMs: 450 },
  { type: 'roadmap.step', delayMs: 450 },
  { type: 'final.summary', delayMs: 500 }
]

const FAST_PIPELINE: PlannedStage[] = [
  { type: 'idea.analysis', delayMs: 200 },
  { type: 'market.analysis', delayMs: 200 },
  { type: 'validation.report', delayMs: 250 },
  { type: 'prd.section', delayMs: 200 },
  { type: 'prd.section', delayMs: 200 },
  { type: 'roadmap.step', delayMs: 200 },
  { type: 'final.summary', delayMs: 300 }
]

const VALIDATE_PIPELINE: PlannedStage[] = [
  { type: 'idea.analysis', delayMs: 300 },
  { type: 'market.analysis', delayMs: 400 },
  { type: 'validation.report', delayMs: 500 },
  { type: 'final.summary', delayMs: 400 }
]

export function planStages(mode: PipelineMode): PlannedStage[] {
  if (mode === 'validate_only') return VALIDATE_PIPELINE
  if (mode === 'fast') return FAST_PIPELINE
  return FULL_PIPELINE
}

export default { planStages }
