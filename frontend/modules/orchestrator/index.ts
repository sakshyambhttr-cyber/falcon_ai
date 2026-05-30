import { analyzeIdea } from '../ai-engine'
import { buildDocumentPack } from '../doc-generator'
import MemoryStore from '../memory-system'
import type { LLMClient } from '../../types/core'

export type OrchestratorOptions = {
  llm?: LLMClient
}

export class Orchestrator {
  private memory: MemoryStore

  constructor(memory?: MemoryStore){
    this.memory = memory || new MemoryStore()
  }

  async runPipeline(projectId: string, idea: string, opts: OrchestratorOptions = {}){
    await this.memory.addIdea(projectId, idea)
    const analysis = await analyzeIdea(idea)
    await this.memory.addConversation(projectId, {
      id: `entry-${Date.now()}`,
      role: 'assistant',
      text: JSON.stringify(analysis),
      ts: Date.now()
    })

    const documents = buildDocumentPack(analysis)

    return {
      analysis,
      documents,
      llm: opts.llm || null
    }
  }
}

export default Orchestrator
