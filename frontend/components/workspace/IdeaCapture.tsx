'use client'

import React from 'react'
import Button from '../Button'
import Card from '../Card'
import Panel from '../Panel'
import AssetImage from '../AssetImage'

type IdeaCaptureProps = {
  idea: string
  onIdeaChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export default function IdeaCapture({ idea, onIdeaChange, onSubmit, isLoading, onKeyDown }: IdeaCaptureProps) {
  return (
    <div className="ff-idea-capture">
      <Card className="ff-idea-hero">
        <div className="ff-idea-hero-top">
          <AssetImage asset="logo" size={40} alt="Founder Falcon" />
          <div>
            <h1>Try the AI Builder</h1>
            <p>Describe your startup idea. Founder Falcon will validate, generate a PRD, and build your roadmap.</p>
          </div>
        </div>
      </Card>

      <Panel title="Submit Your Startup Idea">
        <textarea
          className="ff-idea-textarea"
          value={idea}
          onChange={e => onIdeaChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="I want to build an AI platform that helps students find scholarships abroad…"
          disabled={isLoading}
          rows={5}
        />
        <div className="ff-idea-actions">
          <Button variant="primary" onClick={onSubmit} disabled={isLoading || !idea.trim()}>
            {isLoading ? 'Analyzing…' : 'Generate Startup Package'}
          </Button>
        </div>
      </Panel>

      <div className="ff-idea-features">
        <Card>
          <AssetImage asset="prd" size={28} alt="" />
          <strong>Validation + PRD</strong>
          <span>Structured documents, not raw JSON</span>
        </Card>
        <Card>
          <AssetImage asset="voice" size={28} alt="" />
          <strong>Voice Summary</strong>
          <span>Murf agent with TTS fallback</span>
        </Card>
        <Card>
          <AssetImage asset="global" size={28} alt="" />
          <strong>Live Roadmap</strong>
          <span>Phased execution plan</span>
        </Card>
      </div>
    </div>
  )
}
