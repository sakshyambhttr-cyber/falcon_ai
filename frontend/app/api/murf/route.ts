function sanitizeVoiceText(input: string): string{
  return input
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
}

function jsonResponse(body: unknown, status = 200){
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  })
}

function getServerEnv(name: 'MURF_API_KEY' | 'MURF_API_URL'): string | undefined{
  const processEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  return processEnv?.[name]
}

export async function POST(request: Request){
  try{
    const body = await request.json().catch(() => ({}))
    const text = sanitizeVoiceText(String(body?.text || ''))
    if(!text){
      return jsonResponse({ error: 'Text is required' }, 400)
    }

    const apiKey = getServerEnv('MURF_API_KEY')
    if(!apiKey){
      return jsonResponse({
        fallback: true,
        text,
        message: 'MURF_API_KEY is missing. Set it in Vercel or frontend/.env.local for local dev.'
      }, 200)
    }

    const endpoint = getServerEnv('MURF_API_URL') || 'https://api.murf.ai/v1/tts'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    })

    if(!response.ok){
      const details = await response.text().catch(() => response.statusText)
      return jsonResponse({
        fallback: true,
        text,
        message: `Murf request failed: ${response.status}`,
        details
      }, 200)
    }

    const arrayBuffer = await response.arrayBuffer()
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store'
      }
    })
  }catch(error){
    const message = error instanceof Error ? error.message : 'Unknown Murf error'
    return jsonResponse({ fallback: true, message }, 200)
  }
}
