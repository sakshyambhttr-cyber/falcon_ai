import { generateAIEngineResponse, sanitizeStartupIdea } from '../../../modules/ai-engine'
import { parseBody, AiRouteSchema } from '../../../lib/validation'
import { checkStrictRateLimit } from '../../../lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  })
}

export async function POST(request: Request) {
  // Rate limit: strict (10 req / 60 s) — AI generation is expensive
  const rateLimitResponse = await checkStrictRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const raw = await request.json().catch(() => ({}))
    const parsed = parseBody(AiRouteSchema, raw)
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error }, 400)
    }

    const idea = sanitizeStartupIdea(parsed.data.idea)
    const result = await generateAIEngineResponse(idea)
    return jsonResponse(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process idea'
    return jsonResponse({ error: message }, 400)
  }
}
