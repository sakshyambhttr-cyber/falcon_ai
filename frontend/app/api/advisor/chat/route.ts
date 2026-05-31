/**
 * POST /api/advisor/chat
 *
 * Continuous AI co-founder conversation endpoint.
 * Receives the user's question + full project context, calls Gemini,
 * returns a short advisor-style spoken response.
 *
 * This replaces the keyword-matching follow-up system with a real LLM call.
 */

import { checkStrictRateLimit } from '../../../../lib/rate-limit'
import { parseBody } from '../../../../lib/validation'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const AdvisorChatSchema = z.object({
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

type AdvisorChatRequest = z.infer<typeof AdvisorChatSchema>

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  })
}

function isPlaceholderKey(key: string | undefined): boolean {
  if (!key || key.length < 8) return true
  const n = key.trim().toLowerCase()
  return ['aq.ab8rn6k4xxx', 'your-gemini-key', 'changeme'].some(p => n.startsWith(p))
}

function buildFallbackAnswer(question: string, ctx: AdvisorChatRequest['context']): string {
  const name = ctx.startupName ?? 'your startup'
  const q = question.toLowerCase()

  if (q.includes('risk') || q.includes('challenge')) {
    const risk = ctx.risks?.[0]
    return risk
      ? `The biggest risk for ${name} is ${risk.toLowerCase()}. Address it early — it's the kind of thing that compounds if you ignore it.`
      : `Every startup faces execution risk. For ${name}, I'd focus on validating your core assumption before scaling anything.`
  }
  if (q.includes('opportunit') || q.includes('market')) {
    const opp = ctx.opportunities?.[0]
    return opp
      ? `The clearest opportunity for ${name} is ${opp.toLowerCase()}. That's where I'd focus your energy first.`
      : `The market analysis is in your workspace. ${name} is in a space with real growth potential.`
  }
  if (q.includes('mvp') || q.includes('build first') || q.includes('start')) {
    return ctx.mvpStrategy
      ? `For ${name}, here's my thinking on the MVP: ${ctx.mvpStrategy.slice(0, 200)}.`
      : `Start with the single feature that proves your core value. Everything else can wait.`
  }
  if (q.includes('compet') || q.includes('rival')) {
    return `The key for ${name} isn't beating competitors — it's being the obvious choice for a specific user. Find that wedge and own it.`
  }
  if (q.includes('price') || q.includes('revenue') || q.includes('money') || q.includes('monetiz')) {
    return `For ${name}, I'd start with a simple freemium model. Get users first, then charge the ones who get the most value. Don't over-engineer pricing at this stage.`
  }
  if (q.includes('team') || q.includes('hire') || q.includes('co-founder')) {
    return `For ${name}, you need someone who covers what you don't. If you're technical, find a strong operator. If you're a builder, find someone who can sell. That's the founding team.`
  }
  return `That's a good question for ${name}. The full analysis is in your workspace — the validation report and PRD should give you the context you need to think this through.`
}

async function callGeminiForChat(
  question: string,
  ctx: AdvisorChatRequest['context'],
  apiKey: string
): Promise<string> {
  const history = ctx.conversationHistory ?? []
  const historyText = history.length > 0
    ? '\n\nConversation so far:\n' + history.map(m => `${m.role === 'user' ? 'Founder' : 'Advisor'}: ${m.text}`).join('\n')
    : ''

  const systemPrompt = `You are Falcon, an experienced AI startup co-founder and advisor. You are speaking directly to a founder about their startup.

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

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
        stopSequences: ['\n\n\n']
      }
    })
  })

  if (!res.ok) throw new Error(`Gemini ${res.status}`)

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty Gemini response')

  // Clean for voice
  return text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request: Request) {
  const rateLimitResponse = await checkStrictRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const raw = await request.json().catch(() => ({}))
    const parsed = parseBody(AdvisorChatSchema, raw)
    if (!parsed.success) {
      return json({ error: parsed.error }, 400)
    }

    const { question, context } = parsed.data
    const apiKey = process.env.GEMINI_API_KEY

    let answer: string

    if (!isPlaceholderKey(apiKey)) {
      try {
        answer = await callGeminiForChat(question, context, apiKey!)
      } catch (err) {
        console.warn('[/api/advisor/chat] Gemini failed, using fallback:', err)
        answer = buildFallbackAnswer(question, context)
      }
    } else {
      answer = buildFallbackAnswer(question, context)
    }

    return json({ answer })
  } catch (error) {
    console.error('[/api/advisor/chat] Error:', error)
    return json({ error: 'Failed to generate response' }, 500)
  }
}
