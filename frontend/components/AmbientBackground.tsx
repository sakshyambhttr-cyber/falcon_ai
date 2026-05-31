'use client'

import React from 'react'

export default function AmbientBackground() {
  return (
    <div className="ff-ambient-bg" aria-hidden>
      <div className="ff-ambient-bg-grid" />
      <div className="ff-ambient-bg-glow ff-ambient-bg-glow-a" />
      <div className="ff-ambient-bg-glow ff-ambient-bg-glow-b" />
      <div className="ff-ambient-bg-scanline" />
    </div>
  )
}
