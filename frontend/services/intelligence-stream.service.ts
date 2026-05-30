import type { FalconEvent, PipelineMode, SubmitIdeaResponse } from '../types/events'

export type StreamListener = (event: FalconEvent) => void

export async function submitIdea(input: {
  idea: string
  userId?: string
  mode?: PipelineMode
}): Promise<SubmitIdeaResponse> {
  const res = await fetch('/api/idea/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || 'Failed to submit idea')
  }
  return res.json()
}

export function connectIntelligenceStream(
  sessionId: string,
  options: {
    fromIndex?: number
    onEvent: StreamListener
    onError?: (error: Error) => void
    onClose?: () => void
  }
): { abort: () => void } {
  const controller = new AbortController()
  const fromIndex = options.fromIndex ?? 0

  void (async () => {
    try {
      const res = await fetch(`/api/stream/${sessionId}?fromIndex=${fromIndex}`, {
        signal: controller.signal
      })

      if (!res.ok || !res.body) {
        throw new Error('Stream connection failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEventType = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const chunk of parts) {
          if (!chunk.trim()) continue
          let eventType = currentEventType
          let dataLine = ''

          for (const line of chunk.split('\n')) {
            if (line.startsWith('event:')) eventType = line.slice(6).trim()
            else if (line.startsWith('data:')) dataLine = line.slice(5).trim()
          }

      if (dataLine) {
        try {
          const parsed = JSON.parse(dataLine) as FalconEvent
          if (
            parsed &&
            typeof parsed.type === 'string' &&
            typeof parsed.index === 'number' &&
            parsed.data !== undefined
          ) {
            options.onEvent(parsed)
          }
        } catch (e) {
          console.warn('Invalid event payload', dataLine, e)
        }
      }
        }
      }

      options.onClose?.()
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      options.onError?.(err instanceof Error ? err : new Error('Stream error'))
    }
  })()

  return { abort: () => controller.abort() }
}

export function reconnectIntelligenceStream(
  sessionId: string,
  lastIndex: number,
  onEvent: StreamListener
): { abort: () => void } {
  return connectIntelligenceStream(sessionId, { fromIndex: lastIndex, onEvent })
}
