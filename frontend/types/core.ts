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
  startupName: string
  executiveBriefing: string
  validationReport: {
    marketPotential: string
    opportunityScore: number
    riskAssessment: string
    strengths: string[]
    weaknesses: string[]
  }
  prd: {
    overview: string
    userStories: string[]
    features: string[]
    requirements: string[]
  }
  roadmap: {
    phase1: { name: string; tasks: string[] }
    phase2: { name: string; tasks: string[] }
    phase3: { name: string; tasks: string[] }
    milestones: string[]
  }
  mvpStrategy: {
    launchStrategy: string
    minimumFeatures: string[]
    firstUsers: string
  }
  internalAnalysis: {
    concept: string
    targetAudience: string
    painPoints: string[]
    businessModel: string
    marketOpportunity: string
    competitors: string[]
    strengths: string[]
    weaknesses: string[]
    risks: string[]
    monetization: string[]
    productScope: string
    mvpRecommendations: string
    technicalComplexity: string
    growthPotential: string
  }
  // Backwards compatibility helper
  validation?: AIValidation
}

export type DocumentPack = {
  executiveBriefing: string
  startupValidationReport: string
  prdDocument: string
  roadmapDocument: string
  mvpStrategy: string
}

export type LLMClient = {
  generateStructured: (prompt: string, opts?: Record<string, any>) => Promise<any>
}

