/**
 * FOUNDER FALCON — WORKSPACE INTENT PARSER
 *
 * Phase 10 — Workspace Integration
 *
 * Detects when the user's question contains a workspace mutation intent
 * and returns a structured action to apply to the intelligence state.
 *
 * Supported intents:
 *   - reduce_mvp_scope    → trim MVP features / roadmap phase 1 tasks
 *   - update_startup_name → change the startup name suggestion
 *   - update_roadmap      → add/remove a roadmap phase or task
 *   - update_summary      → refresh the executive briefing text
 *   - focus_market        → update market focus / target audience
 *   - update_risks        → add a risk to the validation report
 *   - update_opportunities → add an opportunity
 *
 * Returns null if no workspace mutation is detected.
 */

import type { IntelligenceUIState } from './intelligence-state'

export type WorkspaceIntent =
  | { type: 'reduce_mvp_scope' }
  | { type: 'update_startup_name'; name: string }
  | { type: 'update_roadmap'; action: 'simplify' | 'extend' }
  | { type: 'update_summary'; text: string }
  | { type: 'focus_market'; segment: string }
  | { type: 'add_risk'; risk: string }
  | { type: 'add_opportunity'; opportunity: string }

export type WorkspaceMutation = {
  intent: WorkspaceIntent
  /** Human-readable description of what changed */
  description: string
  /** Which nav section to switch to after applying */
  focusSection?: string
}

// ─── INTENT DETECTION ─────────────────────────────────────────────────────────

const REDUCE_MVP_PATTERNS = [
  /reduce\s+(mvp|scope)/i,
  /simplif(y|ied)\s+(mvp|scope|features?)/i,
  /cut\s+(mvp|features?|scope)/i,
  /trim\s+(mvp|features?|scope)/i,
  /smaller\s+mvp/i,
  /fewer\s+features?/i,
  /remove\s+features?/i,
  /strip\s+(down|back)/i
]

const ROADMAP_SIMPLIFY_PATTERNS = [
  /simplif(y|ied)\s+roadmap/i,
  /shorten\s+roadmap/i,
  /reduce\s+roadmap/i,
  /fewer\s+phases?/i,
  /compress\s+roadmap/i
]

const ROADMAP_EXTEND_PATTERNS = [
  /extend\s+roadmap/i,
  /add\s+(a\s+)?phase/i,
  /more\s+phases?/i,
  /longer\s+roadmap/i
]

