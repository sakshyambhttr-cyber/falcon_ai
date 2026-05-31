import { generateMurfSpeech, sanitizeVoiceText } from '../../../modules/murf-engine'
import { parseBody, MurfRouteSchema } from '../../../lib/validation'
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
  // Rate limit: strict (10 req / 60 s) — voice generation is expensive
  const rateLimitResponse = await checkStrictRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const raw = await request.json().catch(() => ({}))
    const parsed = parseBody(MurfRouteSchema, raw)
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error }, 400)
    }

    const text = sanitizeVoiceText(parsed.data.text)
    const voiceId = parsed.data.voiceId

    if (!text) {
      return jsonResponse({ error: 'Text is required' }, 400)
    }

    const speechResponse = await generateMurfSpeech(text, voiceId)

    if (speechResponse.fallback || !speechResponse.audioFile) {
      return jsonResponse({
        fallback: true,
        text,
        message: speechResponse.message || 'Activating local speaking fallback.'
      }, 200)
    }

    // Fetch the audio binary from the temporary URL and stream it back
    const audioRes = await fetch(speechResponse.audioFile)
    if (!audioRes.ok) {
      throw new Error('Failed to retrieve audio from voice service')
    }

    const arrayBuffer = await audioRes.arrayBuffer()
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('[/api/murf] Error:', error instanceof Error ? error.message : error)
    const message = error instanceof Error ? error.message : 'Voice synthesis failed'
    return jsonResponse({ fallback: true, message }, 200)
  }
}
