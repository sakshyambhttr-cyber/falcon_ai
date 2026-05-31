'use client'

import React from 'react'
import AmbientBackground from '../AmbientBackground'

export default function WorkspacePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ff-workspace-shell">
      <AmbientBackground />
      <div className="ff-workspace-shell-content">{children}</div>
    </div>
  )
}
