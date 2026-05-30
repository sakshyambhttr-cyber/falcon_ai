import { generateMurfSpeech, sanitizeVoiceText } from '../../../modules/murf-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function jsonResponse(body: unknown, status = 200){
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  })
}

export async function POST(request: Request){
  try{
    const body = await request.json().catch(() => ({}))
    const text = sanitizeVoiceText(String(body?.text || ''))
    if(!text){
      return jsonResponse({ error: 'Text is required' }, 400)
    }

    const speechResponse = await generateMurfSpeech(text)

    if (speechResponse.fallback || !speechResponse.audioFile) {
      return jsonResponse({
        fallback: true,
        text,
        message: speechResponse.message || 'Activating local speaking fallback.'
      }, 200)
    }

    // Fetch the audio binary from the temporary URL and pipe/stream it
    const audioRes = await fetch(speechResponse.audioFile)
    if (!audioRes.ok) {
      throw new Error(`Failed to download audio file from ${speechResponse.audioFile}`)
    }

    const arrayBuffer = await audioRes.arrayBuffer()
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store'
      }
    })
  }catch(error){
    const message = error instanceof Error ? error.message : 'Unknown route handler Murf error'
    return jsonResponse({ fallback: true, message }, 200)
  }
}

