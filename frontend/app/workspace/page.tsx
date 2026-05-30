import React, { Suspense } from 'react'
import '../../styles/design.css'
import ThemeProvider from '../../components/ThemeProvider'
import WorkspaceScreen from '../../components/WorkspaceScreen'

function WorkspaceFallback() {
  return (
    <main className="ff-workspace" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8aaab5' }}>Loading workspace…</p>
    </main>
  )
}

export default function WorkspacePage() {
  return (
    <ThemeProvider>
      <Suspense fallback={<WorkspaceFallback />}>
        <WorkspaceScreen />
      </Suspense>
    </ThemeProvider>
  )
}
