import React from 'react'

export type PanelProps = {
  title?: string
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function Panel({ title, children, className = '', style }: PanelProps){
  return (
    <section className={["ff-panel", className].filter(Boolean).join(' ')} style={style}>
      {title && <div className="ff-panel-header">{title}</div>}
      <div className="ff-panel-body">{children}</div>
    </section>
  )
}

