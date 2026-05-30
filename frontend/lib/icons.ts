/** @deprecated Use lib/asset-registry — kept for backward imports */
export {
  ASSET_REGISTRY,
  CARD_ASSET_MAP,
  NAV_ASSET_MAP,
  type AssetKey,
  type NavIconName,
  getAsset,
  resolveAssetSrc
} from './asset-registry'

import { CARD_ASSET_MAP, NAV_ASSET_MAP, getAsset } from './asset-registry'
import type { NavIconName } from './asset-registry'

/** Legacy shape for components not yet migrated */
function entryPaths(key: Parameters<typeof getAsset>[0]) {
  const e = getAsset(key)
  return { svg: e.svg || e.png || '', png: e.png || e.svg || '' }
}

export const NAV_ICONS: Record<NavIconName, { png: string; svg: string }> = {
  home: entryPaths(NAV_ASSET_MAP.home),
  about: entryPaths(NAV_ASSET_MAP.about),
  demo: entryPaths(NAV_ASSET_MAP.demo),
  contact: entryPaths(NAV_ASSET_MAP.contact),
  ai: entryPaths(NAV_ASSET_MAP.ai)
}

export const CARD_ICONS = {
  prd: entryPaths('prd'),
  voice: entryPaths('voice'),
  global: entryPaths('global'),
  logo: entryPaths('logo')
}
