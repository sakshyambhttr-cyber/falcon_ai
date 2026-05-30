import React from 'react'

export type CardProps = {
  children?: React.ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps){
  return (
    <div className={["ff-card", className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
