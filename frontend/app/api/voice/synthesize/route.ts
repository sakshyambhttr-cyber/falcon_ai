/**
 * POST /api/voice/synthesize
 *
 * Accepts pre-processed voice text and synthesizes it via Murf AI.
 * Returns the audio binary directly as audio/mpeg — no second client fetch needed.
 *
 * If Murf is unavailable, returns JSON { fallback: true } so the client
 * can fall back to browser TTS.
 */

import { generateMurfSpeech, resolveMurfVoice, sanitizeVoiceText } from '../../../../modules/murf-engine'
import { parseBody, VoiceSynthesizeSchema } from '../../../../lib/validation'
import { checkStrictRateLimit } from '../../../../lib/rate-limit'
import type { VoiceSynthesizeResponse } from '../../../../types/events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  })
}

export async function POST(request: Request) {
  const rateLimitResponse = await checkStrictRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const raw = await request.json().catch(() => ({}))
    const parsed = parseBody(VoiceSynthesizeSchema, raw)
    if (!parsed.success) {
      return json({ error: parsed.error, fallback: true } satisfies VoiceSynthesizeResponse & { error: string }, 400)
    }

    const text = sanitizeVoiceText(parsed.data.text)
    if (!text) {
      return json({ error: 'text is empty after sanitization', fallback: true } satisfies VoiceSynthesizeResponse & { error: string }, 400)
    }

    const voiceKey = parsed.data.voice.toLowerCase()
    const preset = resolveMurfVoice(voiceKey)

    const speech = await generateMurfSpeech(text, preset.voiceId, {
      locale: 'en-US',
      style: preset.murfStyle
    })

    // Murf unavailable — signal client to use browser TTS
    if (speech.fallback || !speech.audioFile) {
      const response: VoiceSynthesizeResponse = {
        fallback: true,
        ...(speech.message ? { error: speech.message } : {})
      }
      return json(response)
    }

    // Proxy the audio binary directly — eliminates the client's second fetch round-trip
    const audioRes = await fetch(speech.audioFile)
    if (!audioRes.ok) {
      // CDN fetch failed — fall back gracefully
      console.error('[/api/voice/synthesize] Failed to fetch Murf audio:', audioRes.status)
      return json({ fallback: true } satisfies VoiceSynthesizeResponse)
    }

    const audioBuffer = await audioRes.arrayBuffer()

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'Content-Length': String(audioBuffer.byteLength)
      }
    })
  } catch (error) {
    console.error('[/api/voice/synthesize] Unexpected error:', error instanceof Error ? error.message : error)
    return json({ fallback: true } satisfies VoiceSynthesizeResponse)
  }
}
