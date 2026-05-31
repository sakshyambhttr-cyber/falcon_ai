/** Murf Falcon voice presets — all female en-US (Murf API voice library). */

export type VoiceStyle = 'advisor' | 'executive' | 'warm' | 'energetic'

export type MurfVoicePreset = {
  label: string
  voiceId: string
  murfStyle: string
  gender: 'Female'
  description: string
}

/** @see https://murf.ai/api/docs/voices-styles/voice-library */
export const MURF_VOICE_PRESETS: Record<VoiceStyle, MurfVoicePreset> = {
  advisor: {
    label: 'Natalie',
    voiceId: 'en-US-natalie',
    murfStyle: 'Conversational',
    gender: 'Female',
    description: 'Professional startup advisor'
  },
  executive: {
    label: 'Amara',
    voiceId: 'en-US-amara',
    murfStyle: 'Narration',
    gender: 'Female',
    description: 'Clear executive delivery'
  },
  warm: {
    label: 'Naomi',
    voiceId: 'en-US-naomi',
    murfStyle: 'Inspirational',
    gender: 'Female',
    description: 'Warm and reassuring'
  },
  energetic: {
    label: 'Julia',
    voiceId: 'en-US-julia',
    murfStyle: 'Promo',
    gender: 'Female',
    description: 'Upbeat and engaging'
  }
}

export const DEFAULT_VOICE_STYLE: VoiceStyle = 'advisor'

/** Map UI style keys → Murf voiceId (legacy keys included). */
export const MURF_VOICE_ID_MAP: Record<string, string> = {
  advisor: MURF_VOICE_PRESETS.advisor.voiceId,
  executive: MURF_VOICE_PRESETS.executive.voiceId,
  warm: MURF_VOICE_PRESETS.warm.voiceId,
  energetic: MURF_VOICE_PRESETS.energetic.voiceId,
  // Legacy aliases → female defaults
  neutral: MURF_VOICE_PRESETS.advisor.voiceId,
  deep: MURF_VOICE_PRESETS.executive.voiceId,
  calm: MURF_VOICE_PRESETS.warm.voiceId
}

export function resolveMurfVoice(styleKey: string): MurfVoicePreset {
  const key = styleKey.toLowerCase() as VoiceStyle
  return MURF_VOICE_PRESETS[key] ?? MURF_VOICE_PRESETS.advisor
}
