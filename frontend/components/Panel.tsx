import React from 'react'

export type PanelProps = {
  title?: string
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  titleRight?: React.ReactNode
}

export default function Panel({ title, children, className = '', style, titleRight }: PanelProps){
  return (
    <section className={["ff-panel", className].filter(Boolean).join(' ')} style={style}>
      {title && (
        <div className="ff-panel-header">
          <span className="ff-panel-title">{title}</span>
          {titleRight}
        </div>
      )}
      <div className="ff-panel-body">{children}</div>
    </section>
  )
}

