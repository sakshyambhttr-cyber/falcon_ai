'use client'

import React from 'react'
import Link from 'next/link'
import Button from './Button'
import Card from './Card'
import AssetImage from './AssetImage'
import AmbientBackground from './AmbientBackground'

const DEMO_VIDEO_ID = process.env.NEXT_PUBLIC_DEMO_VIDEO_ID || 'dQw4jW4dW8Q'

export default function DemoContent() {
  return (
    <div className="ff-page ff-page-flow ff-page-demo">
      <AmbientBackground />
      <div className="ff-page-flow-inner">
        <header className="ff-page-header">
          <span className="ff-icon-box">
            <AssetImage asset="nav-demo" size={24} alt="" />
          </span>
          <div>
            <h1>See Founder Falcon in Action</h1>
            <p>Watch validation, PRD, and roadmap generation stream live in the workspace.</p>
          </div>
        </header>

        <Card className="ff-demo-video-card">
          <div className="ff-demo-video-wrap ff-demo-video-wrap-flow">
            <iframe
              src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?rel=0`}
              title="Founder Falcon Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="ff-demo-actions">
            <a
              href={`https://www.youtube.com/watch?v=${DEMO_VIDEO_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ff-demo-ext-link"
            >
              <Button variant="outline">Watch Full Demo</Button>
            </a>
          </div>
        </Card>

        <Card className="ff-demo-cta ff-demo-cta-flow">
          <span className="ff-icon-box">
            <AssetImage asset="ai" size={24} alt="" />
          </span>
          <div className="ff-demo-cta-copy">
            <h3>Ready to build?</h3>
            <p>
              Jump into the AI workspace and submit your startup idea — outputs stream live with
              voice summary.
            </p>
          </div>
          <Link href="/workspace" className="ff-demo-cta-link">
            <Button variant="primary">Try AI Builder Now</Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}
