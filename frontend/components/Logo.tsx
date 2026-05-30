'use client'

import React from 'react'
import Link from 'next/link'
import AssetImage from './AssetImage'

type LogoProps = {
  size?: number
  showText?: boolean
  href?: string
  className?: string
}

export default function Logo({ size = 28, showText = true, href = '/', className = '' }: LogoProps) {
  const content = (
    <span className={`ff-logo ${className}`}>
      <AssetImage asset="logo" size={size} alt="Founder Falcon" priority />
      {showText && <span className="ff-logo-text">Founder Falcon</span>}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="ff-logo-link">
        {content}
      </Link>
    )
  }

  return content
}
