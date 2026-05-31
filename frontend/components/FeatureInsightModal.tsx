'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Button from './Button'
import Card from './Card'
import type { FeatureId } from '../modules/feature-insight'
import { APP_NAME } from '../lib/brand'

type FeatureInsightModalProps = {
  featureId: FeatureId | null
  onClose: () => void
}

export default function FeatureInsightModal({ featureId, onClose }: FeatureInsightModalProps) {
  const [title, setTitle] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!featureId) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setAnswer('')
    setTitle('')

    fetch('/api/feature/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: featureId })
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Request failed')
        if (!cancelled) {
          setTitle(data.title)
          setAnswer(data.answer)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [featureId])

  if (!featureId) return null

  return (
    <div
      className="ff-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-insight-title"
      onClick={onClose}
    >
      <Card className="ff-modal-card ff-feature-modal" onClick={e => e.stopPropagation()}>
        <h3 id="feature-insight-title" className="ff-modal-title">{title || 'Loading insight…'}</h3>

        {loading && (
          <div className="ff-feature-modal-loading">
            <span className="ff-app-mockup-spinner" aria-hidden />
            <p>Asking {APP_NAME} AI…</p>
          </div>
        )}

        {error && !loading && (
          <p className="ff-modal-body ff-feature-modal-error">{error}</p>
        )}

        {!loading && answer && (
          <div className="ff-feature-modal-body">
            {answer.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        <div className="ff-modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Link href="/workspace" className="ff-cta-link" onClick={onClose}>
            <Button variant="primary">Try in Workspace</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
