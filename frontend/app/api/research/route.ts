import { NextResponse } from 'next/server'
import { parseBody, ResearchRouteSchema } from '../../../lib/validation'
import { checkRateLimit } from '../../../lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  // Rate limit: standard (20 req / 60 s)
  const rateLimitResponse = await checkRateLimit(req)
  if (rateLimitResponse) return rateLimitResponse

  const raw = await req.json().catch(() => ({}))
  const parsed = parseBody(ResearchRouteSchema, raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { query } = parsed.data

  const GEMINI_API_URL = process.env.GEMINI_API_URL
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Gemini API not configured.' },
      { status: 501 }
    )
  }

  try {
    // If a custom GEMINI_API_URL is provided, call it with a Bearer token
    if (GEMINI_API_URL) {
      const resp = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GEMINI_API_KEY}`,
        },
        body: JSON.stringify({ prompt: query }),
      })

      if (!resp.ok) {
        // Do NOT forward upstream error details to the client
        return NextResponse.json(
          { error: 'Upstream service error. Please try again.' },
          { status: 502 }
        )
      }

      const data = await resp.json()
      const answer = data.answer ?? data.output ?? data.text ?? data.result ?? data
      return NextResponse.json({ answer })
    }

    // Default: call Google Generative Language (Gemini) endpoint
    const googleEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`
    const gResp = await fetch(googleEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: query }] }],
        generationConfig: { responseMimeType: 'text/plain' },
      }),
    })

    if (!gResp.ok) {
      return NextResponse.json(
        { error: 'AI service error. Please try again.' },
        { status: 502 }
      )
    }

    const gData = await gResp.json()
    const contentText = gData.candidates?.[0]?.content?.parts?.[0]?.text
    const answer = contentText ?? gData
    return NextResponse.json({ answer })
  } catch (err) {
    console.error('[/api/research] Error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
