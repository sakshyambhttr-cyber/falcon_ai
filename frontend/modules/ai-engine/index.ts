import type { AIEngineResponse, AIPRD, AIRoadmapItem, AIValidation } from '../../types/core'

const MAX_IDEA_LENGTH = 4000
const PLACEHOLDER_GEMINI_PREFIXES = ['your-gemini-key', 'changeme', 'placeholder', 'insert-key']

function normalizeIdea(input: string): string {
  return input.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_IDEA_LENGTH)
}

function hashText(input: string): number {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return hash
}

function extractKeywords(idea: string): string[] {
  const stopWords = new Set(['want', 'build', 'that', 'with', 'from', 'this', 'help', 'helps', 'platform', 'using'])
  const filtered = idea
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(word => word.trim())
    .filter(word => word.length > 3 && !stopWords.has(word))
  return Array.from(new Set(filtered)).slice(0, 8)
}

function isPlaceholderApiKey(key: string | undefined): boolean {
  if (!key || key.length < 8) return true
  const normalized = key.trim().toLowerCase()
  return PLACEHOLDER_GEMINI_PREFIXES.some(prefix => normalized.startsWith(prefix.toLowerCase()))
}

function productTitleFromIdea(idea: string, keywords: string[]): string {
  if (keywords.length >= 2) {
    return keywords.slice(0, 3).map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
  }
  const trimmed = idea.trim()
  if (trimmed.length <= 48) return trimmed
  return `${trimmed.slice(0, 45).trim()}...`
}

function generateMockAIEngineResponse(idea: string): AIEngineResponse {
  const keywords = extractKeywords(idea)
  const focus = keywords[0] || 'innovators'
  const title = productTitleFromIdea(idea, keywords)
  const hash = hashText(idea)
  const score = Math.min(94, Math.max(52, 58 + (hash % 32) + Math.min(keywords.length * 2, 8)))

  return {
    startupName: title,
    executiveBriefing: `I've looked at your idea for ${title}, and there's something genuinely interesting here. You're targeting ${focus} — a group that's underserved and actively looking for better tools. The timing is right.\n\nThe biggest opportunity is the gap between what people in this space need and what currently exists. If you can close that gap faster than anyone else, you have a real shot at owning this category early.\n\nFor your MVP, keep it tight. Focus on the one thing that delivers the most value, and resist the urge to build everything at once. The risk to watch is scope creep — it's the thing that kills early-stage products more than anything else.\n\nMy recommendation: get something in front of real users within eight weeks. The feedback you'll get is worth more than any amount of planning. The workspace has your full analysis ready — start with the validation report.`,
    validationReport: {
      marketPotential: `The target addressable market segment for AI-native builder platforms focused on ${focus} is growing rapidly, with a projected CAGR of 18% over the next five years. Early validation signals show massive developer demand.`,
      opportunityScore: score,
      riskAssessment: `Key operational risks include managing execution velocity against larger incumbents, maintaining high developer engagement, and early acquisition costs before organic growth loops kick in.`,
      strengths: [
        `Highly specialized workflow targeting a clearly defined customer pain point`,
        `10x faster time-to-insight compared to generic generative text interfaces`,
        `Frictionless, voice-native capture that captures abstract concepts instantly`
      ],
      weaknesses: [
        `Reliance on third-party speech synthesis and LLM pricing margins`,
        `No native database persistence in the earliest prototype release`,
        `Limited defensive moat against generic foundation model wrappers`
      ]
    },
    prd: {
      overview: `${title} is a modular, voice-first intelligence workbench designed to accelerate startup ideation, product validation, and roadmap alignment.`,
      userStories: [
        `As an entrepreneur, I want to pitch my idea in plain natural language so I can instantly receive validation and structured specifications.`,
        `As a product manager, I want a complete set of PRD features and developer stories synthesized in one place to skip administrative overhead.`,
        `As a technical leader, I want a high-fidelity roadmap to align with stakeholders on execution milestones.`
      ],
      features: [
        `Intelligent natural-language ingestion and structured blueprint generation`,
        `Premium dual-output workspace interface with separated interactive tabs`,
        `Natural co-founder voice briefing playback powered by speech synthesis`
      ],
      requirements: [
        `Response latency must remain under 6 seconds for optimal conversational flow`,
        `Markdown documents must be fully responsive across both mobile and desktop screens`,
        `All API errors must fail gracefully and fall back to high-fidelity mock generators`
      ]
    },
    roadmap: {
      phase1: {
        name: `Discovery & Core Validation`,
        tasks: [
          `Conduct 10 validation interviews with target ${focus}`,
          `Launch interactive landing page and waitlist form`,
          `Synthesize primary monetization opportunities and pricing models`
        ]
      },
      phase2: {
        name: `MVP Development`,
        tasks: [
          `Build responsive next-gen workspace and tab controls`,
          `Integrate high-performance Gemini Flash API endpoints`,
          `Implement realistic voice advisor narration playback`
        ]
      },
      phase3: {
        name: `Beta Launch & Feedback`,
        tasks: [
          `Deploy production build to Vercel and run private beta with 50 users`,
          `Integrate automatic markdown document download and export`,
          `Analyze voice engagement duration and feature usage metrics`
        ]
      },
      milestones: [
        `Milestone 1: Complete UI layout and local fallback flow (Week 2)`,
        `Milestone 2: Finalize full live Gemini and voice integrations (Week 6)`,
        `Milestone 3: Public launch on Product Hunt with 200 waitlisted signups (Week 10)`
      ]
    },
    mvpStrategy: {
      launchStrategy: `Launch a single-purpose interactive sandbox as a web app. Drive initial traction by showing immediate, high-value visual blueprints to builders.`,
      minimumFeatures: [
        `Natural language startup ideation input text area`,
        `Structured co-founder speech synthesis playback`,
        `Premium generated documents: Validation Report, PRD, Roadmap, and MVP Strategy`
      ],
      firstUsers: `Early-stage indie hackers, student operators, and product managers seeking to rapidly validate early ideas.`
    },
    internalAnalysis: {
      concept: `A voice-first operating system that acts as a technical co-founder.`,
      targetAudience: `Entrepreneurs, Indie Hackers, Student Founders, Product Managers`,
      painPoints: [`No access to mentors`, `High cost of advisory`, `Slow document generation`],
      businessModel: `Freemium SaaS with usage-based AI generation credits`,
      marketOpportunity: `Millions of new developers seeking high-velocity launch systems`,
      competitors: [`Generic ChatGPT`, `Traditional PDF business planners`],
      strengths: [`Voice native`, `Instant PRDs`],
      weaknesses: [`High prompt latency`],
      risks: [`Scale limits`],
      monetization: [`SaaS tier`, `API billing`],
      productScope: `MVP scoping of AI, Voice, PRD, Roadmap`,
      mvpRecommendations: `Keep database requirements thin, focus on premium generation visual tabs`,
      technicalComplexity: `Moderate Next.js client-side streaming and speech synthesis controls`,
      growthPotential: `High viral loops from shared blueprint exports`
    }
  }
}

