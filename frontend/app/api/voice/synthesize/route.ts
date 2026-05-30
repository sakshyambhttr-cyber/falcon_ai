import { generateMurfSpeech, sanitizeVoiceText } from '../../../../modules/murf-engine'
import type { VoiceSynthesizeResponse } from '../../../../types/events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VOICE_MAP: Record<string, string> = {
  neutral: 'en-US-natalie',
  deep: 'en-US-terrell',
  energetic: 'en-US-julia',
  calm: 'en-US-miles'
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const text = sanitizeVoiceText(String(body?.text || ''))
    if (!text) return json({ error: 'Text is required' }, 400)

    const voiceKey = String(body?.voice || 'neutral').toLowerCase()
    const voiceId = VOICE_MAP[voiceKey] || VOICE_MAP.neutral
    const speed = Number(body?.speed) || 1

    const speech = await generateMurfSpeech(text, voiceId)

    if (speech.fallback || !speech.audioFile) {
      const response: VoiceSynthesizeResponse = { fallback: true }
      return json(response)
    }

    const response: VoiceSynthesizeResponse = {
      audio_url: speech.audioFile,
      fallback: false
    }

    return json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Voice synthesis failed'
    return json({ fallback: true, error: message } as VoiceSynthesizeResponse & { error: string })
  }
}
