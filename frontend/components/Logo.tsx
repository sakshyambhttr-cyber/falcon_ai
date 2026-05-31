'use client'

import React from 'react'
import Link from 'next/link'
import { resolveAssetSrc } from '../lib/asset-registry'
import { APP_NAME } from '../lib/brand'

type LogoProps = {
  size?: number
  showText?: boolean
  href?: string
  className?: string
  onHomeClick?: () => void
}

export default function Logo({
  size = 28,
  showText = true,
  href = '/',
  className = '',
  onHomeClick
}: LogoProps) {
  const logoSrc = resolveAssetSrc('logo', 'svg') ?? '/images/logo.svg'
  const wrapSize = Math.round(size * 1.18)

  const content = (
    <span className={`ff-logo ${className}`}>
      <span
        className="ff-logo-mark-wrap"
        style={{ width: wrapSize, height: wrapSize }}
        aria-hidden
      >
        <img
          src={logoSrc}
          alt=""
          width={size}
          height={size}
          className="ff-logo-mark"
          decoding="async"
        />
      </span>
      {showText && (
        <span className="ff-logo-text ff-brand-font">{APP_NAME}</span>
      )}
    </span>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="ff-logo-link"
        aria-label={`${APP_NAME} home`}
        onClick={() => onHomeClick?.()}
      >
        {content}
      </Link>
    )
  }

  return content
}
