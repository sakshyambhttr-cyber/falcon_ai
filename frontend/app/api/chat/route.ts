import { generateAIEngineResponse, sanitizeStartupIdea } from '../../../modules/ai-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function sseChunk(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

const STAGE_DELAYS = {
  thinking: 900,
  validation: 700,
  prd: 700,
  roadmap: 600
} as const

export async function POST(request: Request) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json().catch(() => ({}))
        const idea = sanitizeStartupIdea(String(body?.idea || ''))

        controller.enqueue(
          encoder.encode(
            sseChunk('stage', {
              stage: 'thinking',
              message: 'Analyzing market fit, audience pain points, and competitive positioning...'
            })
          )
        )
        await new Promise(r => setTimeout(r, STAGE_DELAYS.thinking))

        const responseData = await generateAIEngineResponse(idea)

        controller.enqueue(
          encoder.encode(
            sseChunk('stage', {
              stage: 'validation',
              message: `Validation complete — score ${responseData.validation.score}%`,
              data: responseData.validation
            })
          )
        )
        await new Promise(r => setTimeout(r, STAGE_DELAYS.validation))

        controller.enqueue(
          encoder.encode(
            sseChunk('stage', {
              stage: 'prd',
              message: `PRD synthesized — ${responseData.prd.title}`,
              data: responseData.prd
            })
          )
        )
        await new Promise(r => setTimeout(r, STAGE_DELAYS.prd))

        controller.enqueue(
          encoder.encode(
            sseChunk('stage', {
              stage: 'roadmap',
              message: `Roadmap built — ${responseData.roadmap.length} execution phases`,
              data: responseData.roadmap
            })
          )
        )
        await new Promise(r => setTimeout(r, STAGE_DELAYS.roadmap))

        controller.enqueue(
          encoder.encode(
            sseChunk('stage', {
              stage: 'ready',
              message: 'Startup operating package ready.',
              data: responseData
            })
          )
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Analysis failed'
        controller.enqueue(encoder.encode(sseChunk('error', { message })))
      } finally {
        controller.close()
      }
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
