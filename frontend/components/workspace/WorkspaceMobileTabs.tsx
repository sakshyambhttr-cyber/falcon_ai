'use client'

import React from 'react'
import AssetImage from '../AssetImage'

export type MobileWorkspacePanel = 'stream' | 'nav' | 'voice'

type Tab = {
  id: MobileWorkspacePanel
  label: string
  asset: 'nav-ai' | 'nav-home' | 'voice'
}

const TABS: Tab[] = [
  { id: 'stream', label: 'Intelligence', asset: 'nav-ai' },
  { id: 'nav', label: 'Documents', asset: 'nav-home' },
  { id: 'voice', label: 'Voice', asset: 'voice' }
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
          className={`ff-ws-mobile-tab${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <AssetImage asset={tab.asset} size={18} alt="" />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
