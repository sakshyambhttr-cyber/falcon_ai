'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  initialIntelligenceState,
  reduceIntelligenceEvent,
  type IntelligenceUIState
} from '../lib/intelligence-state'
import {
  clearIntelligenceSession,
  loadIntelligenceSession,
  persistIntelligenceSession
} from '../lib/session-persistence'
import type { FalconEvent, PipelineMode } from '../types/events'
import {
  connectIntelligenceStream,
  reconnectIntelligenceStream,
  submitIdea
} from '../services/intelligence-stream.service'

const DEBOUNCE_MS = 48
const MAX_RECONNECT = 4

export function useIntelligenceStream() {
  const [state, setState] = useState<IntelligenceUIState>(initialIntelligenceState)
  const pendingRef = useRef<FalconEvent[]>([])
  const seenIndexRef = useRef<Set<number>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<(() => void) | null>(null)
  const sessionRef = useRef<string | null>(null)
  const lastIndexRef = useRef(0)
  const reconnectAttemptRef = useRef(0)

  const flushPending = useCallback(() => {
    const batch = pendingRef.current
      .splice(0)
      .filter(e => {
        if (seenIndexRef.current.has(e.index)) return false
        seenIndexRef.current.add(e.index)
        return true
      })
      .sort((a, b) => a.index - b.index)

    if (!batch.length) return

    lastIndexRef.current = Math.max(lastIndexRef.current, ...batch.map(e => e.index))

    setState(prev => {
      const next = batch.reduce((acc, ev) => reduceIntelligenceEvent(acc, ev), prev)
      if (sessionRef.current) {
        persistIntelligenceSession(sessionRef.current, next)
      }
      return next
    })
  }, [])

  const queueEvent = useCallback(
    (event: FalconEvent) => {
      if (seenIndexRef.current.has(event.index)) return
      pendingRef.current.push(event)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(flushPending, DEBOUNCE_MS)
    },
    [flushPending]
  )

  const handleEvent = useCallback(
    (event: FalconEvent) => {
      queueEvent(event)
    },
    [queueEvent]
  )

  const attachStream = useCallback(
    (sessionId: string, fromIndex: number) => {
      abortRef.current?.()

      const { abort } = connectIntelligenceStream(sessionId, {
        fromIndex,
        onEvent: handleEvent,
        onError: err => {
          flushPending()
          reconnectAttemptRef.current += 1

          if (sessionRef.current && reconnectAttemptRef.current <= MAX_RECONNECT) {
            const re = reconnectIntelligenceStream(
              sessionRef.current,
              lastIndexRef.current,
              handleEvent
            )
            abortRef.current = re.abort
            return
          }

          setState(prev => ({
            ...prev,
            status: 'error',
            error: { code: 'STREAM_INTERRUPTED', recoverable: true, message: err.message }
          }))
        },
        onClose: () => {
          flushPending()
          setState(prev => {
            const next =
              prev.status === 'streaming'
                ? { ...prev, status: 'complete' as const, pipelineStatus: 'final.summary' }
                : prev
            if (sessionRef.current) persistIntelligenceSession(sessionRef.current, next)
            return next
          })
        }
      })

      abortRef.current = abort
    },
    [handleEvent, flushPending]
  )

  const startPipeline = useCallback(
    async (idea: string, mode: PipelineMode = 'full', userId?: string) => {
      abortRef.current?.()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      pendingRef.current = []
      seenIndexRef.current = new Set()
      reconnectAttemptRef.current = 0
      lastIndexRef.current = 0

      setState({
        ...initialIntelligenceState,
        status: 'connecting',
        memory: { idea, prd: {}, roadmap: [] },
        pipelineStatus: 'submitting'
      })

      const { sessionId, streamUrl } = await submitIdea({ idea, mode, userId })
      sessionRef.current = sessionId

      setState(prev => ({
        ...prev,
        sessionId,
        status: 'streaming',
        pipelineStatus: 'idea.analysis',
        memory: { ...prev.memory, idea }
      }))

      persistIntelligenceSession(sessionId, {
        lastEventIndex: 0,
        memory: { idea, prd: {}, roadmap: [] },
        status: 'streaming'
      })

      attachStream(sessionId, 0)
      return { sessionId, streamUrl }
    },
    [attachStream]
  )

  const resumeSession = useCallback(
    (sessionId: string, fromIndex: number, memory: IntelligenceUIState['memory']) => {
      sessionRef.current = sessionId
      const seen = new Set<number>()
      for (let i = 1; i <= fromIndex; i += 1) seen.add(i)
      seenIndexRef.current = seen
      reconnectAttemptRef.current = 0
      lastIndexRef.current = fromIndex

      setState(prev => ({
        ...prev,
        sessionId,
        status: 'streaming',
        memory,
        lastEventIndex: fromIndex,
        pipelineStatus: 'resuming'
      }))

      attachStream(sessionId, fromIndex)
    },
    [attachStream]
  )

  const reset = useCallback(() => {
    abortRef.current?.()
    sessionRef.current = null
    pendingRef.current = []
    seenIndexRef.current = new Set()
    clearIntelligenceSession()
    setState(initialIntelligenceState)
  }, [])

  useEffect(() => {
    const saved = loadIntelligenceSession()
    if (!saved || saved.status === 'complete') return
    if (saved.sessionId && saved.lastEventIndex >= 0) {
      resumeSession(saved.sessionId, saved.lastEventIndex, saved.memory)
    }
  }, [resumeSession])

  useEffect(() => {
    return () => {
      abortRef.current?.()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return { state, startPipeline, reset, resumeSession }
}