export function sanitizeStartupIdea(input: string): string {
  const idea = normalizeIdea(input)
  if (!idea) throw new Error('Startup idea is required')
  return idea
}

/**
 * GEMINI MODEL RESOLUTION
 *
 * Tries models in order of preference.
 * gemini-2.5-flash and gemini-2.0-flash-exp are the current working models.
 * Falls back down the list if a model is not found (404).
 */
const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.0-pro',
]

async function callGeminiModel(
  body: object,
  apiKey: string
): Promise<Response> {
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    // If NOT a 404 (model not found), return whatever response we got
    if (res.status !== 404) {
      console.log(`[Gemini/ai-engine] Using model: ${model} (HTTP ${res.status})`)
      return res
    }
    console.warn(`[Gemini/ai-engine] Model ${model} returned 404, trying next...`)
  }
  throw new Error('All Gemini models returned 404 — no valid model found for this API key')
}

async function callGemini(idea: string, apiKey: string): Promise<AIEngineResponse> {
  const prompt = `You are Founder Falcon, an experienced startup co-founder and elite product strategist.
Your role is to analyze the following startup idea as a conversational, highly capable AI Co-Founder who is strategic, confident, and concise.

Startup Idea: "${idea}"

Perform a deep, comprehensive analysis of the idea across the following dimensions:
1. Startup concept
2. Target audience
3. Customer pain points
4. Business model
5. Market opportunity
6. Competitors
7. Strengths
8. Weaknesses
9. Risks
10. Monetization opportunities
11. Product scope
12. MVP recommendations
13. Technical complexity
14. Growth potential

Return a single valid JSON object. Do NOT wrap the JSON in markdown code blocks (\`\`\`json or similar). Return ONLY the raw JSON string matching exactly this shape:
{
  "startupName": "A catchy, short name for the startup",
  "executiveBriefing": "Write this as a senior startup advisor speaking directly and naturally to the founder — warm, confident, strategic, and conversational. Cover: what the idea is, who it serves, why the market timing is right, the single biggest opportunity, the main risk to manage, and the recommended first move. Use short sentences. Vary sentence length for natural rhythm. No lists, no markdown, no bold text, no numbers or percentages. Write exactly 3 to 5 short paragraphs separated by a single newline. Each paragraph should be 2 to 4 sentences. Total length: 130 to 180 words. This text will be spoken aloud by a voice AI — it must sound completely natural when read out loud.",
  "validationReport": {
    "marketPotential": "A detailed 1-2 sentence analysis of the target market potential.",
    "opportunityScore": 85,
    "riskAssessment": "A clear, professional summary of the primary operational and market risks.",
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"]
  },
  "prd": {
    "overview": "A concise overview of the product requirements and system vision.",
    "userStories": ["Story 1", "Story 2", "Story 3"],
    "features": ["Core Feature 1 with short description", "Core Feature 2 with short description", "Core Feature 3 with short description"],
    "requirements": ["Requirement 1 (e.g. latency, security, scale)", "Requirement 2", "Requirement 3"]
  },
  "roadmap": {
    "phase1": {
      "name": "Phase 1 Title",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    },
    "phase2": {
      "name": "Phase 2 Title",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    },
    "phase3": {
      "name": "Phase 3 Title",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    },
    "milestones": ["Milestone 1 with timeline", "Milestone 2 with timeline", "Milestone 3 with timeline"]
  },
  "mvpStrategy": {
    "launchStrategy": "A strategic, high-value roadmap for launching the MVP successfully.",
    "minimumFeatures": ["Launch Feature 1", "Launch Feature 2", "Launch Feature 3"],
    "firstUsers": "Detailed plan on how to acquire the very first cohort of active users."
  },
  "internalAnalysis": {
    "concept": "A 1-sentence concept analysis summary",
    "targetAudience": "Description of primary user personas",
    "painPoints": ["Pain Point 1", "Pain Point 2"],
    "businessModel": "Primary business model",
    "marketOpportunity": "Description of the market opportunity size and timing",
    "competitors": ["Competitor 1", "Competitor 2"],
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "risks": ["Risk 1", "Risk 2"],
    "monetization": ["Revenue stream 1", "Revenue stream 2"],
    "productScope": "Key system scoping limits",
    "mvpRecommendations": "Critical operational focus for initial product launch",
    "technicalComplexity": "Estimated engineering level and challenges",
    "growthPotential": "Estimated viral loops and growth scaling potential"
  }
}`

  const apiResponse = await callGeminiModel(
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    },
    apiKey
  )

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text().catch(() => '(unreadable)')
    console.error(`[Gemini/ai-engine] HTTP ${apiResponse.status} from Gemini API`)
    console.error('[Gemini/ai-engine] Response body:', errorBody.slice(0, 500))
    throw new Error(`Gemini API failed with status ${apiResponse.status}: ${errorBody.slice(0, 200)}`)
  }

  const data = await apiResponse.json()
  const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!contentText) throw new Error('Gemini API returned an empty response')

  const cleanText = contentText.trim()
  const result = JSON.parse(cleanText) as AIEngineResponse
  
  if (!result.startupName || !result.executiveBriefing || !result.validationReport || !result.prd || !result.roadmap || !result.mvpStrategy) {
    throw new Error('Invalid JSON structure returned by Gemini Flash')
  }

  return result
}

