'use client'

import React from 'react'
import type { IntelligenceUIState } from '../../lib/intelligence-state'
import type { FalconEvent } from '../../types/events'

function IdeaAnalysisCard({ data }: { data: NonNullable<IntelligenceUIState['memory']['analysis']> }) {
  return (
    <article className="ff-event-card ff-event-idea">
      <header>Idea Analysis</header>
      <p>{data.summary}</p>
      <div className="ff-event-meta">
        <span className="ff-tag">{data.category}</span>
        <span className={`ff-tag ff-diff-${data.difficulty}`}>{data.difficulty} difficulty</span>
      </div>
      <div className="ff-keywords">
        {data.keywords.map(k => (
          <span key={k} className="ff-keyword">
            {k}
          </span>
        ))}
      </div>
    </article>
  )
}

function MarketPanel({ data }: { data: NonNullable<IntelligenceUIState['memory']['market']> }) {
  return (
    <article className="ff-event-card ff-event-market">
      <header>Market Analysis</header>
      <div className="ff-market-grid">
        <div>
          <label>Market Size</label>
          <strong>{data.market_size}</strong>
        </div>
        <div>
          <label>Growth Rate</label>
          <strong>{data.growth_rate}</strong>
        </div>
        <div>
          <label>Competition</label>
          <strong className={`ff-comp-${data.competition_level}`}>{data.competition_level}</strong>
        </div>
      </div>
    </article>
  )
}

function ValidationDashboard({ data }: { data: NonNullable<IntelligenceUIState['memory']['validation']> }) {
  return (
    <article className="ff-event-card ff-event-validation">
      <header>Validation Report</header>
      <div className="ff-validation-score">
        <strong>{data.viability_score}</strong>
        <span>VIABILITY</span>
      </div>
      <div className="ff-validation-cols">
        <div>
          <h4>Risks</h4>
          <ul>{data.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
        <div>
          <h4>Opportunities</h4>
          <ul>{data.opportunities.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </div>
      </div>
    </article>
  )
}

function PrdBuilder({ prd }: { prd: IntelligenceUIState['memory']['prd'] }) {
  const sections = Object.entries(prd).filter(([, v]) => v)
  if (!sections.length) return null
  return (
    <article className="ff-event-card ff-event-prd">
      <header>PRD Builder</header>
      {sections.map(([key, content]) => (
        <div key={key} className="ff-prd-section">
          <h4>{key.replace(/_/g, ' ')}</h4>
          <pre>{content}</pre>
        </div>
      ))}
    </article>
  )
}

function RoadmapTimeline({ steps }: { steps: IntelligenceUIState['memory']['roadmap'] }) {
  if (!steps.length) return null
  return (
    <article className="ff-event-card ff-event-roadmap">
      <header>Roadmap Timeline</header>
      {steps.map(step => (
        <div key={step.phase} className="ff-roadmap-phase">
          <div className="ff-roadmap-phase-num">P{step.phase}</div>
          <div>
            <strong>{step.title}</strong>
            <ul>
              {step.tasks.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </article>
  )
}

function FinalSummaryHero({ data }: { data: NonNullable<IntelligenceUIState['memory']['final']> }) {
  return (
    <article className="ff-event-card ff-event-final">
      <header>Final Intelligence Summary</header>
      <h2 className="ff-final-name">{data.startup_name_suggestion}</h2>
      <p className="ff-final-pitch">{data.one_line_pitch}</p>
      <div className="ff-fundability">
        <span>Fundability</span>
        <strong>{data.fundability_score}%</strong>
      </div>
    </article>
  )
}

type Props = {
  state: IntelligenceUIState
  showFeed?: boolean
}

export default function IntelligenceEventRenderer({ state, showFeed = true }: Props) {
  const { memory, events, pipelineStatus, status } = state

  return (
    <div className="ff-intelligence-feed">
      {status === 'connecting' && (
        <div className="ff-pipeline-status">
          <span className="ff-typing">
            <span />
            <span />
            <span />
          </span>
          Initializing intelligence pipeline…
        </div>
      )}

      {pipelineStatus && status === 'streaming' && (
        <div className="ff-pipeline-status live">
          Live: <code>{pipelineStatus}</code>
        </div>
      )}

      {memory.analysis && <IdeaAnalysisCard data={memory.analysis} />}
      {memory.market && <MarketPanel data={memory.market} />}
      {memory.validation && <ValidationDashboard data={memory.validation} />}
      <PrdBuilder prd={memory.prd} />
      <RoadmapTimeline steps={memory.roadmap} />
      {memory.final && <FinalSummaryHero data={memory.final} />}

      {showFeed && events.length > 0 && (
        <details className="ff-event-log">
          <summary>Event stream ({events.length})</summary>
          <ol>
            {events.map((e: FalconEvent) => (
              <li key={e.index}>
                #{e.index} {e.type}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  )
}
