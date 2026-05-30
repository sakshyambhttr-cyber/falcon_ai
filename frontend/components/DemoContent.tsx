'use client'

import React from 'react'
import Link from 'next/link'
import Button from './Button'
import Card from './Card'
import AssetImage from './AssetImage'

const DEMO_VIDEO_ID = process.env.NEXT_PUBLIC_DEMO_VIDEO_ID || 'dQw4jW4dW8Q'

export default function DemoContent() {
  return (
    <div className="ff-page ff-page-demo">
      <div className="ff-page-inner">
        <header className="ff-page-header">
          <AssetImage asset="nav-demo" size={32} alt="" />
          <div>
            <h1>See Founder Falcon in Action</h1>
            <p>Watch the AI startup OS generate validation, PRD, and roadmap in real time.</p>
          </div>
        </header>

        <Card className="ff-demo-video-card">
          <div className="ff-demo-video-wrap">
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
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outline">Watch Full Demo</Button>
            </a>
          </div>
        </Card>

        <Card className="ff-demo-cta">
          <h3>Ready to build?</h3>
          <p>Jump into the AI workspace and submit your startup idea — outputs stream live with voice summary.</p>
          <Link href="/workspace" style={{ textDecoration: 'none' }}>
            <Button variant="primary">Try AI Builder Now</Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}
