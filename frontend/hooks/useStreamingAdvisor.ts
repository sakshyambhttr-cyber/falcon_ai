'use client'

/**
 * MURF FALCON — useStreamingAdvisor
 *
 * Phase 9 — Streaming Response System
 *
 * Consumes /api/advisor/chat/stream (SSE) and exposes:
 *   - streamingText  → partial answer building up in real time
 *   - isStreaming    → true while tokens are arriving
 *   - ask()          → trigger a new streaming question
 *   - abort()        → cancel in-flight stream
 *
 * The hook fires onComplete(finalAnswer) when the 'done' event arrives,
 * so the caller can hand the full text to the TTS pipeline.
 */

import { useCallback, useRef, useState } from 'react'
import type { AdvisorContext } from './useProjectMemory'

export type StreamingAdvisorState = {
  streamingText: string
  isStreaming: boolean
  ask: (question: string, context: AdvisorContext) => Promise<void>
  abort: () => void
}

type Options = {
  onToken?: (token: string, accumulated: string) => void
  onComplete: (answer: string) => void
  onError?: (err: string) => void
}

export function useStreamingAdvisor(options: Options): StreamingAdvisorState {
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const accRef = useRef('')

  const abort = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
  }, [])

  const ask = useCallback(async (question: string, context: AdvisorContext) => {
    // Cancel any in-flight stream
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    accRef.current = ''
    setStreamingText('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/advisor/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context }),
        signal: controller.signal
      })

      if (!res.ok || !res.body) {
        throw new Error(`Stream API ${res.status}`)
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += dec.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('event: ')) continue  // event type line
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          try {
            const payload = JSON.parse(jsonStr)

            if ('token' in payload) {
              accRef.current += payload.token
              setStreamingText(accRef.current)
              options.onToken?.(payload.token, accRef.current)
            }

            if ('answer' in payload) {
              // 'done' event — final cleaned answer
              const final = payload.answer as string
              setStreamingText(final)
              setIsStreaming(false)
              abortRef.current = null
              options.onComplete(final)
              return
            }

            if ('error' in payload) {
              throw new Error(payload.error as string)
            }
          } catch (parseErr) {
            // malformed SSE line — skip
          }
        }
      }

      // Stream ended without a 'done' event — use accumulated text
      const final = accRef.current.trim()
      if (final) {
        setStreamingText(final)
        options.onComplete(final)
      }
      setIsStreaming(false)

    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        setIsStreaming(false)
        return
      }
      console.warn('[useStreamingAdvisor] Error:', err)
      setIsStreaming(false)
      options.onError?.((err as Error)?.message ?? 'Stream failed')
    }
  }, [options])

  return { streamingText, isStreaming, ask, abort }
}
