'use client'

import React, { useEffect, useState } from 'react'
import { APP_NAME } from '../lib/brand'

const STREAM_MESSAGES = [
  { role: 'user', text: 'Build an AI scholarship finder for students abroad.' },
  { role: 'ai', text: 'Analyzing market fit and competitive landscape…' },
  { role: 'status', text: 'Generating PRD…' },
  { role: 'ai', text: 'Drafting validation report with TAM estimates…' },
  { role: 'status', text: 'Mapping roadmap milestones…' }
] as const

const LIVE_CARDS = [
  { label: 'Market Analysis', meta: 'TAM $4.2B · 87% fit' },
  { label: 'Validation Report', meta: 'Score 8.4 / 10' },
  { label: 'PRD — Problem Statement', meta: 'Section 1 of 6' },
  { label: 'Roadmap Phase 1', meta: '4 milestones queued' }
] as const

const SIDEBAR_ITEMS = ['Idea', 'Market', 'PRD', 'Roadmap'] as const

const VOICE_LINES = [
  'Your TAM is $4.2B with strong growth signals…',
  'Competitive moat looks solid — 3 key differentiators…',
  'Phase 1 MVP can ship in 8 weeks with this stack…',
]

export default function InteractiveAppMockup() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [cardIndex, setCardIndex] = useState(0)
  const [sidebarIndex, setSidebarIndex] = useState(1)
  const [typing, setTyping] = useState(true)
  const [progress, setProgress] = useState(36)
  const [voiceLine, setVoiceLine] = useState(0)
  const [voiceActive, setVoiceActive] = useState(true)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMsgIndex(i => (i + 1) % STREAM_MESSAGES.length)
      setTyping(true)
    }, 3200)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCardIndex(i => (i + 1) % LIVE_CARDS.length)
      setProgress(28)
    }, 2800)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setSidebarIndex(i => (i + 1) % SIDEBAR_ITEMS.length), 4000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setTyping(t => !t), 900)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress(p => (p >= 94 ? 28 : p + 11))
    }, 700)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVoiceLine(i => (i + 1) % VOICE_LINES.length)
      setVoiceActive(v => !v)
      setTimeout(() => setVoiceActive(true), 400)
    }, 3800)
    return () => window.clearInterval(timer)
  }, [])

  const current = STREAM_MESSAGES[msgIndex]
  const userMessage = STREAM_MESSAGES[0]
  const activeCard = LIVE_CARDS[cardIndex]
  const prevCard = LIVE_CARDS[(cardIndex + LIVE_CARDS.length - 1) % LIVE_CARDS.length]

  return (
    <div className="ff-app-mockup">
      <div className="ff-app-mockup-window">
        {/* ── Title bar ── */}
        <div className="ff-app-mockup-titlebar">
          <div className="ff-app-mockup-dots" aria-hidden>
            <span className="ff-dot ff-dot-red" />
            <span className="ff-dot ff-dot-yellow" />
            <span className="ff-dot ff-dot-green" />
          </div>
          <span className="ff-app-mockup-title">{APP_NAME} — Workspace</span>
          <span className="ff-app-mockup-live">LIVE</span>
        </div>

        {/* ── 3-column desktop body ── */}
        <div className="ff-app-mockup-body">

          {/* Col 1: Nav sidebar */}
          <aside className="ff-app-mockup-sidebar">
            <div className="ff-app-mockup-sidebar-label">WORKSPACE</div>
            {SIDEBAR_ITEMS.map((item, i) => (
              <div
                key={item}
                className={`ff-app-mockup-nav-item${i === sidebarIndex ? ' active' : ''}`}
              >
                <span className="ff-app-mockup-nav-dot" />
                {item}
              </div>
            ))}
          </aside>

          {/* Col 2: Intelligence feed */}
          <div className="ff-app-mockup-main">
            <div className="ff-app-mockup-feed-header">
              <span className="ff-app-mockup-feed-title">Intelligence Feed</span>
              <span className="ff-app-mockup-spinner" />
            </div>

            <div className="ff-app-mockup-stream">
              <div className="ff-app-mockup-bubble ff-app-mockup-bubble-user">
                {userMessage.text}
              </div>
              <div
                key={msgIndex}
                className={`ff-app-mockup-bubble ff-app-mockup-bubble-${current.role}`}
              >
                {current.role === 'status' ? (
                  <span className="ff-app-mockup-status">
                    <span className="ff-app-mockup-spinner" />
                    {current.text}
                  </span>
                ) : (
                  current.text
                )}
              </div>

              {current.role === 'ai' && typing && (
                <div className="ff-app-mockup-typing" aria-hidden>
                  <span /><span /><span />
                </div>
              )}
            </div>

            <div className="ff-app-mockup-cards">
              <div className="ff-app-mockup-card ff-app-mockup-card-dim">
                <div className="ff-app-mockup-card-head">
                  <strong>{prevCard.label}</strong>
                </div>
                <small>{prevCard.meta}</small>
              </div>
              <div className="ff-app-mockup-card ff-app-mockup-card-active">
                <div className="ff-app-mockup-card-head">
                  <strong>{activeCard.label}</strong>
                  <span className="ff-app-mockup-card-badge">NEW</span>
                </div>
                <small>{activeCard.meta}</small>
                <div className="ff-app-mockup-card-bar">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Voice advisor panel */}
          <aside className="ff-app-mockup-voice">
            <div className="ff-app-mockup-voice-header">
              <span className="ff-app-mockup-voice-dot-ring" aria-hidden />
              <span className="ff-app-mockup-voice-label">AI Advisor</span>
            </div>

            <div className={`ff-app-mockup-waveform${voiceActive ? ' active' : ''}`} aria-hidden>
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>

            <p className="ff-app-mockup-voice-text" key={voiceLine}>
              {VOICE_LINES[voiceLine]}
            </p>

            <div className="ff-app-mockup-voice-controls">
              <button className="ff-app-mockup-voice-btn ff-app-mockup-voice-btn--stop" aria-hidden tabIndex={-1}>
                ■ Stop
              </button>
            </div>

            <div className="ff-app-mockup-voice-score">
              <span className="ff-app-mockup-score-ring">
                <strong>84</strong>
              </span>
              <span className="ff-app-mockup-score-label">Viability</span>
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
