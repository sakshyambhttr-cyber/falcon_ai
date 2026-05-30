import { NextResponse } from 'next/server'

function sanitizeVoiceText(input: string): string{
  return input
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
}

export async function POST(request: Request){
  try{
    const body = await request.json().catch(() => ({}))
    const text = sanitizeVoiceText(String(body?.text || ''))
    if(!text){
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const apiKey = process.env.MURF_API_KEY
    if(!apiKey){
      return NextResponse.json(
        {
          fallback: true,
          text,
          message: 'MURF_API_KEY is missing. Set it in Vercel or frontend/.env.local for local dev.'
        },
        { status: 200 }
      )
    }

    const endpoint = process.env.MURF_API_URL || 'https://api.murf.ai/v1/tts'
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
      return NextResponse.json(
        {
          fallback: true,
          text,
          message: `Murf request failed: ${response.status}`,
          details
        },
        { status: 200 }
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store'
      }
    })
  }catch(error){
    const message = error instanceof Error ? error.message : 'Unknown Murf error'
    return NextResponse.json({ fallback: true, message }, { status: 200 })
  }
}
