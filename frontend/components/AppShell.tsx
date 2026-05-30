'use client'

import React from 'react'
import BottomNav from './BottomNav'
import TopBar from './TopBar'
import { useUILayoutValidator } from '../hooks/useUILayoutValidator'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { shellRef, healGeneration, issues, isHealthy } = useUILayoutValidator(true)

  return (
    <div ref={shellRef} className="ff-app-shell ff-shell-patched" data-heal-gen={healGeneration}>
      <TopBar />
      <main className="ff-app-main" key={`main-${healGeneration}`}>
        {children}
      </main>
      <BottomNav />
      {!isHealthy && process.env.NODE_ENV === 'development' && issues.length > 0 && (
        <div className="ff-heal-indicator" aria-hidden>
          healed: {issues.join(', ')}
        </div>
      )}
    </div>
  )
}
