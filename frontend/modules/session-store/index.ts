import type { FalconEvent, PipelineMode, SessionMemory } from '../../types/events'

export type SessionStatus = 'pending' | 'running' | 'complete' | 'error'

export type IntelligenceSession = {
  id: string
  userId: string
  idea: string
  mode: PipelineMode
  status: SessionStatus
  memory: SessionMemory
  events: FalconEvent[]
  createdAt: number
  updatedAt: number
}

type SessionListener = (event: FalconEvent) => void

class SessionStore {
  private sessions = new Map<string, IntelligenceSession>()
  private listeners = new Map<string, Set<SessionListener>>()

  create(input: {
    userId: string
    idea: string
    mode: PipelineMode
  }): IntelligenceSession {
    const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const session: IntelligenceSession = {
      id,
      userId: input.userId,
      idea: input.idea,
      mode: input.mode,
      status: 'pending',
      memory: { idea: input.idea, prd: {}, roadmap: [] },
      events: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    this.sessions.set(id, session)
    this.listeners.set(id, new Set())
    return session
  }

  get(sessionId: string): IntelligenceSession | undefined {
    return this.sessions.get(sessionId)
  }

  updateMemory(sessionId: string, patch: Partial<SessionMemory>) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.memory = { ...session.memory, ...patch }
    session.updatedAt = Date.now()
  }

  appendEvent(sessionId: string, event: FalconEvent) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.events.push(event)
    session.updatedAt = Date.now()
    this.listeners.get(sessionId)?.forEach(fn => fn(event))
  }

  setStatus(sessionId: string, status: SessionStatus) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.status = status
    session.updatedAt = Date.now()
  }

  getEventsFromIndex(sessionId: string, fromIndex: number): FalconEvent[] {
    const session = this.sessions.get(sessionId)
    if (!session) return []
    return session.events.filter(e => e.index > fromIndex)
  }

  subscribe(sessionId: string, listener: SessionListener): () => void {
    const set = this.listeners.get(sessionId) || new Set()
    set.add(listener)
    this.listeners.set(sessionId, set)
    return () => set.delete(listener)
  }

  getLastIndex(sessionId: string): number {
    const session = this.sessions.get(sessionId)
    if (!session?.events.length) return 0
    return session.events[session.events.length - 1].index
  }
}

const globalStore = globalThis as typeof globalThis & { __ffSessionStore?: SessionStore }

export function getSessionStore(): SessionStore {
  if (!globalStore.__ffSessionStore) {
    globalStore.__ffSessionStore = new SessionStore()
  }
  return globalStore.__ffSessionStore
}

export default getSessionStore
