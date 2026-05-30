import React from 'react'
import Sidebar from '../components/Sidebar'
import ChatPanel from '../components/ChatPanel'
import OutputPanel from '../components/OutputPanel'
import VoiceOrb from '../components/VoiceOrb'

export default function Workspace(){
  return (
    <div className="workspace-root">
      <Sidebar />
      <main className="center-panel">
        <ChatPanel />
        <VoiceOrb />
      </main>
      <OutputPanel />
    </div>
  )
}
