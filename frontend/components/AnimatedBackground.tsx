'use client'

import React from 'react'

export default function AnimatedBackground() {
  return (
    <div className="ff-animated-bg" aria-hidden>
      <div className="ff-animated-bg-grid" />
      <div className="ff-animated-bg-glow ff-animated-bg-glow-a" />
      <div className="ff-animated-bg-glow ff-animated-bg-glow-b" />
    </div>
  )
}
