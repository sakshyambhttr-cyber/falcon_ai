import React, { Suspense } from 'react'
import WorkspaceScreen from '../../components/WorkspaceScreen'

function WorkspaceFallback() {
  return (
    <div className="ff-workspace-page ff-workspace-loading">
      <p>Loading workspace…</p>
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
