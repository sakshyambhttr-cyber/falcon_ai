'use client'

import React from 'react'
import Card from './Card'
import LayoutGrid from './LayoutGrid'
import AssetImage from './AssetImage'
import AnimatedBackground from './AnimatedBackground'
import type { AssetKey } from '../lib/asset-registry'

const CAPABILITIES: { title: string; body: string; icon: AssetKey }[] = [
  {
    title: 'Idea Generation',
    body: 'Capture natural-language startup concepts and instantly structure them into actionable scopes.',
    icon: 'logo'
  },
  {
    title: 'Validation Reports',
    body: 'Receive viability scores, executive summaries, and risk-aware market signals.',
    icon: 'global'
  },
  {
    title: 'PRD Generator',
    body: 'Auto-build product requirements with features, user stories, and success criteria.',
    icon: 'prd'
  },
  {
    title: 'Roadmap Builder',
    body: 'Phase-based execution plans with checklisted milestones across MVP → launch.',
    icon: 'ws-roadmap'
  },
  {
    title: 'AI Assistant',
    body: 'Murf-powered voice summaries with browser TTS fallback — listen to your operating package.',
    icon: 'voice'
  }
]

export default function AboutContent() {
  return (
    <div className="ff-page ff-page-about">
      <AnimatedBackground />
      <div className="ff-page-inner">
        <header className="ff-page-header">
          <AssetImage asset="nav-about" size={32} alt="Founder Falcon" />
          <div>
            <h1>About Founder Falcon</h1>
            <p>The AI Startup Operating System for builders who move at founder speed.</p>
          </div>
        </header>

        <Card className="ff-about-hero">
          <h2>What is Founder Falcon?</h2>
          <p>
            Founder Falcon is a voice-first AI co-founder that transforms a single startup idea into a
            complete operating package — validation, PRD, technical specs, roadmap, and pitch materials —
            streamed live inside a premium dark workspace.
          </p>
        </Card>

        <section>
          <h3 className="ff-section-title">What it does</h3>
          <LayoutGrid columns={2} gap={18}>
            {CAPABILITIES.map(cap => (
              <Card key={cap.title} className="ff-about-cap-card">
                <AssetImage asset={cap.icon} size={28} alt="" />
                <h4>{cap.title}</h4>
                <p>{cap.body}</p>
              </Card>
            ))}
          </LayoutGrid>
        </section>

        <Card className="ff-about-voice-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <AssetImage asset="voice" size={32} alt="Voice" />
            <div>
              <h4>Murf Voice Integration</h4>
              <p style={{ margin: 0, color: '#8aaab5', fontSize: 14, lineHeight: 1.55 }}>
                Hear your validation summary spoken aloud. Toggle voice styles, play AI summaries, and
                watch the live waveform react in the workspace.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
