import type { IntelligenceUIState } from './intelligence-state'

const SESSION_KEY = 'ff_intelligence_session'

export type PersistedSession = {
  sessionId: string
  lastEventIndex: number
  idea: string
  memory: IntelligenceUIState['memory']
  status: IntelligenceUIState['status']
  savedAt: number
}

export function persistIntelligenceSession(
  sessionId: string,
  state: Pick<IntelligenceUIState, 'lastEventIndex' | 'memory' | 'status'>
) {
  if (typeof window === 'undefined') return
  const payload: PersistedSession = {
    sessionId,
    lastEventIndex: state.lastEventIndex,
    idea: state.memory.idea,
    memory: state.memory,
    status: state.status,
    savedAt: Date.now()
  }
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
  } catch {
    /* quota */
  }
}

export function loadIntelligenceSession(): PersistedSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedSession
    if (Date.now() - data.savedAt > 1000 * 60 * 60) return null
    return data
  } catch {
    return null
  }
}

export function clearIntelligenceSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_KEY)
}
