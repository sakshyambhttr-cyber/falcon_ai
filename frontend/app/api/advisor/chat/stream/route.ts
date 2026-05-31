/**
 * POST /api/advisor/chat/stream
 *
 * Phase 9 — Streaming Response System
 *
 * Streams Gemini tokens via Server-Sent Events so the UI can show
 * progressive text as the advisor "types" the response in real time.
 *
 * SSE event format:
 *   event: token
 *   data: {"token":"..."}
 *
 *   event: done
 *   data: {"answer":"<full text>"}
 *
 *   event: error
 *   data: {"error":"..."}
 */

import { checkStrictRateLimit } from '../../../../../lib/rate-limit'
import { parseBody } from '../../../../../lib/validation'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const StreamChatSchema = z.object({
  question: z.string().min(1).max(500),
  context: z.object({
    idea: z.string().max(2000),
    startupName: z.string().max(200).optional(),
    executiveBriefing: z.string().max(2000).optional(),
    viabilityScore: z.number().optional(),
    opportunities: z.array(z.string()).optional(),
    risks: z.array(z.string()).optional(),
    mvpStrategy: z.string().max(1000).optional(),
    prdOverview: z.string().max(1000).optional(),
    roadmapSummary: z.string().max(500).optional(),
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'advisor']),
      text: z.string().max(1000)
    })).max(10).optional()
  })
})

type StreamChatRequest = z.infer<typeof StreamChatSchema>

function isPlaceholderKey(key: string | undefined): boolean {
  if (!key || key.length < 8) return true
  const n = key.trim().toLowerCase()
  return ['your-gemini-key', 'changeme', 'placeholder', 'insert-key'].some(p => n.startsWith(p))
}

function buildFallbackAnswer(question: string, ctx: StreamChatRequest['context']): string {
  const name = ctx.startupName ?? 'your startup'
  const q = question.toLowerCase()
  if (q.includes('risk') || q.includes('challenge')) {
    const risk = ctx.risks?.[0]
    return risk
      ? `The biggest risk for ${name} is ${risk.toLowerCase()}. Address it early.`
      : `Every startup faces execution risk. For ${name}, validate your core assumption first.`
  }
  if (q.includes('mvp') || q.includes('build first') || q.includes('scope')) {
    return ctx.mvpStrategy
      ? `For ${name}, here's my thinking on the MVP: ${ctx.mvpStrategy.slice(0, 200)}.`
      : `Start with the single feature that proves your core value. Everything else can wait.`
  }
  return `That's a good question for ${name}. The full analysis is in your workspace — the validation report and PRD should give you the context you need.`
}

function buildSystemPrompt(question: string, ctx: StreamChatRequest['context']): string {
  const history = ctx.conversationHistory ?? []
  const historyText = history.length > 0
    ? '\n\nConversation so far:\n' + history.map(m =>
        `${m.role === 'user' ? 'Founder' : 'Advisor'}: ${m.text}`
      ).join('\n')
    : ''

  return `You are Falcon, an experienced AI startup co-founder and advisor. You are speaking directly to a founder about their startup.

Project context:
- Startup idea: ${ctx.idea}
- Startup name: ${ctx.startupName ?? 'not yet named'}
- Viability score: ${ctx.viabilityScore ?? 'not yet scored'} out of 100
- Key opportunities: ${ctx.opportunities?.slice(0, 2).join('; ') ?? 'see workspace'}
- Key risks: ${ctx.risks?.slice(0, 2).join('; ') ?? 'see workspace'}
- MVP strategy: ${ctx.mvpStrategy ?? 'see workspace'}${ctx.prdOverview ? `\n- Product overview: ${ctx.prdOverview}` : ''}${ctx.roadmapSummary ? `\n- Roadmap: ${ctx.roadmapSummary}` : ''}
${historyText}

The founder just asked: "${question}"

Respond as a warm, direct, experienced advisor. Rules:
- Answer in 2 to 4 short sentences only
- Be specific to their startup — use the context above
- Sound natural when spoken aloud — no lists, no markdown, no bold
- Be honest, not just encouraging — if there's a real concern, say it
- End with one concrete next step or question back to them`
}

function cleanForVoice(text: string): string {
  return text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: Request) {
  const rateLimitResponse = await checkStrictRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const raw = await request.json().catch(() => ({}))
  const parsed = parseBody(StreamChatSchema, raw)
  if (!parsed.success) {
    return new Response(sse('error', { error: parsed.error }), {
      status: 400,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' }
    })
  }

  const { question, context } = parsed.data
  const apiKey = process.env.GEMINI_API_KEY
  const encoder = new TextEncoder()

  // ── Fallback: no real key — stream the fallback answer word-by-word ──────────
  if (isPlaceholderKey(apiKey)) {
    const fallback = buildFallbackAnswer(question, context)
    const words = fallback.split(' ')

    const stream = new ReadableStream({
      async start(controller) {
        let accumulated = ''
        for (const word of words) {
          accumulated += (accumulated ? ' ' : '') + word
          controller.enqueue(encoder.encode(sse('token', { token: word + ' ' })))
          await new Promise(r => setTimeout(r, 40))
        }
        controller.enqueue(encoder.encode(sse('done', { answer: cleanForVoice(accumulated) })))
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    })
  }

  // ── Gemini streaming via streamGenerateContent ────────────────────────────────
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`
  const systemPrompt = buildSystemPrompt(question, context)

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)))
      }

      try {
        const geminiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200,
              stopSequences: ['\n\n\n']
            }
          }),
          signal: request.signal
        })

        if (!geminiRes.ok || !geminiRes.body) {
          const fallback = buildFallbackAnswer(question, context)
          send('token', { token: fallback })
          send('done', { answer: cleanForVoice(fallback) })
          controller.close()
          return
        }

        const reader = geminiRes.body.getReader()
        const dec = new TextDecoder()
        let accumulated = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += dec.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const jsonStr = line.slice(6).trim()
            if (!jsonStr || jsonStr === '[DONE]') continue
            try {
              const chunk = JSON.parse(jsonStr)
              const token: string = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
              if (token) {
                accumulated += token
                send('token', { token })
              }
            } catch {
              // malformed chunk — skip
            }
          }
        }

        const final = cleanForVoice(accumulated) || buildFallbackAnswer(question, context)
        send('done', { answer: final })
        controller.close()

      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          controller.close()
          return
        }
        console.warn('[/api/advisor/chat/stream] Error:', err)
        const fallback = buildFallbackAnswer(question, context)
        send('token', { token: fallback })
        send('done', { answer: cleanForVoice(fallback) })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}
