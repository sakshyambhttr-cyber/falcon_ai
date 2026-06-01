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
  const score = ctx.viabilityScore
  const history = ctx.conversationHistory ?? []

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const previousAdvisorReply = history.slice().reverse().find(turn => turn.role === 'advisor')?.text
  const freshnessHint = previousAdvisorReply
    ? `Don't reuse this angle: ${previousAdvisorReply.slice(0, 120)}`
    : ''

  if (q.includes('risk') || q.includes('challenge') || q.includes('problem')) {
    const risk = ctx.risks?.[0]
    if (risk) {
      return pick([
        `The biggest risk I see for ${name} is ${risk.toLowerCase()}. I'd tackle that head-on in the first 30 days — it compounds if you leave it.`,
        `${risk} is the one I'd lose sleep over for ${name}. Map out your mitigation plan before you write a single line of code.`,
        `Honestly, ${risk.toLowerCase()} is the real test for ${name}. Solve that and the rest gets much easier.`
      ])
    }
    return pick([
      `Every early-stage startup has execution risk. For ${name}, validate your core assumption with real users before building anything else.`,
      `The biggest risk at this stage isn't competition — it's building something nobody wants. Get ${name} in front of 10 real users this week.`,
      `For ${name}, the challenge is staying focused. Pick one problem, solve it completely, then expand.`
    ])
  }

  if (q.includes('opportunit') || q.includes('market') || q.includes('tam')) {
    const opp = ctx.opportunities?.[0]
    if (opp) {
      return pick([
        `The clearest opportunity for ${name} is ${opp.toLowerCase()}. That's your wedge — own it before expanding.`,
        `${opp} is where I'd focus all your energy right now. It's the highest-leverage move for ${name} at this stage.`,
        `I keep coming back to ${opp.toLowerCase()} as the real unlock for ${name}. That's where the market is underserved.`
      ])
    }
    return pick([
      `${name} is in a space with real growth signals — the question is which segment you go after first.`,
      `The market opportunity is there. The key is finding the specific buyer who has this problem so badly they'll pay on day one.`,
      `Your TAM looks solid. But TAM doesn't matter until you have your first 100 customers. Focus on that first.`
    ])
  }

  if (q.includes('mvp') || q.includes('build first') || q.includes('scope') || q.includes('launch')) {
    if (ctx.mvpStrategy) {
      return pick([
        `For ${name}, here's my MVP thinking: ${ctx.mvpStrategy.slice(0, 180)}. Ship that, get feedback, then iterate.`,
        `The MVP for ${name} should be ruthlessly simple. ${ctx.mvpStrategy.slice(0, 160)}. Anything beyond that is a distraction.`,
        `I'd start with: ${ctx.mvpStrategy.slice(0, 180)}. Get it in front of users in 4 weeks, not 4 months.`
      ])
    }
    return pick([
      `Start with the single feature that proves your core value for ${name}. Everything else can wait until you have paying users.`,
      `The MVP question for ${name} is: what's the minimum you can build that someone would actually pay for? Start there.`,
      `For ${name}, ship something embarrassingly simple in 3 weeks. Real user feedback beats 3 months of polishing.`
    ])
  }

  if (q.includes('compet') || q.includes('rival') || q.includes('differentiat')) {
    return pick([
      `The key for ${name} isn't beating competitors — it's being the obvious choice for a specific user segment. Find that wedge and own it.`,
      `Competition is a good sign — it means the market exists. For ${name}, your differentiation needs to be something they can't easily copy.`,
      `Don't compete on features. ${name} should compete on who you serve and how deeply you understand their problem.`
    ])
  }

  if (q.includes('price') || q.includes('revenue') || q.includes('money') || q.includes('monetiz') || q.includes('charge')) {
    return pick([
      `For ${name}, start simple on pricing. Get users first, then charge the ones who get the most value.`,
      `Charge more than you think you should. Founders consistently underprice. Find 5 people who'd pay and start there.`,
      `The best pricing test for ${name} is to ask someone to pay right now. Their reaction tells you everything.`
    ])
  }

  if (q.includes('team') || q.includes('hire') || q.includes('co-founder')) {
    return pick([
      `For ${name}, you need someone who covers what you don't. Technical founder? Find a strong operator. Builder? Find someone who can sell.`,
      `Hire for the next 12 months, not the next 5 years. ${name} needs people who can do the work today.`,
      `The first 5 people at ${name} set the culture permanently. Hire people obsessed with the problem, not just the opportunity.`
    ])
  }

  if (q.includes('fund') || q.includes('invest') || q.includes('raise')) {
    return pick([
      `For ${name}, get to a clear proof point before raising. Investors fund momentum, not potential.`,
      `The best fundraising strategy for ${name} is to not need it. Build revenue first — it gives you leverage.`,
      `Before you raise for ${name}, answer this: what does $500K of ARR look like? That's the story investors want.`
    ])
  }

  const scoreMsg = score && score > 70
    ? `With a viability score of ${score}, ${name} has strong fundamentals.`
    : `${name} has real potential worth developing.`

  return pick([
    `${scoreMsg} The most important next step is getting in front of 5 potential customers this week — not building, just talking. ${freshnessHint}`.trim(),
    `That's worth digging into for ${name}. The validation report in your workspace has the specific data points to inform this. ${freshnessHint}`.trim(),
    `Good question. For ${name} at this stage: what does success look like in 90 days, and does this decision move you toward that? ${freshnessHint}`.trim(),
    `For ${name}, the answer depends on where you are in the validation cycle. Start with the executive briefing in your workspace. ${freshnessHint}`.trim()
  ])
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
- Use a fresh structure each time; vary the opener, sentence length, and closing question
- Do not repeat the same phrasing as your previous reply; answer from a new angle
- Sound natural when spoken aloud — no lists, no markdown, no bold
- Be honest, not just encouraging — if there's a real concern, say it
- End with one concrete next step or question back to them`
}

function buildGeminiRequest(question: string, ctx: StreamChatRequest['context']) {
  return {
    systemInstruction: {
      parts: [{ text: buildSystemPrompt(question, ctx) }]
    },
    contents: [{
      role: 'user',
      parts: [{ text: question }]
    }],
    generationConfig: {
      temperature: 0.85,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 220
    }
  }
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

  if (!apiKey || apiKey.length < 8) {
    console.warn('[Gemini/stream] GEMINI_API_KEY missing — using fallback')
  } else if (!isPlaceholderKey(apiKey)) {
    console.log('[Gemini/stream] Using key prefix:', apiKey.slice(0, 8) + '...')
  }

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

  // ── Gemini request + local SSE re-streaming ───────────────────────────────────
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const geminiRequest = buildGeminiRequest(question, context)

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)))
      }

      try {
        const geminiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiRequest),
          signal: request.signal
        })

        if (!geminiRes.ok || !geminiRes.body) {
          const errBody = geminiRes.ok ? '' : await geminiRes.text().catch(() => '')
          console.error(`[Gemini/stream] HTTP ${geminiRes.status} from Gemini:`, errBody.slice(0, 300))
          const fallback = buildFallbackAnswer(question, context)
          for (const word of fallback.split(/\s+/)) {
            if (!word) continue
            send('token', { token: `${word} ` })
          }
          send('done', { answer: cleanForVoice(fallback) })
          controller.close()
          return
        }

        const data = await geminiRes.json().catch(() => null)
        const rawAnswer = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('') ?? ''
        const final = cleanForVoice(rawAnswer) || buildFallbackAnswer(question, context)

        for (const word of final.split(/\s+/)) {
          if (!word) continue
          send('token', { token: `${word} ` })
          await new Promise(resolve => setTimeout(resolve, 24))
        }

        send('done', { answer: final })
        controller.close()

      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          controller.close()
          return
        }
        console.warn('[/api/advisor/chat/stream] Error:', err)
        const fallback = buildFallbackAnswer(question, context)
        for (const word of fallback.split(/\s+/)) {
          if (!word) continue
          send('token', { token: `${word} ` })
        }
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