export async function generateAIEngineResponse(input: string): Promise<AIEngineResponse> {
  const idea = sanitizeStartupIdea(input)
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey || apiKey.length < 8) {
    console.warn('[Gemini/ai-engine] GEMINI_API_KEY is missing or too short — using mock response')
    return generateMockAIEngineResponse(idea)
  }

  if (isPlaceholderApiKey(apiKey)) {
    console.warn('[Gemini/ai-engine] GEMINI_API_KEY looks like a placeholder — using mock response')
    return generateMockAIEngineResponse(idea)
  }

  try {
    console.log('[Gemini/ai-engine] Calling Gemini API with key prefix:', apiKey.slice(0, 8) + '...')
    const result = await callGemini(idea, apiKey)
    console.log('[Gemini/ai-engine] ✓ Gemini responded successfully')
    return result
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[Gemini/ai-engine] ✗ Gemini API call failed:', msg)
    console.error('[Gemini/ai-engine] Key prefix used:', apiKey.slice(0, 8) + '...')
    console.error('[Gemini/ai-engine] Falling back to mock response')
    return generateMockAIEngineResponse(idea)
  }
}

export async function analyzeIdea(input: string): Promise<AIEngineResponse> {
  return generateAIEngineResponse(input)
}

export default { analyzeIdea, generateAIEngineResponse, sanitizeStartupIdea }