const NAME_PATTERNS = [
  /(?:rename|call it|name it|change.*name.*to|startup.*name.*should be)\s+["']?([A-Za-z0-9][A-Za-z0-9\s\-\.]{1,40})["']?/i,
  /(?:the name|our name|company name)\s+(?:should be|is|will be)\s+["']?([A-Za-z0-9][A-Za-z0-9\s\-\.]{1,40})["']?/i
]

const RISK_PATTERNS = [
  /(?:add|include|note|flag)\s+(?:a\s+)?risk[:\s]+(.{10,120})/i,
  /(?:the\s+)?(?:main|biggest|key)\s+risk\s+is\s+(.{10,120})/i
]

const OPPORTUNITY_PATTERNS = [
  /(?:add|include|note)\s+(?:an?\s+)?opportunit[yi][:\s]+(.{10,120})/i,
  /(?:the\s+)?(?:main|biggest|key)\s+opportunit[yi]\s+is\s+(.{10,120})/i
]

const MARKET_PATTERNS = [
  /(?:focus|target)\s+(?:on\s+)?(?:the\s+)?([A-Za-z][A-Za-z0-9\s\-]{3,60})\s+(?:market|segment|audience|customers?)/i,
  /(?:our\s+)?(?:target\s+)?(?:market|audience|customers?)\s+(?:should be|is|are)\s+([A-Za-z][A-Za-z0-9\s\-]{3,60})/i
]

export function detectWorkspaceIntent(question: string): WorkspaceMutation | null {
  const q = question.trim()

  // Reduce MVP scope
  if (REDUCE_MVP_PATTERNS.some(p => p.test(q))) {
    return {
      intent: { type: 'reduce_mvp_scope' },
      description: 'MVP scope reduced — focusing on core features only.',
      focusSection: 'mvp-strategy'
    }
  }

  // Simplify roadmap
  if (ROADMAP_SIMPLIFY_PATTERNS.some(p => p.test(q))) {
    return {
      intent: { type: 'update_roadmap', action: 'simplify' },
      description: 'Roadmap simplified to 2 phases.',
      focusSection: 'roadmap'
    }
  }

  // Extend roadmap
  if (ROADMAP_EXTEND_PATTERNS.some(p => p.test(q))) {
    return {
      intent: { type: 'update_roadmap', action: 'extend' },
      description: 'Roadmap extended with an additional phase.',
      focusSection: 'roadmap'
    }
  }

  // Rename startup
  for (const pattern of NAME_PATTERNS) {
    const match = q.match(pattern)
    if (match?.[1]) {
      const name = match[1].trim().replace(/[^A-Za-z0-9\s\-\.]/g, '').slice(0, 40)
      if (name.length >= 2) {
        return {
          intent: { type: 'update_startup_name', name },
          description: `Startup renamed to "${name}".`,
          focusSection: 'executive-briefing'
        }
      }
    }
  }

  // Add risk
  for (const pattern of RISK_PATTERNS) {
    const match = q.match(pattern)
    if (match?.[1]) {
      return {
        intent: { type: 'add_risk', risk: match[1].trim() },
        description: 'New risk added to validation report.',
        focusSection: 'validation'
      }
    }
  }

  // Add opportunity
  for (const pattern of OPPORTUNITY_PATTERNS) {
    const match = q.match(pattern)
    if (match?.[1]) {
      return {
        intent: { type: 'add_opportunity', opportunity: match[1].trim() },
        description: 'New opportunity added to validation report.',
        focusSection: 'validation'
      }
    }
  }

  // Market focus
  for (const pattern of MARKET_PATTERNS) {
    const match = q.match(pattern)
    if (match?.[1]) {
      return {
        intent: { type: 'focus_market', segment: match[1].trim() },
        description: `Market focus updated to "${match[1].trim()}".`,
        focusSection: 'validation'
      }
    }
  }

  return null
}

// ─── MUTATION APPLIER ─────────────────────────────────────────────────────────

/**
 * Apply a workspace mutation to the current intelligence state.
 * Returns a new state object (immutable update).
 */
export function applyWorkspaceMutation(
  state: IntelligenceUIState,
  mutation: WorkspaceMutation
): IntelligenceUIState {
  const { intent } = mutation
  const memory = { ...state.memory }

  switch (intent.type) {
    case 'reduce_mvp_scope': {
      // Trim roadmap phase 1 tasks to top 3, trim PRD features
      const roadmap = memory.roadmap.map(step =>
        step.phase === 1
          ? { ...step, tasks: step.tasks.slice(0, 3) }
          : step
      )
      const prd = { ...memory.prd }
      if (prd.features) {
        // Keep only first 3 bullet points
        const lines = prd.features.split('\n')
        const bullets = lines.filter(l => l.trim().startsWith('•'))
        const rest = lines.filter(l => !l.trim().startsWith('•'))
        prd.features = [...rest, ...bullets.slice(0, 3)].join('\n')
      }
      // Update MVP strategy note
      if (memory.final) {
        const features = memory.final.mvp_minimum_features ?? []
        memory.final = {
          ...memory.final,
          mvp_minimum_features: features.slice(0, 3),
          mvp_launch_strategy: memory.final.mvp_launch_strategy
            ? `[Scope reduced] ${memory.final.mvp_launch_strategy}`
            : 'Focused MVP — core feature only.'
        }
      }
      memory.roadmap = roadmap
      memory.prd = prd
      break
    }

    case 'update_startup_name': {
      if (memory.final) {
        memory.final = {
          ...memory.final,
          startup_name_suggestion: intent.name
        }
      }
      break
    }

    case 'update_roadmap': {
      if (intent.action === 'simplify') {
        // Keep only phases 1 and 2
        memory.roadmap = memory.roadmap.slice(0, 2)
      } else {
        // Extend: add a phase 5 if not present
        const hasPhase5 = memory.roadmap.some(r => r.phase === 5)
        if (!hasPhase5) {
          memory.roadmap = [
            ...memory.roadmap,
            {
              phase: 5,
              title: 'Scale & Expansion',
              tasks: [
                'Expand to new markets',
                'Build partnership channels',
                'Launch enterprise tier'
              ]
            }
          ]
        }
      }
      break
    }

    case 'add_risk': {
      if (memory.validation) {
        const existing = memory.validation.risks ?? []
        if (!existing.includes(intent.risk)) {
          memory.validation = {
            ...memory.validation,
            risks: [intent.risk, ...existing]
          }
        }
      }
      break
    }

    case 'add_opportunity': {
      if (memory.validation) {
        const existing = memory.validation.opportunities ?? []
        if (!existing.includes(intent.opportunity)) {
          memory.validation = {
            ...memory.validation,
            opportunities: [intent.opportunity, ...existing]
          }
        }
      }
      break
    }

    case 'focus_market': {
      if (memory.market) {
        // Store the segment in market_size label (display only — no type extension needed)
        memory.market = {
          ...memory.market,
          market_size: `${memory.market.market_size} · Target: ${intent.segment}`
        }
      }
      if (memory.analysis) {
        memory.analysis = {
          ...memory.analysis,
          category: intent.segment
        }
      }
      break
    }

    case 'update_summary': {
      if (memory.final) {
        memory.final = {
          ...memory.final,
          executive_briefing: intent.text
        }
      }
      break
    }
  }

  return { ...state, memory }
}
