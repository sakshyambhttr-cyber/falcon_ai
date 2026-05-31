import { NextRequest } from 'next/server'
import { getSessionStore } from '../../../../modules/session-store'
import { StreamingController } from '../../../../modules/orchestrator/streaming-controller'
import type { FalconEvent } from '../../../../types/events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RouteProps = {
  params: Promise<{ sessionId: string }>
}

export async function GET(
  request: NextRequest,
  props: RouteProps
) {
  const { sessionId } = await props.params

  const store = getSessionStore()
  const session = store.get(sessionId)

  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Session not found' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const url = new URL(request.url)
  const fromIndex = Number(url.searchParams.get('fromIndex') ?? '0')

  const encoder = new TextEncoder()
  const streamCtrl = new StreamingController(sessionId, fromIndex)

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      let poll: ReturnType<typeof setInterval> | undefined
      let unsubscribe: (() => void) | undefined

      const safeClose = () => {
        if (closed) return
        closed = true

        if (poll) clearInterval(poll)
        unsubscribe?.()

        try {
          controller.close()
        } catch {}
      }

      const send = (event: FalconEvent) => {
        if (closed) return

        try {
          controller.enqueue(
            encoder.encode(streamCtrl.formatSSE(event))
          )
        } catch {
          safeClose()
        }
      }

      // backlog
      for (const event of session.events) {
        if (event.index > fromIndex) send(event)
      }

      // live updates
      unsubscribe = store.subscribe(sessionId, (event: FalconEvent) => {
        if (event.index > fromIndex) send(event)

        if (
          event.type === 'final.summary' ||
          event.type === 'error'
        ) {
          setTimeout(safeClose, 200)
        }
      })

      // safety poll
      poll = setInterval(() => {
        const current = store.get(sessionId)
        if (!current) return safeClose()

        const last = current.events[current.events.length - 1]

        if (
          current.status === 'complete' ||
          current.status === 'error'
        ) {
          if (
            last?.type === 'final.summary' ||
            last?.type === 'error'
          ) {
            setTimeout(safeClose, 200)
          }
        }
      }, 500)

      request.signal.addEventListener('abort', safeClose)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}