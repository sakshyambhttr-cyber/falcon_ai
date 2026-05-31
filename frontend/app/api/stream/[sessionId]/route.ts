import { NextRequest } from 'next/server' // Ensure NextRequest is imported
import { getSessionStore } from '../../../../modules/session-store'
import { StreamingController } from '../../../../modules/orchestrator/streaming-controller'
import type { FalconEvent } from '../../../../types/events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 1. Explicitly type out the props parameter object with a Promise
type RouteProps = {
  params: Promise<{ sessionId: string }>
}

export async function GET(
  request: NextRequest, // 2. Use NextRequest as the standard first argument
  props: RouteProps     // 3. Pass the explicitly typed Promise properties object
) {
  // 4. Resolve the asynchronous params Promise using await
  const { sessionId } = await props.params 
  
  const store = getSessionStore()
  const session = store.get(sessionId)

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const url = new URL(request.url)
  const fromIndex = Number(url.searchParams.get('fromIndex') || '0')

  const encoder = new TextEncoder()
  const streamCtrl = new StreamingController(sessionId, fromIndex)

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: FalconEvent) => {
        controller.enqueue(encoder.encode(streamCtrl.formatSSE(event)))
      }

      const backlog = session.events.filter(e => e.index > fromIndex)
      for (const event of backlog) {
        send(event)
      }

      let closed = false
      let poll: ReturnType<typeof setInterval>
      let unsubscribe: () => void

      const closeStream = () => {
        if (closed) return
        closed = true
        if (poll) clearInterval(poll)
        unsubscribe?.()
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }

      unsubscribe = store.subscribe(sessionId, event => {
        if (event.index > fromIndex) send(event)
        if (event.type === 'final.summary' || event.type === 'error') {
          setTimeout(closeStream, 250)
        }
      })

      poll = setInterval(() => {
        const current = store.get(sessionId)
        if (!current) {
          closeStream()
          return
        }
        if (current.status === 'complete' || current.status === 'error') {
          const last = current.events[current.events.length - 1]
          if (last && (last.type === 'final.summary' || last.type === 'error')) {
            setTimeout(closeStream, 400)
          }
        }
      }, 400)

      request.signal.addEventListener('abort', closeStream)
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
