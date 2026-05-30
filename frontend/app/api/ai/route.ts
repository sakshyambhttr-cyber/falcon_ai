import { generateAIEngineResponse, sanitizeStartupIdea } from '../../../modules/ai-engine'

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
  try {
    const body = await request.json().catch(() => ({}))
    const idea = sanitizeStartupIdea(String(body?.idea || ''))
    const result = await generateAIEngineResponse(idea)
    return jsonResponse(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process idea'
    return jsonResponse({ error: message }, 400)
  }
}
