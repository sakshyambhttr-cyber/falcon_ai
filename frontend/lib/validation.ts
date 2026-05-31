/**
 * Zod validation schemas for all API route request bodies.
 */
import { z } from 'zod'

// ── Shared constraints ────────────────────────────────────────────────────────

const MAX_IDEA_LENGTH = 2000
const MAX_QUERY_LENGTH = 1000
const MAX_VOICE_TEXT_LENGTH = 3000
const MAX_FEATURE_ID_LENGTH = 64

// ── /api/ai ───────────────────────────────────────────────────────────────────

export const AiRouteSchema = z.object({
  idea: z
    .string({ message: 'idea is required' })
    .min(1, 'idea must not be empty')
    .max(MAX_IDEA_LENGTH, `idea must be at most ${MAX_IDEA_LENGTH} characters`),
})

export type AiRouteInput = z.infer<typeof AiRouteSchema>

// ── /api/idea/submit ──────────────────────────────────────────────────────────

export const IdeaSubmitSchema = z.object({
  idea: z
    .string({ message: 'idea is required' })
    .min(1, 'idea must not be empty')
    .max(MAX_IDEA_LENGTH, `idea must be at most ${MAX_IDEA_LENGTH} characters`),
  userId: z
    .string()
    .max(128)
    .optional()
    .default('anonymous'),
  mode: z
    .enum(['full', 'fast', 'validate_only'])
    .optional()
    .default('full'),
})

export type IdeaSubmitInput = z.infer<typeof IdeaSubmitSchema>

// ── /api/chat ─────────────────────────────────────────────────────────────────

export const ChatRouteSchema = z.object({
  idea: z
    .string({ message: 'idea is required' })
    .min(1, 'idea must not be empty')
    .max(MAX_IDEA_LENGTH, `idea must be at most ${MAX_IDEA_LENGTH} characters`),
})

export type ChatRouteInput = z.infer<typeof ChatRouteSchema>

// ── /api/research ─────────────────────────────────────────────────────────────

export const ResearchRouteSchema = z.object({
  query: z
    .string({ message: 'query is required' })
    .min(1, 'query must not be empty')
    .max(MAX_QUERY_LENGTH, `query must be at most ${MAX_QUERY_LENGTH} characters`),
})

export type ResearchRouteInput = z.infer<typeof ResearchRouteSchema>

// ── /api/murf ─────────────────────────────────────────────────────────────────

export const MurfRouteSchema = z.object({
  text: z
    .string({ message: 'text is required' })
    .min(1, 'text must not be empty')
    .max(MAX_VOICE_TEXT_LENGTH, `text must be at most ${MAX_VOICE_TEXT_LENGTH} characters`),
  voiceId: z
    .string()
    .max(64)
    .optional()
    .default('en-US-amara'),
})

export type MurfRouteInput = z.infer<typeof MurfRouteSchema>

// ── /api/voice/synthesize ─────────────────────────────────────────────────────

export const VoiceSynthesizeSchema = z.object({
  text: z
    .string({ message: 'text is required' })
    .min(1, 'text must not be empty')
    .max(MAX_VOICE_TEXT_LENGTH, `text must be at most ${MAX_VOICE_TEXT_LENGTH} characters`),
  voice: z
    .string()
    .max(64)
    .optional()
    .default('advisor'),
})

export type VoiceSynthesizeInput = z.infer<typeof VoiceSynthesizeSchema>

// ── /api/feature/insight ──────────────────────────────────────────────────────

export const FeatureInsightSchema = z.object({
  feature: z
    .string({ message: 'feature is required' })
    .min(1, 'feature must not be empty')
    .max(MAX_FEATURE_ID_LENGTH, `feature id must be at most ${MAX_FEATURE_ID_LENGTH} characters`)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'feature id contains invalid characters'),
})

export type FeatureInsightInput = z.infer<typeof FeatureInsightSchema>

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Parse and validate a request body against a Zod schema.
 * Returns { data } on success or { error, response } on failure.
 */
export function parseBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
):
  | { success: true; data: T }
  | { success: false; error: string } {
  const result = schema.safeParse(body)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const message = result.error.issues.map(e => e.message).join('; ')
  return { success: false, error: message }
}
