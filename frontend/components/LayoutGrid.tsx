import React from 'react'

export type LayoutGridProps = {
  children?: React.ReactNode
  columns?: number
  gap?: number
  className?: string
}

export default function LayoutGrid({ children, columns = 12, gap = 16, className = '' }: LayoutGridProps){
  const style = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: `${gap}px`
  } as React.CSSProperties
  return (
    <div
      className={['ff-grid', 'ff-responsive-grid', className].filter(Boolean).join(' ')}
      style={style}
      data-columns={columns}
    >
      {children}
    </div>
  )
}
