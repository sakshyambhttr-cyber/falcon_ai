import React, { HTMLAttributes } from 'react'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode
  className?: string
}

export default function Card({ children, className = '', style, ...props }: CardProps){
  return (
    <div className={["ff-card", className].filter(Boolean).join(' ')} style={style} {...props}>
      {children}
    </div>
  )
}

