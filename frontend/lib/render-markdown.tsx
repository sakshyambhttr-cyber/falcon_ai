import React from 'react'

export function renderMarkdown(md: string) {
  if (!md) return null
  const lines = md.split('\n')
  return lines.map((line, idx) => {
    if (line.startsWith('# ')) {
      return (
        <h1 key={idx} className="ff-md-h1">
          {line.slice(2)}
        </h1>
      )
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} className="ff-md-h2">
          {line.slice(3)}
        </h2>
      )
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} className="ff-md-h3">
          {line.slice(4)}
        </h3>
      )
    }
    if (line.startsWith('> ')) {
      return (
        <blockquote key={idx} className="ff-md-quote">
          {line.slice(2)}
        </blockquote>
      )
    }
    if (line.startsWith('- ')) {
      const content = line.slice(2)
      if (content.startsWith('[ ] ')) {
        return (
          <div key={idx} className="ff-md-check">
            <input type="checkbox" readOnly checked={false} />
            <span>{content.slice(4)}</span>
          </div>
        )
      }
      return (
        <li key={idx} className="ff-md-li">
          {content}
        </li>
      )
    }
    if (!line.trim()) return <div key={idx} className="ff-md-spacer" />
    return (
      <p key={idx} className="ff-md-p">
        {line}
      </p>
    )
  })
}
