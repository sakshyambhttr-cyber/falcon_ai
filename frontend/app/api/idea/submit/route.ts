import { AIOrchestrator } from '../../../../modules/orchestrator'
import { sanitizeStartupIdea } from '../../../../modules/ai-engine'
import type { PipelineMode, SubmitIdeaResponse } from '../../../../types/events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const idea = sanitizeStartupIdea(String(body?.idea || ''))
    const userId = String(body?.userId || 'anonymous')
    const mode = (['full', 'fast', 'validate_only'].includes(body?.mode)
      ? body.mode
      : 'full') as PipelineMode

    const orchestrator = new AIOrchestrator()
    const result = orchestrator.startSession({ idea, userId, mode })

    const response: SubmitIdeaResponse = {
      sessionId: result.sessionId,
      streamUrl: result.streamUrl
    }

    return json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return json({ error: message }, 400)
  }
}
