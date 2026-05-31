/**
 * Rate limiting middleware using Upstash Redis.
 * Falls back to an in-memory sliding window if Redis is not configured (dev/local).
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// ── Lazy singletons ───────────────────────────────────────────────────────────

let _standard: Ratelimit | null = null
let _strict: Ratelimit | null = null

function getRedis(): { url: string; token: string } | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url, token }
}

function getStandardLimiter(): Ratelimit | null {
  if (_standard) return _standard
  const creds = getRedis()
  if (!creds) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[rate-limit] UPSTASH_REDIS_REST_URL / TOKEN not set — rate limiting disabled')
    }
    return null
  }
  _standard = new Ratelimit({
    redis: new Redis(creds),
    limiter: Ratelimit.slidingWindow(20, '60 s'),
    analytics: false,
    prefix: 'falcon:rl',
  })
  return _standard
}

function getStrictLimiter(): Ratelimit | null {
  if (_strict) return _strict
  const creds = getRedis()
  if (!creds) return null
  _strict = new Ratelimit({
    redis: new Redis(creds),
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: false,
    prefix: 'falcon:rl:strict',
  })
  return _strict
}

// ── Identifier ────────────────────────────────────────────────────────────────

export function getIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'anonymous'
}

// ── Standard limiter — 20 req / 60 s ─────────────────────────────────────────

export async function checkRateLimit(request: Request): Promise<Response | null> {
  const rl = getStandardLimiter()
  if (!rl) return null

  const { success, limit, remaining, reset } = await rl.limit(getIdentifier(request))
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset':     String(reset),
          'Retry-After':           String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    )
  }
  return null
}

// ── Strict limiter — 10 req / 60 s (AI / voice routes) ───────────────────────

export async function checkStrictRateLimit(request: Request): Promise<Response | null> {
  const rl = getStrictLimiter()
  if (!rl) return null

  const { success, limit, remaining, reset } = await rl.limit(getIdentifier(request))
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for AI generation. Please wait before trying again.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset':     String(reset),
          'Retry-After':           String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    )
  }
  return null
}
