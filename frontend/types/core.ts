export type AIValidation = {
  score: number // 0-100
  summary: string
}

export type AIPRD = {
  title: string
  features: string[]
  userStories: string[]
}

export type AIRoadmapItem = {
  phase: string
  tasks: string[]
}

export type AIEngineResponse = {
  validation: AIValidation
  prd: AIPRD
  roadmap: AIRoadmapItem[]
}

export type DocumentPack = {
  startupValidationReport: string
  prdDocument: string
  technicalDesignDocument: string
  roadmapDocument: string
  pitchDeckContent: string
}

export type LLMClient = {
  generateStructured: (prompt: string, opts?: Record<string, any>) => Promise<any>
}

