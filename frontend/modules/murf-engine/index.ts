/**
 * MURF FALCON — MURF ENGINE
 *
 * Handles all Murf AI TTS API calls with:
 * - Optimized voice settings for conversational advisor style
 * - Proper error handling and graceful fallback
 * - Audio response caching to reduce latency on replay
 * - Clean text sanitization before API calls
 */

import { resolveMurfVoice } from '../../lib/murf-voices'

export type MurfSpeechResponse = {
  audioFile?: string
  audioLengthInSeconds?: number
  warning?: string
  fallback?: boolean
  message?: string
}

// ─── TEXT SANITIZATION ────────────────────────────────────────────────────────

/**
 * Final sanitization pass before sending to Murf.
 * The voice-processor layer handles the heavy cleaning;
 * this is a last-line defense for control characters and length.
 *
 * Limit: 1200 chars, truncated at a sentence boundary so Murf never
 * receives a fragment mid-sentence (which causes unnatural cutoffs).
 */
export function sanitizeVoiceText(input: string): string {
  const cleaned = input
    .replace(/[\u0000-\u001f\u007f]/g, ' ')  // control characters
    .replace(/[*#`_~^]/g, '')                  // remaining markdown
    .replace(/\s+/g, ' ')
    .trim()

  const MAX = 1200
  if (cleaned.length <= MAX) return cleaned

  // Truncate at the last sentence boundary before MAX chars
  const truncated = cleaned.slice(0, MAX)
  const lastSentence = truncated.search(/[.!?][^.!?]*$/)
  if (lastSentence > MAX * 0.5) {
    return truncated.slice(0, lastSentence + 1).trim()
  }
  // Fallback: truncate at last space
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()
}

// ─── AUDIO CACHE ──────────────────────────────────────────────────────────────

/** Simple in-memory cache to avoid duplicate Murf API calls on replay */
const audioCache = new Map<string, { url: string; expires: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCacheKey(text: string, voiceId: string, style: string): string {
  return `${voiceId}:${style}:${text.slice(0, 80)}`
}

function getCached(key: string): string | null {
  const entry = audioCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    audioCache.delete(key)
    return null
  }
  return entry.url
}

function setCache(key: string, url: string): void {
  // Limit cache size
  if (audioCache.size > 20) {
    const firstKey = audioCache.keys().next().value
    if (firstKey) audioCache.delete(firstKey)
  }
  audioCache.set(key, { url, expires: Date.now() + CACHE_TTL_MS })
}

// ─── MURF API CALL ────────────────────────────────────────────────────────────

export async function generateMurfSpeech(
  text: string,
  voiceId = 'en-US-amara',
  options?: { style?: string; locale?: string }
): Promise<MurfSpeechResponse> {
  const apiKey = process.env.MURF_API_KEY
  if (!apiKey || apiKey.trim().length < 12) {
    return {
      fallback: true,
      message: 'MURF_API_KEY not configured — using browser TTS fallback.'
    }
  }

  const style = options?.style ?? 'Narration'
  const cacheKey = getCacheKey(text, voiceId, style)
  const cached = getCached(cacheKey)
  if (cached) {
    return { audioFile: cached, audioLengthInSeconds: 0 }
  }

  const endpoint = process.env.MURF_API_URL || 'https://api.murf.ai/v1/speech/generate'

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voiceId,
        locale: options?.locale ?? 'en-US',
        style,
        format: 'MP3',
        // Tuned for natural advisor delivery:
        //   rate -8  → slightly slower than default, warm and deliberate
        //   pitch 0  → neutral, avoids robotic high pitch
        //   sampleRate 48000 → highest quality for voice clarity
        //   variation 1 → most natural Murf output variant
        rate: -8,
        pitch: 0,
        sampleRate: 48000,
        channelType: 'MONO',
        encodeAsBase64: false,
        variation: 1
      })
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText)
      throw new Error(`Murf API ${res.status}: ${errorText}`)
    }

    const payload = await res.json()

    if (payload.audioFile) {
      setCache(cacheKey, payload.audioFile)
      return {
        audioFile: payload.audioFile,
        audioLengthInSeconds: payload.audioLengthInSeconds ?? 0
      }
    }

    throw new Error('No audioFile in Murf response')
  } catch (error) {
    console.error('[MurfEngine] API call failed, falling back to browser TTS:', error)
    return {
      fallback: true,
      message: error instanceof Error ? error.message : 'Murf API error'
    }
  }
}

export { resolveMurfVoice }

export default { generateMurfSpeech, sanitizeVoiceText, resolveMurfVoice }
