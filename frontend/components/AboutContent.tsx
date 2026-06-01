'use client'

import React from 'react'
import Link from 'next/link'
import AmbientBackground from './AmbientBackground'

const CAPABILITIES = [
  {
    title: 'Idea Validation',
    body: 'Submit any startup idea and get a structured viability score, market analysis, and risk assessment in seconds.',
    tag: 'Analysis'
  },
  {
    title: 'PRD Generation',
    body: 'Automatically generate production-grade product requirement documents with user stories, features, and success metrics.',
    tag: 'Documents'
  },
  {
    title: 'Startup Roadmap',
    body: 'Phase-based execution plans from discovery through MVP to launch — with actionable tasks at every step.',
    tag: 'Planning'
  },
  {
    title: 'AI Co-founder',
    body: 'Ask follow-up questions, explore risks, refine your strategy. Falcon remembers your project across the session.',
    tag: 'Conversation'
  },
  {
    title: 'Voice Briefings',
    body: 'Hear your startup analysis spoken by an AI advisor. Natural, conversational, and built for founders on the move.',
    tag: 'Voice'
  },
  {
    title: 'MVP Strategy',
    body: 'Get a focused minimum viable product plan — what to build first, who to target, and how to get your first users.',
    tag: 'Strategy'
  }
]

const STACK = [
  { label: 'AI Engine', value: 'Google Gemini 1.5 Flash' },
  { label: 'Voice Synthesis', value: 'Murf AI' },
  { label: 'Framework', value: 'Next.js 15 + React 18' },
  { label: 'Auth', value: 'Firebase Authentication' },
  { label: 'Streaming', value: 'Server-Sent Events' },
  { label: 'Deployment', value: 'Vercel Edge Network' },
]

export default function AboutContent() {
  return (
    <div className="ff-about-page">
      <AmbientBackground />

      {/* ── Hero ── */}
      <section className="ff-about-hero">
        <div className="ff-about-hero-inner">
          <span className="ff-eyebrow">About Founder Falcon</span>
          <h1 className="ff-about-title">
            The AI operating system<br />for early-stage founders
          </h1>
          <p className="ff-about-lead">
            Founder Falcon turns a raw startup idea into a complete operating package —
            validation report, PRD, roadmap, and an AI advisor that understands your project.
            Built for founders who move fast and need real outputs, not generic advice.
          </p>
          <div className="ff-about-cta-row">
            <Link href="/workspace" className="ff-btn ff-btn-primary ff-btn-md">
              Open Workspace
            </Link>
            <Link href="/demo" className="ff-btn ff-btn-outline ff-btn-md">
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section className="ff-about-section">
        <div className="ff-about-section-header">
          <h2>What Founder Falcon does</h2>
          <p>Six core capabilities, one unified workspace.</p>
        </div>
        <div className="ff-about-cap-grid">
          {CAPABILITIES.map(cap => (
            <div key={cap.title} className="ff-about-cap-card">
              <span className="ff-about-cap-tag">{cap.tag}</span>
              <h3>{cap.title}</h3>
              <p>{cap.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="ff-about-section">
        <div className="ff-about-section-header">
          <h2>How it works</h2>
          <p>From idea to execution in four steps.</p>
        </div>
        <div className="ff-about-steps">
          {[
            { n: '01', title: 'Submit your idea', body: 'Type or speak your startup concept. Falcon accepts natural language — no templates, no forms.' },
            { n: '02', title: 'Intelligence pipeline runs', body: 'Gemini analyzes your idea across market, validation, PRD, and roadmap dimensions simultaneously.' },
            { n: '03', title: 'Review your workspace', body: 'All outputs stream live into a structured workspace — executive briefing, validation report, PRD, and roadmap.' },
            { n: '04', title: 'Continue the conversation', body: 'Ask follow-up questions, refine your strategy, and get voice briefings from your AI co-founder.' },
          ].map(step => (
            <div key={step.n} className="ff-about-step">
              <span className="ff-about-step-num">{step.n}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech stack ── */}
      <section className="ff-about-section">
        <div className="ff-about-section-header">
          <h2>Built with</h2>
          <p>Production-grade infrastructure from day one.</p>
        </div>
        <div className="ff-about-stack">
          {STACK.map(item => (
            <div key={item.label} className="ff-about-stack-item">
              <span className="ff-about-stack-label">{item.label}</span>
              <span className="ff-about-stack-value">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="ff-about-footer-cta">
        <h2>Ready to build?</h2>
        <p>Submit your startup idea and get a full analysis in under 60 seconds.</p>
        <Link href="/workspace" className="ff-btn ff-btn-primary ff-btn-lg">
          Start for free
        </Link>
      </section>
    </div>
  )
}
