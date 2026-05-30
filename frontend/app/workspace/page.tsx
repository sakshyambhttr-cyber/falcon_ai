import React, { Suspense } from 'react'
import WorkspaceScreen from '../../components/WorkspaceScreen'

function WorkspaceFallback() {
  return (
    <div className="ff-workspace-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8aaab5' }}>Loading workspace…</p>
    </div>
  )
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <WorkspaceScreen />
    </Suspense>
  )
}
