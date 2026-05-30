'use client'

import React, { useMemo, useRef, useState } from 'react'
import Button from './Button'
import Card from './Card'
import Panel from './Panel'
import SidebarShell from './SidebarShell'

type AIResponse = {
  validation: {
    summary: string
    score: number
    risks: string[]
    opportunities: string[]
  }
  prds: Array<{
    title: string
    description: string
    sections: Array<{ heading: string; body: string }>
  }>
  roadmap: Array<{
    phase: string
    items: string[]
  }>
}

const defaultIdea = 'I want to build an AI platform that helps students find scholarships abroad.'

function formatPrd(response: AIResponse | null): string{
  if(!response?.prds?.length){
    return '# PRD\n\nWaiting for AI output.'
  }

  const prd = response.prds[0]
  return [
    `# ${prd.title}`,
    '',
    `## ${prd.description}`,
    '',
    ...prd.sections.flatMap(section => [`### ${section.heading}`, section.body, ''])
  ].join('\n')
}

function formatRoadmap(response: AIResponse | null): string{
  if(!response?.roadmap?.length){
    return '# Roadmap\n\nWaiting for AI output.'
  }

  return [
    '# Roadmap',
    '',
    ...response.roadmap.flatMap(phase => [`## ${phase.phase}`, ...phase.items.map(item => `- ${item}`), ''])
  ].join('\n')
}

export default function WorkspaceScreen(){
  const [idea, setIdea] = useState(defaultIdea)
  const [response, setResponse] = useState<AIResponse | null>(null)
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'speaking' | 'fallback'>('idle')
  const [transcript, setTranscript] = useState('Founder Falcon is ready. Describe your startup idea and I will generate validation, PRD, and roadmap outputs.')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const prdText = useMemo(() => formatPrd(response), [response])
  const roadmapText = useMemo(() => formatRoadmap(response), [response])
  const isLoading = status === 'analyzing'
  const isEmpty = !response && !isLoading

  async function speak(text: string){
    setStatus('speaking')
    const res = await fetch('/api/murf', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ text })
    })

    const contentType = res.headers.get('content-type') || ''
    if(contentType.includes('audio/mpeg')){
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setStatus('idle')
        URL.revokeObjectURL(url)
      }
      await audio.play().catch(() => {
        setStatus('fallback')
      })
      return
    }

    const payload = await res.json().catch(() => ({}))
    setTranscript(String(payload?.message || payload?.details || text))
    setStatus('fallback')
    window.setTimeout(() => setStatus('idle'), 1400)
  }

  async function runAnalysis(){
    setStatus('analyzing')
    setTranscript('Analyzing startup idea...')

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ idea })
    })

    const payload = await res.json()
    const normalized: AIResponse = {
      validation: payload.validation,
      prds: payload.prds,
      roadmap: payload.roadmap
    }

    setResponse(normalized)
    setTranscript(normalized.validation.summary)
    await speak([normalized.validation.summary, normalized.prds[0]?.description || '', normalized.roadmap[0]?.phase || ''].filter(Boolean).join('. '))
  }

  return (
    <main className="ff-workspace">
      <SidebarShell>
        <Card>
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <div>
              <div className="ff-workspace-title">Founder Falcon</div>
              <div className="ff-workspace-subtitle">AI operating system</div>
            </div>
            <nav style={{display:'flex',flexDirection:'column',gap:10}}>
              <Button variant="ghost">Projects</Button>
              <Button variant="ghost">Documents</Button>
              <Button variant="ghost">Settings</Button>
            </nav>
          </div>
        </Card>
      </SidebarShell>

      <section className="ff-workspace-main">
        <Card className="ff-workspace-header">
          <div>
            <h1 className="ff-workspace-title">Workspace</h1>
            <p className="ff-workspace-subtitle">Voice-first startup analysis, PRD generation, and roadmap synthesis.</p>
          </div>
          <Button variant="primary" onClick={runAnalysis}>Enter Workspace</Button>
        </Card>

        <div className="ff-workspace-grid">
          <Panel title="Chat interface" className="ff-chat-panel">
            <div className="ff-chat-feed">
              <div className="ff-chat-bubble ff-chat-bubble-ai">
                <div style={{fontSize:12,letterSpacing:'0.08em',textTransform:'uppercase',color:'#7dbfd0',marginBottom:8}}>assistant</div>
                <div className={isLoading ? 'ff-typing' : ''}>
                  {isLoading ? (
                    <>
                      <span />
                      <span />
                      <span />
                    </>
                  ) : (
                    transcript
                  )}
                </div>
              </div>
              <div className="ff-chat-bubble ff-chat-bubble-user">
                <div style={{fontSize:12,letterSpacing:'0.08em',textTransform:'uppercase',color:'#7dbfd0',marginBottom:8}}>user</div>
                <div>{idea}</div>
              </div>
            </div>

            <div className="ff-voice-orb">
              <img className={status === 'speaking' || status === 'analyzing' ? 'ff-voice-orb-active' : ''} src="/images/voice.svg" alt="Voice orb" />
            </div>

            <div className="ff-chat-composer">
              <input className="ff-chat-input" value={idea} onChange={event => setIdea(event.target.value)} placeholder="Describe your startup idea..." />
              <Button variant="primary" onClick={runAnalysis}>Send</Button>
            </div>
          </Panel>

          <Panel title="Voice waveform" className="ff-chat-panel">
            <img className={`ff-waveform ${status === 'speaking' || status === 'analyzing' ? 'ff-waveform-active' : ''}`} src="/images/waveform.svg" alt="Speaking waveform" />
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}>
              <Card>
                <div className="ff-output-meta"><span>Status</span><span>{status}</span></div>
                <div className="ff-output-body">Streaming preferred, low latency, with fallback if API fails.</div>
              </Card>
              <Card>
                <div className="ff-output-meta"><span>Mode</span><span>AI OS</span></div>
                <div className="ff-output-body">Waveform sync remains active while speech is playing.</div>
              </Card>
            </div>
          </Panel>
        </div>
      </section>

      <aside className="ff-output-stack">
        <Panel title="PRD output">
          <div className="ff-output-meta"><span>Document</span><span>Markdown</span></div>
          {isLoading ? (
            <div className="ff-loading-state">
              <div className="ff-loading-chip ff-skeleton" />
              <div className="ff-skeleton ff-skeleton-line large" />
              <div className="ff-skeleton ff-skeleton-line" />
              <div className="ff-skeleton ff-skeleton-line short" />
              <div className="ff-skeleton ff-skeleton-line" />
            </div>
          ) : isEmpty ? (
            <div className="ff-empty-state">
              <strong>No PRD generated yet.</strong>
              <span>Enter a startup idea to generate structured product documentation.</span>
            </div>
          ) : (
            <div className="ff-output-body">{prdText}</div>
          )}
        </Panel>

        <Panel title="Roadmap output">
          <div className="ff-output-meta"><span>Document</span><span>Markdown</span></div>
          {isLoading ? (
            <div className="ff-loading-state">
              <div className="ff-loading-block large ff-skeleton" />
              <div className="ff-loading-block ff-skeleton" />
              <div className="ff-loading-block ff-skeleton" />
              <div className="ff-loading-block short ff-skeleton" />
            </div>
          ) : isEmpty ? (
            <div className="ff-empty-state">
              <strong>No roadmap generated yet.</strong>
              <span>Your execution plan will appear here after analysis.</span>
            </div>
          ) : (
            <div className="ff-output-body">{roadmapText}</div>
          )}
        </Panel>
      </aside>
    </main>
  )
}
