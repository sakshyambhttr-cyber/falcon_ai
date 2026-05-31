'use client'

import React from 'react'
import BottomNav from './BottomNav'
import TopBar from './TopBar'
import LoadingScreen from './LoadingScreen'
import { useAppBootSplash } from '../hooks/useAppBootSplash'
import { useUILayoutValidator } from '../hooks/useUILayoutValidator'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { showLoader, loaderExiting, triggerHomeSplash, appReady } = useAppBootSplash()
  const { shellRef, healGeneration, issues, isHealthy } = useUILayoutValidator(appReady)

  return (
    <>
      {showLoader && <LoadingScreen exiting={loaderExiting} />}
      <div
        ref={shellRef}
        className={`ff-app-shell ff-shell-patched${appReady ? ' ff-app-ready' : ' ff-app-loading'}`}
        data-heal-gen={healGeneration}
        suppressHydrationWarning
        aria-hidden={showLoader}
      >
        <TopBar onHomeNavigate={triggerHomeSplash} />
        <main className="ff-app-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
        <BottomNav onHomeNavigate={triggerHomeSplash} />
        {!isHealthy && process.env.NODE_ENV === 'development' && issues.length > 0 && (
          <div className="ff-heal-indicator" aria-hidden>
            healed: {issues.join(', ')}
          </div>
        )}
      </div>
    </>
  )
}
