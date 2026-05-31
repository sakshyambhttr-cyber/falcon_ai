/**
 * MURF FALCON — VOICE PROCESSING LAYER
 *
 * Converts structured AI intelligence output into natural, conversational
 * speech that sounds like a senior startup advisor — not a document reader.
 *
 * Architecture:
 *   AI Intelligence Output (workspace)
 *         ↓
 *   generateVoiceResponse()   ← this module
 *         ↓
 *   Murf API (speech synthesis)
 *         ↓
 *   User hears advisor-style spoken response
 */

import type { IntelligenceUIState } from './intelligence-state'

export type VoiceContext = {
  idea: string
  state: IntelligenceUIState
}

// ─── SPEECH CLEANING ────────────────────────────────────────────────────────

/**
 * Strip everything that sounds bad when spoken aloud:
 * markdown, tables, JSON, scores, formatting artifacts.
 */
export function cleanForSpeech(raw: string): string {
  return raw
    // Remove markdown headings
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    // Remove inline code
    .replace(/`[^`]+`/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove table rows (| col | col |)
    .replace(/\|[^\n]+\|/g, '')
    // Remove table separators (| --- | --- |)
    .replace(/\|[\s\-:|]+\|/g, '')
    // Remove bullet points, dashes, numbered lists
    .replace(/^[\s]*[-•*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove raw numbers that look like scores (e.g. "84%", "84 percent")
    .replace(/\b\d{1,3}%/g, '')
    // Remove JSON-like fragments
    .replace(/\{[^}]*\}/g, '')
    .replace(/\[[^\]]*\]/g, '')
    // Remove special characters that don't speak well
    .replace(/[_~^<>]/g, '')
    // Collapse multiple spaces/newlines
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    // Remove trailing punctuation artifacts
    .replace(/\s+([.,;:])/g, '$1')
    .trim()
}

/**
 * Break a long text into natural sentence chunks for smoother TTS pacing.
 * Murf handles full sentences better than one giant paragraph.
 */
export function chunkIntoSentences(text: string, maxChunkLength = 300): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > maxChunkLength && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current = current ? `${current} ${sentence}` : sentence
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks
}

/**
 * Add natural pacing to text before sending to Murf.
 * Inserts a short pause after sentence-ending punctuation so the
 * advisor doesn't rush through the response.
 *
 * Murf respects double-space after periods as a soft pause cue.
 */
export function addNaturalPacing(text: string): string {
  return text
    // Ensure single space after sentence-ending punctuation (normalize first)
    .replace(/([.!?])\s+/g, '$1 ')
    // Add a soft pause (double space) after sentences for Murf pacing
    .replace(/([.!?]) ([A-Z])/g, '$1  $2')
    // Ensure em-dash pauses are respected
    .replace(/\s*—\s*/g, ' — ')
    .trim()
}

// ─── VOICE PERSONA TEMPLATES ─────────────────────────────────────────────────

/**
 * Murf Falcon Voice Persona: Senior Startup Advisor
 *
 * Tone: intelligent, warm, confident, strategic, conversational
 * Style: mentor who has built companies, not a narrator reading a report
 * Avoid: robotic enumeration, score reading, document narration
 */

function advisorOpener(ideaKeyword: string): string {
  const openers = [
    `This is a genuinely interesting space to be building in.`,
    `There's real potential here, and I want to walk you through what I'm seeing.`,
    `I've looked at this carefully, and here's my honest take.`,
    `This idea has some strong signals worth paying attention to.`,
    `Let me share what stands out to me about this opportunity.`,
  ]
  // Deterministic selection based on keyword hash so it's consistent per idea
  const hash = ideaKeyword.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return openers[hash % openers.length]
}

function advisorCloser(): string {
  const closers = [
    `The workspace has the full breakdown — validation report, PRD, and roadmap are all ready for you.`,
    `I've put together the complete analysis in your workspace. Take a look at the roadmap when you're ready.`,
    `Everything is laid out in the workspace. The next step is yours.`,
    `The detailed plan is in your workspace. I'd start with the validation report.`,
  ]
  return closers[Math.floor(Math.random() * closers.length)]
}

// ─── MAIN VOICE RESPONSE GENERATOR ───────────────────────────────────────────

/**
 * generateVoiceResponse()
 *
 * Converts the full AI intelligence output into a short, natural,
 * advisor-style spoken response. This is the ONLY text sent to Murf.
 *
 * Target: 20–50 seconds of natural speech (~60–130 words)
 */
