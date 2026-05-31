import { AIOrchestrator } from '../../../../modules/orchestrator'
import { sanitizeStartupIdea } from '../../../../modules/ai-engine'
import { parseBody, IdeaSubmitSchema } from '../../../../lib/validation'
import { checkStrictRateLimit } from '../../../../lib/rate-limit'
import type { SubmitIdeaResponse } from '../../../../types/events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  })
}

export async function POST(request: Request) {
  // Rate limit: strict (10 req / 60 s) — triggers full AI pipeline
  const rateLimitResponse = await checkStrictRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const raw = await request.json().catch(() => ({}))
    const parsed = parseBody(IdeaSubmitSchema, raw)
    if (!parsed.success) {
      return json({ error: parsed.error }, 400)
    }

    const { idea: rawIdea, userId, mode } = parsed.data
    const idea = sanitizeStartupIdea(rawIdea)

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
