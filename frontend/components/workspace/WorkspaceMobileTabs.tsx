'use client'

import { BarChart2, BotMessageSquare, FileText, Mic } from 'lucide-react'
import React from 'react'

export type MobileWorkspacePanel = 'stream' | 'nav' | 'voice'

const TABS: Array<{ id: MobileWorkspacePanel; label: string; icon: React.ElementType }> = [
  { id: 'stream', label: 'Intelligence', icon: BotMessageSquare },
  { id: 'nav',    label: 'Documents', icon: FileText },
  { id: 'voice',  label: 'Voice', icon: Mic }
]

type Props = {
  active: MobileWorkspacePanel
  onChange: (panel: MobileWorkspacePanel) => void
}

export default function WorkspaceMobileTabs({ active, onChange }: Props) {
  return (
    <div className="ff-ws-mobile-tabs" role="tablist" aria-label="Workspace panels">
      {TABS.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`ff-ws-tab-btn${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
          id={`ws-tab-${tab.id}`}
          aria-controls={`ws-panel-${tab.id}`}
        >
          <tab.icon size={16} aria-hidden="true" />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
