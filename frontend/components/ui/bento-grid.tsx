'use client'

import type { ReactNode } from 'react'
import Card from '../Card'
import AssetImage from '../AssetImage'
import type { AssetKey } from '../../lib/asset-registry'

export interface BentoItem {
  title: string
  description: string
  /** Optional icon node; prefer `asset` for consistent Falcon icons */
  icon?: ReactNode
  asset?: AssetKey
  status?: string
  tags?: string[]
  meta?: string
  cta?: string
  colSpan?: number
  hasPersistentHover?: boolean
}

interface BentoGridProps {
  items?: BentoItem[]
  onItemClick?: (item: BentoItem, index: number) => void
}

function BentoGrid({ items = [], onItemClick }: BentoGridProps) {
  if (!items.length) return null

  return (
    <div className="ff-bento-grid">
      {items.map((item, index) => {
        const wide = item.colSpan === 2
        const interactive = Boolean(onItemClick)
        const card = (
          <Card
            className={[
              'ff-card-feature',
              interactive ? 'ff-card-interactive' : '',
              item.hasPersistentHover ? 'ff-bento-card-persistent' : ''
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="ff-bento-card-top">
              <span className="ff-icon-box ff-feature-icon">
                {item.asset ? (
                  <AssetImage asset={item.asset} size={20} alt="" />
                ) : (
                  item.icon
                )}
              </span>
              {item.status ? (
                <span className="ff-bento-status">{item.status}</span>
              ) : null}
            </div>
            <h3>
              {item.title}
              {item.meta ? <span className="ff-bento-meta">{item.meta}</span> : null}
            </h3>
            <p>{item.description}</p>
            <div className="ff-bento-card-foot">
              {item.tags?.length ? (
                <div className="ff-bento-tags">
                  {item.tags.map(tag => (
                    <span key={tag} className="ff-bento-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span />
              )}
              <span className="ff-card-feature-cta">{item.cta || 'Ask AI →'}</span>
            </div>
          </Card>
        )

        if (!interactive) {
          return (
            <div
              key={index}
              className={`ff-bento-cell${wide ? ' ff-bento-cell-wide' : ''}`}
            >
              {card}
            </div>
          )
        }

        return (
          <button
            key={index}
            type="button"
            className={`ff-card-feature-btn ff-bento-cell${wide ? ' ff-bento-cell-wide' : ''}`}
            onClick={() => onItemClick?.(item, index)}
          >
            {card}
          </button>
        )
      })}
    </div>
  )
}

export { BentoGrid }
