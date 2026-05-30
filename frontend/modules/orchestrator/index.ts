import { getSessionStore } from '../session-store'
import { runIntelligencePipeline } from './intelligence-pipeline'
import { compilePrompt } from './prompt-compiler'
import { planStages } from './stage-planner'
import { StreamingController } from './streaming-controller'
import type { PipelineMode, SubmitIdeaRequest } from '../../types/events'

export type { CompiledPrompt } from './prompt-compiler'
export type { PlannedStage } from './stage-planner'
export { compilePrompt, planStages, StreamingController, runIntelligencePipeline }

/** AI Orchestrator — session lifecycle + intelligence pipeline execution. */
export class AIOrchestrator {
  startSession(input: SubmitIdeaRequest) {
    const store = getSessionStore()
    const session = store.create({
      userId: input.userId || 'anonymous',
      idea: input.idea.trim(),
      mode: input.mode || 'full'
    })

    void runIntelligencePipeline(session.id, session.idea, session.mode)

    return {
      sessionId: session.id,
      streamUrl: `/api/stream/${session.id}`
    }
  }

  getSession(sessionId: string) {
    return getSessionStore().get(sessionId)
  }
}

export default AIOrchestrator
