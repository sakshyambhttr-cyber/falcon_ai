import type { AIEngineResponse, AIPRD, AIRoadmapItem, AIValidation } from '../../types/core'

const MAX_IDEA_LENGTH = 4000
const PLACEHOLDER_GEMINI_PREFIXES = ['AQ.Ab8RN6K4xxx', 'your-gemini-key', 'changeme']

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

function buildValidation(idea: string): AIValidation {
  const hash = hashText(idea)
  const keywords = extractKeywords(idea)
  const focus = keywords.slice(0, 3).join(', ') || 'your target market'
  const score = Math.min(94, Math.max(52, 58 + (hash % 32) + Math.min(keywords.length * 2, 8)))
  return {
    summary: `Strong early signal for a solution focused on ${focus}. The concept maps to clear user pain, measurable outcomes, and a viable MVP scope for a first release in 8–12 weeks.`,
    score
  }
}

function buildPrd(idea: string): AIPRD {
  const keywords = extractKeywords(idea)
  const productName = productTitleFromIdea(idea, keywords)
  const focus = keywords[0] || 'users'
  return {
    title: productName,
    features: [
      `Intelligent intake that understands natural-language goals: "${idea.slice(0, 80)}${idea.length > 80 ? '...' : ''}"`,
      `Personalized matching engine for ${focus} with explainable ranking and confidence scores`,
      `Guided workflow hub with progress tracking, reminders, and exportable deliverables`,
      `Analytics dashboard measuring activation, completion rate, and retention cohorts`
    ],
    userStories: [
      `As a ${focus.endsWith('s') ? focus.slice(0, -1) : focus}, I want to describe my goal in plain language so the system can recommend the best next actions.`,
      `As an operator, I want structured outputs (validation, PRD, roadmap) generated in one session without switching tools.`,
      `As a stakeholder, I want a concise viability score and milestone plan to decide whether to fund the MVP.`
    ]
  }
}

function buildRoadmap(idea: string): AIRoadmapItem[] {
  const keywords = extractKeywords(idea)
  const focus = keywords[0] || 'core users'
  return [
      {
        phase: 'Phase 1: Discovery & Validation',
        tasks: [
          `Interview 12–15 ${focus} and validate problem intensity`,
          'Define success metrics, ICP, and pricing hypothesis',
          'Ship landing page + waitlist to measure demand'
        ]
      },
      {
        phase: 'Phase 2: MVP Build',
        tasks: [
          'Implement AI intake + structured output pipeline',
          'Launch core matching/recommendation workflow',
          'Add onboarding, auth, and basic analytics'
        ]
      },
      {
        phase: 'Phase 3: Launch & Scale',
        tasks: [
          'Run closed beta with 50 active users',
          'Integrate voice feedback loop and document exports',
          'Expand channels, partnerships, and retention loops'
        ]
      }
    ]
}

export function sanitizeStartupIdea(input: string): string {
  const idea = normalizeIdea(input)
  if (!idea) throw new Error('Startup idea is required')
  return idea
}

async function callGemini(idea: string, apiKey: string): Promise<AIEngineResponse> {
  const prompt = `You are Founder Falcon, an AI startup co-founder.
Analyze this startup idea: "${idea}"

Return ONLY valid JSON matching this shape (no markdown):
{
  "validation": { "score": number (0-100), "summary": string },
  "prd": { "title": string, "features": string[] (min 3), "userStories": string[] (min 3) },
  "roadmap": [{ "phase": string, "tasks": string[] }]
}`

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const apiResponse = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  })

  if (!apiResponse.ok) {
    throw new Error(`Gemini API failed with status ${apiResponse.status}`)
  }

  const data = await apiResponse.json()
  const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!contentText) throw new Error('Gemini API returned an empty response')

  const result = JSON.parse(contentText.trim()) as AIEngineResponse
  if (!result.validation || !result.prd || !result.roadmap?.length) {
    throw new Error('Invalid JSON structure returned by Gemini')
  }
  return result
}

export async function generateAIEngineResponse(input: string): Promise<AIEngineResponse> {
  const idea = sanitizeStartupIdea(input)
  const apiKey = process.env.GEMINI_API_KEY

  if (!isPlaceholderApiKey(apiKey)) {
    try {
      return await callGemini(idea, apiKey!)
    } catch (error) {
      console.error('Gemini API call failed, falling back to local engine:', error)
    }
  }

  return {
    validation: buildValidation(idea),
    prd: buildPrd(idea),
    roadmap: buildRoadmap(idea)
  }
}

export async function analyzeIdea(input: string): Promise<AIEngineResponse> {
  return generateAIEngineResponse(input)
}

export default { analyzeIdea, generateAIEngineResponse, sanitizeStartupIdea }
