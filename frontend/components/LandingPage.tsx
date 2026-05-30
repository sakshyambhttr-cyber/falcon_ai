'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Button from './Button'
import Card from './Card'
import LayoutGrid from './LayoutGrid'
import AssetImage from './AssetImage'

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)

  function openDemo() {
    setDemoOpen(true)
    document.getElementById('product-demo')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <main className="ff-landing">
      <div className="ff-landing-actions">
        <Button variant="ghost" onClick={() => setSignInOpen(true)}>
          Sign in
        </Button>
      </div>

      <section
        className="ff-landing-hero"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 520px',
          gap: 48,
          alignItems: 'center'
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-block',
              padding: '8px 14px',
              borderRadius: 999,
              background: 'rgba(0,229,255,0.04)',
              border: '1px solid rgba(0,229,255,0.12)',
              color: '#00e5ff',
              marginBottom: 18,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.06em'
            }}
          >
            AI COFOUNDER. VOICE-FIRST. OUTCOME-DRIVEN.
          </div>
          <h1
            style={{
              fontSize: 56,
              lineHeight: 1.05,
              margin: 0,
              color: '#e9fbff',
              fontWeight: 900,
              letterSpacing: '-0.02em'
            }}
          >
            Build startups with AI intelligence
          </h1>
          <p
            style={{
              marginTop: 18,
              color: '#cfeff4',
              maxWidth: 620,
              fontSize: 16,
              lineHeight: 1.6,
              opacity: 0.95
            }}
          >
            Speak your idea. Get instant concept validation, technical architecture specifications,
            pitch materials, and checklists — all through an ultra-realistic voice co-founder
            conversation.
          </p>

          <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
            <Link href="/workspace" style={{ textDecoration: 'none' }}>
              <Button variant="primary" style={{ padding: '12px 24px', fontSize: 15 }}>
                Enter Workspace
              </Button>
            </Link>
            <Link href="/demo" style={{ textDecoration: 'none' }}>
              <Button variant="outline" style={{ padding: '12px 24px', fontSize: 15 }}>
                Watch Demo
              </Button>
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 28, marginTop: 48, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <AssetImage asset="voice" size={32} alt="Voice" />
                <small style={{ marginTop: 8, fontSize: 11, color: '#8aaab5', fontWeight: 600 }}>
                  Voice Powered
                </small>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <AssetImage asset="prd" size={32} alt="PRD" />
                <small style={{ marginTop: 8, fontSize: 11, color: '#8aaab5', fontWeight: 600 }}>
                  AI Co-founder
                </small>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <AssetImage asset="global" size={32} alt="Outputs" />
                <small style={{ marginTop: 8, fontSize: 11, color: '#8aaab5', fontWeight: 600 }}>
                  Real Outputs
                </small>
              </div>
          </div>
        </div>

        <aside id="product-demo" className="ff-float-mock">
          <Card
            style={{
              padding: 8,
              background: 'rgba(255,255,255,0.01)',
              borderColor: 'rgba(0,229,255,0.1)'
            }}
          >
            <div
              style={{
                width: '100%',
                height: 420,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg, rgba(0,229,255,0.03), rgba(0,0,0,0.2))',
                borderRadius: 12,
                overflow: 'hidden'
              }}
            >
              <img
                src="/images/demo-mock.jpeg"
                alt="Workspace mock"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.95 }}
              />
            </div>
          </Card>
        </aside>
      </section>

      <section style={{ marginTop: 96, paddingBottom: 64 }}>
        <h2
          style={{
            textAlign: 'center',
            color: '#e9fbff',
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: '-0.01em'
          }}
        >
          Everything you need to go from idea to execution
        </h2>
        <p style={{ textAlign: 'center', color: '#8aaab5', fontSize: 15, marginTop: 8 }}>
          One conversation. Fully comprehensive startup deliverables.
        </p>

        <div style={{ marginTop: 48 }}>
          <LayoutGrid columns={4} gap={24}>
            <Card>
              <AssetImage asset="prd" size={32} alt="" />
              <div style={{ height: 16 }} />
              <h3 style={{ color: '#e9fbff', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
                Instant AI Scopes
              </h3>
              <p style={{ color: '#8aaab5', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                Challenge assumptions, analyze global target audiences, and receive structured market
                validation scores.
              </p>
            </Card>
            <Card>
              <AssetImage asset="global" size={32} alt="" />
              <div style={{ height: 16 }} />
              <h3 style={{ color: '#e9fbff', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
                Detailed PRDs
              </h3>
              <p style={{ color: '#8aaab5', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                Generate production-grade product requirement specifications with problem statements,
                solutions, and success metrics.
              </p>
            </Card>
            <Card>
              <AssetImage asset="voice" size={32} alt="" />
              <div style={{ height: 16 }} />
              <h3 style={{ color: '#e9fbff', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
                Technical Spec Documents
              </h3>
              <p style={{ color: '#8aaab5', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                Examine clean architectural blueprints, complete database schemas, system modules, and
                exact tech stack models.
              </p>
            </Card>
            <Card>
              <AssetImage asset="nav-demo" size={32} alt="" />
              <div style={{ height: 16 }} />
              <h3 style={{ color: '#e9fbff', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
                Iterative Roadmaps
              </h3>
              <p style={{ color: '#8aaab5', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                Map task-based milestones across structured phases with interactive checks to execute
                concepts seamlessly.
              </p>
            </Card>
          </LayoutGrid>
        </div>
      </section>

      {demoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
          onClick={() => setDemoOpen(false)}
        >
          <Card style={{ maxWidth: 560, width: '100%', padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: '#e9fbff', fontSize: 20 }}>Interactive demo flow</h3>
            <p style={{ color: '#8aaab5', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
              Open the workspace and try: &quot;I want to build an AI platform that helps students find
              scholarships abroad.&quot; Founder Falcon streams validation, PRD, and roadmap live.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setDemoOpen(false)}>
                Close
              </Button>
              <Link href="/workspace" style={{ textDecoration: 'none' }}>
                <Button variant="primary">Try AI Builder Now</Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {signInOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
          onClick={() => setSignInOpen(false)}
        >
          <Card style={{ maxWidth: 420, width: '100%', padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: '#e9fbff' }}>Sign in</h3>
            <p style={{ color: '#8aaab5', fontSize: 14, margin: '0 0 16px' }}>
              Authentication is coming soon. You can use the full workspace without an account today.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setSignInOpen(false)}>
                Close
              </Button>
              <Link href="/workspace" style={{ textDecoration: 'none' }}>
                <Button variant="primary">Continue to Workspace</Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </main>
  )
}
