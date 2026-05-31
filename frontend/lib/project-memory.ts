/**
 * MURF FALCON — PROJECT MEMORY
 *
 * Persists the full project context to localStorage so the AI advisor
 * retains memory across page refreshes and tab switches.
 *
 * Stores:
 *   - startup idea
 *   - generated documents (PRD, roadmap, validation, briefing)
 *   - conversation history (last 20 turns)
 *   - session metadata
 *
 * TTL: 24 hours (longer than the 1-hour intelligence session TTL,
 * because the user may want to continue a conversation later)
 */

const MEMORY_KEY = 'ff_project_memory'
const MEMORY_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export type ConversationTurn = {
  role: 'user' | 'advisor'
  text: string
  ts: number
}

export type ProjectMemory = {
  sessionId: string
  idea: string
  startupName?: string
  executiveBriefing?: string
  viabilityScore?: number
  opportunities?: string[]
  risks?: string[]
  mvpStrategy?: string
  mvpFeatures?: string[]
  prdOverview?: string
  roadmapSummary?: string   // condensed roadmap for context injection
  conversationHistory: ConversationTurn[]
  savedAt: number
}

// ─── SAVE ─────────────────────────────────────────────────────────────────────

export function saveProjectMemory(memory: Omit<ProjectMemory, 'savedAt'>): void {
  if (typeof window === 'undefined') return
  try {
    const payload: ProjectMemory = { ...memory, savedAt: Date.now() }
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(payload))
  } catch {
    /* storage quota — silently ignore */
  }
}

// ─── LOAD ─────────────────────────────────────────────────────────────────────

export function loadProjectMemory(): ProjectMemory | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as ProjectMemory
    if (Date.now() - data.savedAt > MEMORY_TTL_MS) {
      clearProjectMemory()
      return null
    }
    return data
  } catch {
    return null
  }
}

// ─── CLEAR ────────────────────────────────────────────────────────────────────

export function clearProjectMemory(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(MEMORY_KEY)
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Condense roadmap steps into a short text summary for context injection */
export function condenseRoadmap(
  roadmap: Array<{ phase: number; title: string; tasks: string[] }>
): string {
  return roadmap
    .slice(0, 3)
    .map(r => `Phase ${r.phase} — ${r.title}: ${r.tasks.slice(0, 2).join(', ')}`)
    .join('. ')
}

/** Keep only the last N turns to avoid bloating the context */
export function trimHistory(
  history: ConversationTurn[],
  maxTurns = 20
): ConversationTurn[] {
  return history.slice(-maxTurns)
}
