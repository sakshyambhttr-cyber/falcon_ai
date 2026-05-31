'use client'

import React from 'react'
import Card from './Card'
import AssetImage from './AssetImage'
import AmbientBackground from './AmbientBackground'
import type { AssetKey } from '../lib/asset-registry'

const CAPABILITIES: { title: string; body: string; icon: AssetKey }[] = [
  {
    title: 'Idea Generation',
    body: 'Structure natural-language concepts into actionable scopes.',
    icon: 'logo'
  },
  {
    title: 'Validation Reports',
    body: 'Viability scores, summaries, and market signals.',
    icon: 'global'
  },
  {
    title: 'PRD Generator',
    body: 'Features, user stories, and success criteria.',
    icon: 'prd'
  },
  {
    title: 'Roadmap Builder',
    body: 'Phase-based plans from MVP to launch.',
    icon: 'ws-roadmap'
  },
  {
    title: 'AI Assistant',
    body: 'Intelligent co-founder guidance across every stage.',
    icon: 'ai'
  },
  {
    title: 'Voice Integration',
    body: 'Murf-powered summaries with live waveform playback.',
    icon: 'waveform'
  }
]

export default function AboutContent() {
  return (
    <div className="ff-page ff-page-flow ff-page-about">
      <AmbientBackground />
      <div className="ff-page-flow-inner">
        <header className="ff-page-header">
          <span className="ff-icon-box">
            <AssetImage asset="nav-about" size={24} alt="" />
          </span>
          <div>
            <h1>About Murf Falcon</h1>
            <p>The AI Startup Operating System for builders who move at founder speed.</p>
          </div>
        </header>

        <Card className="ff-page-intro-card">
          <h2>What is Murf Falcon?</h2>
          <p>
            Murf Falcon is a voice-first AI co-founder that transforms a single startup idea into a
            complete operating package — validation, PRD, technical specs, roadmap, and pitch
            materials — streamed live inside a premium workspace.
          </p>
        </Card>

        <section className="ff-page-section">
          <h3 className="ff-section-title">What it does</h3>
          <div className="ff-about-cap-grid">
            {CAPABILITIES.map(cap => (
              <Card key={cap.title} className="ff-about-cap-card">
                <span className="ff-icon-box ff-about-cap-icon">
                  <AssetImage asset={cap.icon} size={24} alt="" />
                </span>
                <h4>{cap.title}</h4>
                <p>{cap.body}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
