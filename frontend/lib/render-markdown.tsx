import React from 'react'
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize a raw markdown string before rendering.
 * Uses DOMPurify in text-only mode (ALLOWED_TAGS: []) to strip any HTML/script
 * injection that could be embedded in AI-generated content.
 */
function sanitizeMarkdown(md: string): string {
  // ALLOWED_TAGS: [] strips all HTML tags while preserving plain text content.
  // KEEP_CONTENT: true ensures text inside stripped tags is preserved.
  return DOMPurify.sanitize(md, { ALLOWED_TAGS: [], KEEP_CONTENT: true })
}

/** Render inline markdown: **bold**, `code`, and plain text */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  // Split on **bold** and `code` patterns
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    if (match[0].startsWith('**')) {
      parts.push(<strong key={match.index} className="ff-md-bold">{match[2]}</strong>)
    } else {
      parts.push(
        <code key={match.index} className="ff-md-code">
          {match[3]}
        </code>
      )
    }
    last = match.index + match[0].length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
}

/** Check if a line is a markdown table separator (| --- | --- |) */
function isTableSeparator(line: string): boolean {
  return /^\|[\s\-:|]+\|/.test(line)
}

/** Parse a table row into cells */
function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map(cell => cell.trim())
}

export function renderMarkdown(rawMd: string): React.ReactNode {
  if (!rawMd) return null

  // Sanitize AI-generated content before parsing to prevent injection
  const md = sanitizeMarkdown(rawMd)
  const lines = md.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Headings
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="ff-md-h1">{renderInline(line.slice(2))}</h1>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="ff-md-h2">{renderInline(line.slice(3))}</h2>)
      i++; continue
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="ff-md-h3">{renderInline(line.slice(4))}</h3>)
      i++; continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="ff-md-quote">
          {renderInline(line.slice(2))}
        </blockquote>
      )
      i++; continue
    }

    // Table — collect header + separator + rows
    if (line.startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = parseTableRow(line)
      i += 2 // skip header + separator
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(parseTableRow(lines[i]))
        i++
      }
      elements.push(
        <table key={`table-${i}`} className="ff-md-table">
          <thead>
            <tr>
              {headers.map((h, hi) => (
                <th key={hi}>{renderInline(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}>{renderInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
      continue
    }

    // List items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.slice(2)
      if (content.startsWith('[ ] ')) {
        elements.push(
          <div key={i} className="ff-md-check">
            <input type="checkbox" readOnly checked={false} aria-label="unchecked task" />
            <span>{renderInline(content.slice(4))}</span>
          </div>
        )
      } else if (content.startsWith('[x] ') || content.startsWith('[X] ')) {
        elements.push(
          <div key={i} className="ff-md-check ff-md-check-done">
            <input type="checkbox" readOnly checked aria-label="completed task" />
            <span>{renderInline(content.slice(4))}</span>
          </div>
        )
      } else {
        elements.push(
          <li key={i} className="ff-md-li">{renderInline(content)}</li>
        )
      }
      i++; continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '')
      elements.push(
        <li key={i} className="ff-md-li ff-md-li-ordered">
          {renderInline(content)}
        </li>
      )
      i++; continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="ff-md-hr" />)
      i++; continue
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={i} className="ff-md-spacer" />)
      i++; continue
    }

    // Paragraph
    elements.push(
      <p key={i} className="ff-md-p">{renderInline(line)}</p>
    )
    i++
  }

  return <div className="ff-markdown-body">{elements}</div>
}
