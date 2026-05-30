import { analyzeIdea } from '../ai-engine'
import { buildDocumentPack } from '../doc-generator'
import MemoryStore from '../memory-system'
import type { AIAnalysis, LLMClient } from '../../types/core'

export type OrchestratorOptions = {
  llm?: LLMClient
}

export class Orchestrator {
  private memory: MemoryStore

  constructor(memory?: MemoryStore){
    this.memory = memory || new MemoryStore()
  }

  /**
   * runPipeline
   * - Accepts a projectId and user idea string
   * - Stores idea in memory, runs AI analysis, generates markdown docs
   */
  async runPipeline(projectId: string, idea: string, opts: OrchestratorOptions = {}){
    // persist idea
    await this.memory.addIdea(projectId, idea)

    // run AI analysis (uses stub or adapter if provided)
    const analysis: AIAnalysis = await analyzeIdea(idea, { llm: opts.llm })

    // persist conversation entry
    await this.memory.addConversation(projectId, {
      id: `entry-${Date.now()}`,
      role: 'assistant',
      text: JSON.stringify(analysis),
      ts: Date.now()
    })

    // generate markdown artifacts
    const documents = buildDocumentPack(analysis as unknown as any)

    return {
      analysis,
      documents
    }
  }
}

export default Orchestrator
