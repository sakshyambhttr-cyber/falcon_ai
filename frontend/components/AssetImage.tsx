'use client'

import React, { useState } from 'react'
import {
  type AssetKey,
  getAsset,
  resolveAssetSrc
} from '../lib/asset-registry'

type AssetImageProps = {
  asset: AssetKey
  size?: number
  className?: string
  alt?: string
  priority?: boolean
}

/**
 * SVG-first image loader with PNG fallback chain.
 */
export default function AssetImage({
  asset,
  size = 24,
  className = '',
  alt = '',
  priority = false
}: AssetImageProps) {
  const entry = getAsset(asset)
  const initialStage = entry.svg ? 'svg' : entry.png ? 'png' : 'text'
  const [stage, setStage] = useState<'svg' | 'png' | 'text'>(initialStage)

  const label = alt || entry.label || String(asset)
  let src: string | undefined

  if (stage === 'svg') src = resolveAssetSrc(asset, 'svg')
  else if (stage === 'png') src = resolveAssetSrc(asset, 'png')
  else {
    return (
      <span
        className={`ff-asset-text ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
        aria-label={label}
      >
        FF
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={() => {
        if (stage === 'svg' && entry.png) setStage('png')
        else if (stage === 'png' && entry.svg) setStage('svg')
        else setStage('text')
      }}
    />
  )
}
