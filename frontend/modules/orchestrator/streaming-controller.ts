import type { FalconEvent, FalconEventType } from '../../types/events'

export class StreamingController {
  private counter = 0

  constructor(private sessionId: string, startIndex = 0) {
    this.counter = startIndex
  }

  nextIndex(): number {
    this.counter += 1
    return this.counter
  }

  createEvent<T extends FalconEventType>(
    type: T,
    data: FalconEvent<T>['data']
  ): FalconEvent<T> {
    return {
      type,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      index: this.nextIndex(),
      data
    } as FalconEvent<T>
  }

  formatSSE(event: FalconEvent): string {
    return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
  }
}

export default StreamingController
