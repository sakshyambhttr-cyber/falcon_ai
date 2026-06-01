'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Button from './Button'
import AmbientBackground from './AmbientBackground'
import InteractiveAppMockup from './InteractiveAppMockup'
import FeatureInsightModal from './FeatureInsightModal'
import SiteFooter from './SiteFooter'
import { BentoGrid, type BentoItem } from './ui/bento-grid'
import type { FeatureId } from '../modules/feature-insight'

const FEATURES: Array<{
  id: FeatureId
  asset: 'ai' | 'global' | 'document' | 'roadmap'
  title: string
  description: string
}> = [
  {
    id: 'scopes',
    asset: 'ai',
    title: 'Market Validation',
    description:
      'Get a viability score, TAM estimate, and competitive landscape for any startup idea in seconds.'
  },
  {
    id: 'prd',
    asset: 'global',
    title: 'Product Requirements',
    description:
      'Auto-generate a structured PRD with problem statement, user stories, features, and success metrics.'
  },
  {
    id: 'tech-spec',
    asset: 'document',
    title: 'Technical Architecture',
    description:
      'Receive a build-ready architecture blueprint — system modules, database schema, and tech stack.'
  },
  {
    id: 'roadmap',
    asset: 'roadmap',
    title: 'Execution Roadmap',
    description:
      'Phase-based milestones from discovery to launch, with actionable tasks at every step.'
  }
]

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null)

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
            <span className="ff-eyebrow">AI Startup Operating System</span>
            <h1 className="ff-hero-title">Your AI co-founder,<br />from idea to launch</h1>
            <p className="ff-hero-lead">
              Speak or type your startup idea. Get instant validation, a full PRD,
              roadmap, and an AI advisor that remembers your project — all in one workspace.
            </p>

            <div className="ff-hero-cta-row">
              <Link href="/workspace" className="ff-cta-link">
                <Button variant="primary" className="ff-btn-lg">
                  Start for free
                </Button>
              </Link>
              <Link href="/demo" className="ff-cta-link">
                <Button variant="outline" className="ff-btn-lg">
                  See how it works
                </Button>
              </Link>
            </div>

            <div className="ff-hero-trust-row">
              <div className="ff-trust-item">
                <span className="ff-trust-dot" aria-hidden="true" />
                <small>Voice-first input</small>
              </div>
              <div className="ff-trust-item">
                <span className="ff-trust-dot" aria-hidden="true" />
                <small>Gemini-powered analysis</small>
              </div>
              <div className="ff-trust-item">
                <span className="ff-trust-dot" aria-hidden="true" />
                <small>PRD + Roadmap + Validation</small>
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
                From idea to execution — in one workspace
              </h2>
              <p className="ff-section-subtitle">
                Click any card to ask Falcon how it works.
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