export function generateVoiceResponse(ctx: VoiceContext): string {
  const { idea, state } = ctx
  const { memory } = state

  const keywords = memory.analysis?.keywords ?? []
  const primaryKeyword = keywords[0] ?? idea.split(' ').slice(0, 3).join(' ')

  // ── Case 1: Full pipeline complete — richest response ──────────────────────
  if (memory.final && memory.validation && memory.analysis) {
    // If an executive briefing exists, use it exclusively for speech
    const briefing = memory.final.executive_briefing
    if (briefing && briefing.trim()) {
      // Clean and cap at 180 words — ~75s at natural advisor pace
      const cleaned = cleanForSpeech(briefing)
      const words = cleaned.split(/\s+/).filter(Boolean)
      const maxWords = 180
      let truncated: string
      if (words.length > maxWords) {
        // Truncate at sentence boundary near the word limit
        const rough = words.slice(0, maxWords).join(' ')
        const lastPunct = rough.search(/[.!?][^.!?]*$/)
        truncated = lastPunct > rough.length * 0.6
          ? rough.slice(0, lastPunct + 1)
          : rough
      } else {
        truncated = cleaned
      }
      return addNaturalPacing(truncated.trim())
    }

    const { final, validation, analysis, market } = memory

    const name = final.startup_name_suggestion
    const pitch = cleanForSpeech(final.one_line_pitch)
      .replace(new RegExp(`^${name}[:.\\s]+`, 'i'), '') // remove redundant name prefix
      .trim()

    const viability = validation.viability_score
    const viabilityWord =
      viability >= 80 ? 'strong' :
      viability >= 65 ? 'solid' :
      viability >= 50 ? 'moderate' :
      'early-stage'

    const topOpportunity = cleanForSpeech(validation.opportunities?.[0] ?? '')
    const topRisk = cleanForSpeech(validation.risks?.[0] ?? '')
    const category = analysis.category ?? 'SaaS'
    const competition = market?.competition_level ?? 'medium'

    const competitionLine =
      competition === 'high'
        ? `The competitive landscape is crowded, so differentiation will be critical from day one.`
        : competition === 'medium'
        ? `There's competition, but the market isn't saturated — there's room to carve out a strong position.`
        : `The competitive landscape looks relatively open, which is a real advantage right now.`

    const parts: string[] = [
      advisorOpener(primaryKeyword),
      `${name} is a ${viabilityWord} opportunity in the ${category} space.`,
      pitch ? `${pitch}.` : '',
      topOpportunity ? `The biggest opportunity I see is ${topOpportunity.toLowerCase()}.` : '',
      competitionLine,
      topRisk ? `The main challenge to watch is ${topRisk.toLowerCase()}.` : '',
      advisorCloser(),
    ]

    return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  }

  // ── Case 2: Validation complete but no final summary yet ───────────────────
  if (memory.validation && memory.analysis) {
    const { validation, analysis } = memory
    const viability = validation.viability_score
    const viabilityWord = viability >= 75 ? 'strong' : viability >= 55 ? 'promising' : 'early-stage'
    const summary = cleanForSpeech(analysis.summary ?? '')
    const topOpportunity = cleanForSpeech(validation.opportunities?.[0] ?? '')

    return addNaturalPacing([
      `The validation is looking ${viabilityWord}.`,
      summary ? summary.slice(0, 120) + '.' : '',
      topOpportunity ? `The clearest opportunity is ${topOpportunity.toLowerCase()}.` : '',
      `I'm still working through the full analysis — the complete picture will be ready shortly.`,
    ].filter(Boolean).join(' ').trim())
  }

  // ── Case 3: Analysis started, no validation yet ────────────────────────────
  if (memory.analysis) {
    const summary = cleanForSpeech(memory.analysis.summary ?? '')
    const category = memory.analysis.category ?? 'this space'
    return addNaturalPacing([
      `I'm analyzing your idea in the ${category} space.`,
      summary ? summary.slice(0, 100) + '.' : '',
      `The validation report and full breakdown are coming up next.`,
    ].filter(Boolean).join(' ').trim())
  }

  // ── Case 4: Pipeline just started ─────────────────────────────────────────
  return `I'm working through your startup idea now.  The intelligence pipeline is running — I'll have a full advisor response ready in just a moment.`
}

/**
 * generateContextualVoiceResponse()
 *
 * For replay/manual trigger — generates a slightly different response
 * to avoid sounding repetitive if the user plays it again.
 */
export function generateContextualVoiceResponse(ctx: VoiceContext, isReplay = false): string {
  const base = generateVoiceResponse(ctx)

  if (!isReplay) return base

  // For replay, add a brief re-intro
  const { memory } = ctx.state
  const name = memory.final?.startup_name_suggestion
  if (name) {
    return `Here's the summary again for ${name}. ${base}`
  }
  return `Here's the summary again. ${base}`
}

/**
 * Estimate speaking duration in seconds for a given text.
 * Average speaking rate: ~140 words per minute for conversational speech.
 */
export function estimateSpeakingDuration(text: string): number {
  const wordCount = text.trim().split(/\s+/).length
  return Math.ceil((wordCount / 140) * 60)
}
