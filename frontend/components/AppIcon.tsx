'use client'

import React from 'react'
import AssetImage from './AssetImage'
import {
  CARD_ASSET_MAP,
  NAV_ASSET_MAP,
  type AssetKey,
  type NavIconName
} from '../lib/asset-registry'

type AppIconProps = {
  name: NavIconName | keyof typeof CARD_ASSET_MAP
  size?: number
  className?: string
  alt?: string
}

function resolveAssetKey(name: AppIconProps['name']): AssetKey {
  if (name in NAV_ASSET_MAP) return NAV_ASSET_MAP[name as NavIconName]
  return CARD_ASSET_MAP[name as keyof typeof CARD_ASSET_MAP]
}

export default function AppIcon({ name, size = 22, className = '', alt = '' }: AppIconProps) {
  return <AssetImage asset={resolveAssetKey(name)} size={size} className={className} alt={alt || name} />
}
