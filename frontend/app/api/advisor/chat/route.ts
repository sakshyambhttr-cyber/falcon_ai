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
  // Only reject obvious placeholder strings — not real keys that happen to contain common substrings
  return ['your-gemini-key', 'changeme', 'placeholder', 'insert-key'].some(p => n.startsWith(p))
}

function buildFallbackAnswer(question: string, ctx: AdvisorChatRequest['context']): string {
  const name = ctx.startupName ?? 'your startup'
  const q = question.toLowerCase()
  const score = ctx.viabilityScore

  // Varied response pools — pick randomly to avoid repetition
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  if (q.includes('risk') || q.includes('challenge') || q.includes('problem')) {
    const risk = ctx.risks?.[0]
    if (risk) {
      return pick([
        `The biggest risk I see for ${name} is ${risk.toLowerCase()}. I'd tackle that head-on in the first 30 days — it's the kind of thing that compounds if you leave it.`,
        `${risk} is the one I'd lose sleep over for ${name}. Map out your mitigation plan before you write a single line of code.`,
        `Honestly, ${risk.toLowerCase()} is the real test for ${name}. If you can solve that, the rest gets much easier.`
      ])
    }
    return pick([
      `Every early-stage startup has execution risk. For ${name}, I'd focus on validating your core assumption with real users before building anything else.`,
      `The biggest risk at this stage isn't competition — it's building something nobody wants. Get ${name} in front of 10 real users this week.`,
      `For ${name}, the challenge is staying focused. Pick one problem, solve it completely, then expand. Don't try to do everything at once.`
    ])
  }

  if (q.includes('opportunit') || q.includes('market') || q.includes('tam') || q.includes('size')) {
    const opp = ctx.opportunities?.[0]
    if (opp) {
      return pick([
        `The clearest opportunity for ${name} is ${opp.toLowerCase()}. That's your wedge — own it completely before expanding.`,
        `${opp} is where I'd focus all your energy right now. It's the highest-leverage move for ${name} at this stage.`,
        `I keep coming back to ${opp.toLowerCase()} as the real unlock for ${name}. That's where the market is underserved.`
      ])
    }
    return pick([
      `The market analysis is in your workspace. ${name} is in a space with real growth signals — the question is which segment you go after first.`,
      `For ${name}, the market opportunity is there. The key is finding the specific buyer who has this problem so badly they'll pay on day one.`,
      `Your TAM looks solid. But TAM doesn't matter until you have your first 100 customers. Focus on that before worrying about market size.`
    ])
  }

  if (q.includes('mvp') || q.includes('build first') || q.includes('start') || q.includes('launch')) {
    if (ctx.mvpStrategy) {
      return pick([
        `For ${name}, here's my MVP thinking: ${ctx.mvpStrategy.slice(0, 180)}. Ship that, get feedback, then iterate.`,
        `The MVP for ${name} should be ruthlessly simple. ${ctx.mvpStrategy.slice(0, 160)}. Anything beyond that is a distraction right now.`,
        `I'd start with: ${ctx.mvpStrategy.slice(0, 180)}. Get it in front of users in 4 weeks, not 4 months.`
      ])
    }
    return pick([
      `Start with the single feature that proves your core value for ${name}. Everything else can wait until you have paying users.`,
      `The MVP question for ${name} is: what's the minimum you can build that someone would actually pay for? Start there.`,
      `For ${name}, I'd ship something embarrassingly simple in 3 weeks. Real user feedback is worth more than 3 months of polishing.`
    ])
  }

  if (q.includes('compet') || q.includes('rival') || q.includes('differentiat')) {
    return pick([
      `The key for ${name} isn't beating competitors — it's being the obvious choice for a specific user segment. Find that wedge and own it completely.`,
      `Competition is a good sign — it means the market exists. For ${name}, your differentiation needs to be something they can't easily copy in 6 months.`,
      `Don't compete on features. ${name} should compete on who you serve and how well you understand their specific problem.`
    ])
  }

  if (q.includes('price') || q.includes('revenue') || q.includes('money') || q.includes('monetiz') || q.includes('charge')) {
    return pick([
      `For ${name}, I'd start with a simple pricing model. Get users first, then charge the ones who get the most value. Don't over-engineer pricing at this stage.`,
      `Charge more than you think you should. Founders consistently underprice. For ${name}, find 5 people who'd pay $X and start there.`,
      `The best pricing test for ${name} is to ask someone to pay right now. Their reaction tells you everything about your value proposition.`
    ])
  }

  if (q.includes('team') || q.includes('hire') || q.includes('co-founder') || q.includes('people')) {
    return pick([
      `For ${name}, you need someone who covers what you don't. If you're technical, find a strong operator. If you're a builder, find someone who can sell.`,
      `Hire for the next 12 months, not the next 5 years. ${name} needs people who can do the work today, not just manage it later.`,
      `The first 5 people at ${name} set the culture permanently. Hire people who are obsessed with the problem, not just the opportunity.`
    ])
  }

  if (q.includes('fund') || q.includes('invest') || q.includes('raise') || q.includes('capital')) {
    return pick([
      `For ${name}, I'd focus on getting to a clear proof point before raising. Investors fund momentum, not potential.`,
      `The best fundraising strategy for ${name} is to not need it. Build revenue first — it gives you leverage and better terms.`,
      `Before you raise for ${name}, answer this: what does $500K of ARR look like? That's the story investors want to hear.`
    ])
  }

  if (q.includes('next step') || q.includes('what should') || q.includes('advice') || q.includes('suggest')) {
    const scoreMsg = score && score > 70
      ? `With a viability score of ${score}, ${name} has strong fundamentals.`
      : score && score > 50
        ? `${name} has a solid foundation to build on.`
        : `${name} has real potential worth developing.`
    return pick([
      `${scoreMsg} The most important next step is getting in front of 5 potential customers this week — not building, not planning, just talking.`,
      `${scoreMsg} I'd focus on one thing: finding someone who has this problem so badly they'd pay for a solution today. That conversation changes everything.`,
      `${scoreMsg} Your next move should be validating the riskiest assumption in your model. What's the one thing that, if wrong, kills the whole idea?`
    ])
  }

  // Generic fallback — still varied
  return pick([
    `That's worth digging into for ${name}. Check the validation report in your workspace — it has the specific data points that should inform this decision.`,
    `Good question. For ${name} at this stage, I'd frame it this way: what does success look like in 90 days, and does this decision move you toward that?`,
    `For ${name}, the answer depends on where you are in the validation cycle. The PRD and market analysis in your workspace should give you the context to think this through clearly.`,
    `That's the right thing to be thinking about for ${name}. The workspace has your full analysis — I'd start with the executive briefing and work from there.`
  ])
}

/**
 * GEMINI MODEL RESOLUTION — tries models in order until one works
 */
const GEMINI_MODELS_CHAT = [
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.0-pro',
]

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

  const requestBody = {
    contents: [{ parts: [{ text: systemPrompt }] }],
    generationConfig: {
      temperature: 0.85,
      topP: 0.95,
      maxOutputTokens: 220,
    }
  }

  let lastError = ''
  for (const model of GEMINI_MODELS_CHAT) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    if (res.status === 404) {
      console.warn(`[Gemini/chat] Model ${model} not found, trying next...`)
      continue
    }
    if (!res.ok) {
      lastError = `HTTP ${res.status}`
      const errBody = await res.text().catch(() => '')
      console.error(`[Gemini/chat] ${model} failed ${res.status}:`, errBody.slice(0, 200))
      throw new Error(`Gemini ${res.status}`)
    }
    console.log(`[Gemini/chat] Using model: ${model}`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Empty Gemini response')
    return text
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/`[^`]+`/g, '')
      .replace(/\n{2,}/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  throw new Error(`All Gemini models failed. Last error: ${lastError}`)
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
