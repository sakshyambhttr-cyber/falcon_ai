import { getFeatureInsight, isValidFeatureId } from '../../../../modules/feature-insight'
import { parseBody, FeatureInsightSchema } from '../../../../lib/validation'
import { checkRateLimit } from '../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  })
}

export async function POST(request: Request) {
  // Rate limit: standard (20 req / 60 s)
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const raw = await request.json().catch(() => ({}))
    const parsed = parseBody(FeatureInsightSchema, raw)
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error }, 400)
    }

    const { feature } = parsed.data

    if (!isValidFeatureId(feature)) {
      return jsonResponse({ error: 'Invalid feature id' }, 400)
    }

    const result = await getFeatureInsight(feature)
    return jsonResponse(result)
  } catch (error) {
    console.error('[/api/feature/insight] Error:', error instanceof Error ? error.message : error)
    return jsonResponse({ error: 'Unable to load insight' }, 500)
  }
}
