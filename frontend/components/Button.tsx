'use client'

import React, { ButtonHTMLAttributes } from 'react'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline'
}

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps){
  return (
    <button className={[`ff-btn`, `ff-btn-${variant}`, className].filter(Boolean).join(' ')} {...props} />
  )
}
