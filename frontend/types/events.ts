/** Founder Falcon — typed intelligence stream events (never plain text). */

export type PipelineMode = 'full' | 'fast' | 'validate_only'

export type IdeaAnalysisData = {
  summary: string
  category: string
  difficulty: 'low' | 'medium' | 'high'
  keywords: string[]
}

export type MarketAnalysisData = {
  market_size: string
  growth_rate: string
  competition_level: 'low' | 'medium' | 'high'
}

export type ValidationReportData = {
  viability_score: number
  risks: string[]
  opportunities: string[]
  marketPotential?: string
  riskAssessment?: string
  strengths?: string[]
  weaknesses?: string[]
}

export type PrdSectionName =
  | 'problem_statement'
  | 'solution'
  | 'features'
  | 'users'
  | 'scope'
  | 'overview'
  | 'requirements'

export type PrdSectionData = {
  section: PrdSectionName
  content: string
}

export type RoadmapStepData = {
  phase: number
  title: string
  tasks: string[]
}

export type FinalSummaryData = {
  startup_name_suggestion: string
  one_line_pitch: string
  fundability_score: number
  executive_briefing?: string
  mvp_launch_strategy?: string
  mvp_minimum_features?: string[]
  mvp_first_users?: string
}

export type ErrorEventData = {
  code: string
  recoverable: boolean
  message?: string
}

export type FalconEventType =
  | 'idea.analysis'
  | 'market.analysis'
  | 'validation.report'
  | 'prd.section'
  | 'roadmap.step'
  | 'final.summary'
  | 'error'

export type FalconEventPayload =
  | IdeaAnalysisData
  | MarketAnalysisData
  | ValidationReportData
  | PrdSectionData
  | RoadmapStepData
  | FinalSummaryData
  | ErrorEventData

export type FalconEvent<T extends FalconEventType = FalconEventType> = {
  type: T
  sessionId: string
  timestamp: number
  index: number
  data: T extends 'idea.analysis'
    ? IdeaAnalysisData
    : T extends 'market.analysis'
      ? MarketAnalysisData
      : T extends 'validation.report'
        ? ValidationReportData
        : T extends 'prd.section'
          ? PrdSectionData
          : T extends 'roadmap.step'
            ? RoadmapStepData
            : T extends 'final.summary'
              ? FinalSummaryData
              : T extends 'error'
                ? ErrorEventData
                : FalconEventPayload
}

export type SessionMemory = {
  idea: string
  analysis?: IdeaAnalysisData
  market?: MarketAnalysisData
  validation?: ValidationReportData
  prd: Partial<Record<PrdSectionName, string>>
  roadmap: RoadmapStepData[]
  final?: FinalSummaryData
}

export type SubmitIdeaRequest = {
  idea: string
  userId?: string
  mode?: PipelineMode
}

export type SubmitIdeaResponse = {
  sessionId: string
  streamUrl: string
}

export type VoiceSynthesizeRequest = {
  text: string
  voice?: 'advisor' | 'executive' | 'warm' | 'energetic' | 'neutral' | 'deep' | 'calm'
  speed?: number
}

export type VoiceSynthesizeResponse = {
  audio_url?: string
  fallback?: boolean
}
