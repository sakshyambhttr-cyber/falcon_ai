/**
 * Founder Falcon asset registry — SVG first, PNG fallback.
 * Scan paths: /public/assets/, /public/images/
 */

export type AssetEntry = {
  svg?: string
  png?: string
  label?: string
}

export const ASSET_REGISTRY = {
  logo: {
    svg: '/assets/logo.svg',
    png: '/images/logo.png',
    label: 'Founder Falcon'
  },
  favicon: {
    svg: '/images/favicon.svg',
    png: '/images/favicon.png'
  },

  'nav-home': { svg: '/assets/icons/home.svg', png: '/assets/icons/home.png' },
  'nav-about': { svg: '/assets/icons/about.svg', png: '/assets/icons/about.png' },
  'nav-demo': { svg: '/assets/icons/demo.svg', png: '/assets/icons/demo.png' },
  'nav-contact': { svg: '/assets/icons/contact.svg', png: '/assets/icons/contact.png' },
  'nav-ai': { svg: '/assets/icons/AI.svg', png: '/assets/icons/ai.png' },

  prd: { svg: '/images/prd.svg' },
  voice: { svg: '/images/voice.svg' },
  global: { svg: '/images/global.svg' },
  waveform: { svg: '/images/waveform.svg' },

  'ws-idea': { svg: '/assets/icons/home.svg', png: '/assets/icons/home.png' },
  'ws-market': { svg: '/images/global.svg' },
  'ws-validation': { svg: '/images/prd.svg' },
  'ws-prd': { svg: '/images/prd.svg' },
  'ws-roadmap': { svg: '/images/demo-mock.svg' },
  'ws-export': { svg: '/images/global.svg' },

  'hero-mock': { png: '/images/demo-mock.jpeg' }
} as const satisfies Record<string, AssetEntry>

export type AssetKey = keyof typeof ASSET_REGISTRY

export function getAsset(key: AssetKey): AssetEntry {
  return ASSET_REGISTRY[key]
}

export function resolveAssetSrc(
  key: AssetKey,
  stage: 'svg' | 'png'
): string | undefined {
  const entry = getAsset(key)
  if (stage === 'svg') return entry.svg || entry.png
  return entry.png || entry.svg
}

/** Legacy nav icon name → registry key */
export const NAV_ASSET_MAP = {
  home: 'nav-home',
  about: 'nav-about',
  demo: 'nav-demo',
  contact: 'nav-contact',
  ai: 'nav-ai'
} as const

export type NavIconName = keyof typeof NAV_ASSET_MAP

export const CARD_ASSET_MAP = {
  prd: 'prd',
  voice: 'voice',
  global: 'global',
  logo: 'logo'
} as const
