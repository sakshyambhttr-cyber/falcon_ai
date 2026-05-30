export type ValidationResult = {
  summary: string
  score: number // 0..1
  risks?: string[]
  opportunities?: string[]
}

export type AIValidation = {
  summary: string
  score: number
  risks: string[]
  opportunities: string[]
}

export type PRDSection = {
  heading: string
  body: string
}

export type PRDDocument = {
  title: string
  description?: string
  sections: PRDSection[]
}

export type AIPrdDocument = {
  title: string
  description: string
  sections: PRDSection[]
}

export type Roadmap = {
  quarters: Array<{q: string; items: string[]}>
}

export type AIRoadmapItem = {
  phase: string
  items: string[]
}

export type AIAnalysis = {
  validation: ValidationResult
  prd: PRDDocument
  roadmap: Roadmap
}

export type AIEngineResponse = {
  validation: AIValidation
  prds: AIPrdDocument[]
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
  // A minimal adapter interface so engines can call any LLM implementation
  generateStructured: (prompt: string, opts?: Record<string, any>) => Promise<any>
}
