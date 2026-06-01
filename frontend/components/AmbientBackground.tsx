'use client'

import React from 'react'

/**
 * Subtle dot-grid background — professional SaaS aesthetic.
 * No glows, no scan lines, no neon effects.
 * Inspired by Linear / Vercel / Notion.
 */
export default function AmbientBackground() {
  return (
    <div className="ff-ambient-bg" aria-hidden>
      <div className="ff-ambient-dot-grid" />
    </div>
  )
}
