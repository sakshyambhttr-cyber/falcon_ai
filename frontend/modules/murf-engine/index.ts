export type MurfSpeechResponse = {
  audioFile?: string
  audioLengthInSeconds?: number
  warning?: string
  fallback?: boolean
  message?: string
}

export function sanitizeVoiceText(input: string): string{
  return input
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
}

export async function generateMurfSpeech(text: string, voiceId = 'en-US-natalie'): Promise<MurfSpeechResponse> {
  const apiKey = process.env.MURF_API_KEY
  if (!apiKey || apiKey.trim().length < 12) {
    return {
      fallback: true,
      message: 'MURF_API_KEY is not configured or is using a placeholder. Activating browser SpeechSynthesis fallback.'
    }
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
        format: 'MP3',
        rate: 0,
        pitch: 0,
        sampleRate: 24000
      })
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText)
      throw new Error(`Murf API returned status ${res.status}: ${errorText}`)
    }

    const payload = await res.json()
    if (payload.audioFile) {
      return {
        audioFile: payload.audioFile,
        audioLengthInSeconds: payload.audioLengthInSeconds || 0
      }
    }

    throw new Error('No audioFile URL in Murf response')
  } catch (error) {
    console.error('Murf AI generation failed, falling back to local speech:', error)
    return {
      fallback: true,
      message: error instanceof Error ? error.message : 'Unknown Murf AI error'
    }
  }
}

export default { generateMurfSpeech, sanitizeVoiceText }
