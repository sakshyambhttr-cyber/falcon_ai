import type { AIEngineResponse } from '../types/core'

export { analyzeIdea, generateAIEngineResponse, sanitizeStartupIdea } from '../modules/ai-engine'

export type StreamStage =
  | 'thinking'
  | 'validation'
  | 'prd'
  | 'roadmap'
  | 'ready'
  | 'error'

export type StreamStagePayload = {
  stage: StreamStage
  message?: string
  data?: unknown
}

/**
 * Non-streaming analysis — used for direct API consumers and tests.
 */
export async function analyzeStartupIdea(idea: string): Promise<AIEngineResponse> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error || 'AI analysis failed')
  }

  return response.json() as Promise<AIEngineResponse>
}

/**
 * Consumes the SSE stream from /api/chat and invokes onUpdate per stage.
 */
export async function streamChatAnalysis(
  idea: string,
  onUpdate: (event: string, data: StreamStagePayload | { message: string }) => void
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea })
  })

  if (!response.ok || !response.body) {
    throw new Error('Failed to initiate AI analysis stream')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''

    for (const chunk of parts) {
      if (!chunk.trim()) continue

      let currentEvent = 'message'
      let currentData = ''

      for (const line of chunk.split('\n')) {
        if (line.startsWith('event:')) currentEvent = line.slice(6).trim()
        else if (line.startsWith('data:')) currentData = line.slice(5).trim()
      }

      if (currentData) {
        try {
          onUpdate(currentEvent, JSON.parse(currentData))
        } catch (e) {
          console.warn('Failed to parse SSE chunk:', currentData, e)
        }
      }
    }
  }
}
