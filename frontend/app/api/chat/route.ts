/**
 * Legacy chat endpoint — proxies to event-driven intelligence pipeline.
 * Prefer POST /api/idea/submit + GET /api/stream/:sessionId
 */
import { AIOrchestrator } from '../../../modules/orchestrator'
import { sanitizeStartupIdea } from '../../../modules/ai-engine'
import { getSessionStore } from '../../../modules/session-store'
import { parseBody, ChatRouteSchema } from '../../../lib/validation'
import { checkStrictRateLimit } from '../../../lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  // Rate limit: strict (10 req / 60 s) — triggers full AI pipeline
  const rateLimitResponse = await checkStrictRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const raw = await request.json().catch(() => ({}))
  const parsed = parseBody(ChatRouteSchema, raw)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const idea = sanitizeStartupIdea(parsed.data.idea)
  const orchestrator = new AIOrchestrator()
  const { sessionId } = orchestrator.startSession({ idea, userId: 'legacy-chat', mode: 'full' })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const store = getSessionStore()
      const unsubscribe = store.subscribe(sessionId, event => {
        if (event.type === 'final.summary') {
          controller.enqueue(
            encoder.encode(
              `event: stage\ndata: ${JSON.stringify({
                stage: 'ready',
                message: 'Package ready',
                data: {
                  validation: {
                    score: (event.data as { fundability_score: number }).fundability_score,
                    summary: (event.data as { one_line_pitch: string }).one_line_pitch
                  },
                  prd: {
                    title: (event.data as { startup_name_suggestion: string }).startup_name_suggestion,
                    features: [],
                    userStories: []
                  },
                  roadmap: store.get(sessionId)?.memory.roadmap.map(r => ({
                    phase: r.title,
                    tasks: r.tasks
                  }))
                }
              })}\n\n`
            )
          )
          setTimeout(() => {
            unsubscribe()
            controller.close()
          }, 200)
          return
        }

        const stageMap: Record<string, string> = {
          'idea.analysis': 'thinking',
          'market.analysis': 'thinking',
          'validation.report': 'validation',
          'prd.section': 'prd',
          'roadmap.step': 'roadmap'
        }
        const stage = stageMap[event.type]
        if (stage) {
          controller.enqueue(
            encoder.encode(
              `event: stage\ndata: ${JSON.stringify({ stage, message: event.type, data: event.data })}\n\n`
            )
          )
        }
      })

      request.signal.addEventListener('abort', () => {
        unsubscribe()
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}
