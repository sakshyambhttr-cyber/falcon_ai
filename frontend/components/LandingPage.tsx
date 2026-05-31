'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Button from './Button'
import AssetImage from './AssetImage'
import AmbientBackground from './AmbientBackground'
import InteractiveAppMockup from './InteractiveAppMockup'
import FeatureInsightModal from './FeatureInsightModal'
import SiteFooter from './SiteFooter'
import { BentoGrid, type BentoItem } from './ui/bento-grid'
import type { FeatureId } from '../modules/feature-insight'

const ENGAGEMENT_ITEMS = [
  {
    id: 'briefing',
    label: 'Briefing pulse',
    title: 'Watch the advisor turn one sentence into structure',
    description:
      'The lower strip previews the live workflow: idea intake, validation, PRD generation, and execution planning.'
  },
  {
    id: 'workspace',
    label: 'Workspace flow',
    title: 'Jump into the workspace when you are ready',
    description:
      'Keep the interaction moving with voice input, document tabs, and guided next steps instead of a static landing page.'
  },
  {
    id: 'outcomes',
    label: 'Output preview',
    title: 'See the deliverables before you commit',
    description:
      'The product promises real founder outputs, so the UI should show the outcome layer right on the landing page.'
  }
] as const

const FEATURES: Array<{
  id: FeatureId
  asset: 'ai' | 'global' | 'document' | 'roadmap'
  title: string
  description: string
}> = [
  {
    id: 'scopes',
    asset: 'ai',
    title: 'Instant AI Scopes',
    description:
      'Challenge assumptions, analyze global target audiences, and receive structured market validation scores.'
  },
  {
    id: 'prd',
    asset: 'global',
    title: 'Detailed PRDs',
    description:
      'Generate production-grade product requirement specifications with problem statements, solutions, and success metrics.'
  },
  {
    id: 'tech-spec',
    asset: 'document',
    title: 'Technical Spec Documents',
    description:
      'Examine clean architectural blueprints, complete database schemas, system modules, and exact tech stack models.'
  },
  {
    id: 'roadmap',
    asset: 'roadmap',
    title: 'Iterative Roadmaps',
    description:
      'Map task-based milestones across structured phases with interactive checks to execute concepts seamlessly.'
  }
]

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null)
  const [activeEngagement, setActiveEngagement] = useState<typeof ENGAGEMENT_ITEMS[number]['id']>(ENGAGEMENT_ITEMS[0].id)

  const engagementItem = ENGAGEMENT_ITEMS.find(item => item.id === activeEngagement) || ENGAGEMENT_ITEMS[0]

  const bentoItems: BentoItem[] = FEATURES.map((feature, index) => ({
    title: feature.title,
    description: feature.description,
    asset: feature.asset,
    meta:
      index === 0
        ? 'Live insights'
        : index === 1
          ? 'PRD generated'
          : index === 2
            ? 'Architecture ready'
            : 'Execution roadmap',
    status: index === 0 ? 'Live' : index === 1 ? 'Updated' : index === 2 ? 'Active' : 'Beta',
    tags:
      index === 0
        ? ['Market', 'AI']
        : index === 1
          ? ['Specs', 'Docs']
          : index === 2
            ? ['Infra', 'Systems']
            : ['Roadmap', 'Delivery'],
    colSpan: index === 0 || index === 2 ? 2 : 1,
    hasPersistentHover: index === 0,
    cta: 'Ask AI →'
  }))

  return (
    <div className="ff-landing-page">
      <AmbientBackground />
      <main className="ff-landing">
        <section className="ff-landing-hero">
          <div className="ff-landing-hero-copy">
            <span className="ff-eyebrow">AI Cofounder · Voice-First · Outcome-Driven</span>
            <h1 className="ff-hero-title">Build startups with AI intelligence</h1>
            <p className="ff-hero-lead">
              Speak your idea. Get instant concept validation, technical architecture specifications,
              pitch materials, and checklists — all through an ultra-realistic voice co-founder
              conversation.
            </p>
            <p className="ff-hero-lead ff-hero-lead-secondary">
              Transform raw startup thoughts into validated opportunities, structured product plans,
              and actionable execution roadmaps powered by AI. Generate startup intelligence, PRDs,
              validation reports, and growth strategies in one unified workspace.
            </p>

            <div className="ff-hero-cta-row">
              <Link href="/workspace" className="ff-cta-link">
                <Button variant="primary" className="ff-btn-lg">
                  Enter Workspace
                </Button>
              </Link>
              <Link href="/demo" className="ff-cta-link">
                <Button variant="outline" className="ff-btn-lg">
                  Watch Demo
                </Button>
              </Link>
            </div>

            <div className="ff-hero-trust-row">
              <div className="ff-trust-item">
                <span className="ff-icon-box ff-trust-icon">
                  <AssetImage asset="waveform" size={24} alt="Voice" />
                </span>
                <small>Voice Powered</small>
              </div>
              <div className="ff-trust-item">
                <span className="ff-icon-box ff-trust-icon">
                  <AssetImage asset="ai" size={24} alt="AI Co-founder" />
                </span>
                <small>AI Co-founder</small>
              </div>
              <div className="ff-trust-item">
                <span className="ff-icon-box ff-trust-icon">
                  <AssetImage asset="output" size={24} alt="Real Outputs" />
                </span>
                <small>Real Outputs</small>
              </div>
            </div>
          </div>

          <aside id="product-demo" className="ff-demo-aside">
            <InteractiveAppMockup />
          </aside>
        </section>

        <section className="ff-landing-features">
          <div className="ff-landing-features-body">
            <div className="ff-landing-features-header">
              <h2 className="ff-landing-section-title">
                Everything you need to go from idea to execution
              </h2>
              <p className="ff-section-subtitle">
                One conversation. Fully comprehensive startup deliverables. Tap a card to ask AI how it works.
              </p>
            </div>

            <BentoGrid
              items={bentoItems}
              onItemClick={(_, index) => {
                const feature = FEATURES[index]
                if (feature) {
                  setActiveFeature(feature.id)
                }
              }}
            />

            <section className="ff-landing-engagement" aria-label="Interactive product preview">
              <div className="ff-landing-engagement-panel">
                <div className="ff-landing-engagement-copy">
                  <span className="ff-eyebrow">Interactive preview</span>
                  <h3>{engagementItem.title}</h3>
                  <p>{engagementItem.description}</p>
                  <div className="ff-landing-engagement-actions" role="tablist" aria-label="Preview modes">
                    {ENGAGEMENT_ITEMS.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={activeEngagement === item.id}
                        className={`ff-landing-engagement-chip${activeEngagement === item.id ? ' active' : ''}`}
                        onClick={() => setActiveEngagement(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ff-landing-engagement-visual">
                  <div className="ff-landing-engagement-stat ff-landing-engagement-stat-primary">
                    <strong>Live</strong>
                    <span>Founder-grade output</span>
                  </div>
                  <div className="ff-landing-engagement-stat">
                    <strong>3</strong>
                    <span>core deliverables</span>
                  </div>
                  <div className="ff-landing-engagement-stat">
                    <strong>1</strong>
                    <span>voice-guided flow</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <SiteFooter />
        </section>

        <FeatureInsightModal
          featureId={activeFeature}
          onClose={() => setActiveFeature(null)}
        />
      </main>
    </div>
  )
}
