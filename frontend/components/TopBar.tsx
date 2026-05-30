'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'
import Button from './Button'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/about': 'About Falcon',
  '/demo': 'Demo',
  '/contact': 'Contact',
  '/workspace': 'AI Workspace'
}

export default function TopBar() {
  const pathname = usePathname() || '/'
  const title = PAGE_TITLES[pathname] || 'Founder Falcon'
  const isWorkspace = pathname.startsWith('/workspace')

  return (
    <header className="ff-topbar" role="banner">
      <Logo size={28} showText href="/" className="ff-topbar-logo" />

      <div className="ff-topbar-center">
        <span className="ff-topbar-page">{title}</span>
        <span className="ff-topbar-badge">AI STARTUP OS</span>
      </div>

      <div className="ff-topbar-actions">
        {!isWorkspace && (
          <Link href="/workspace" style={{ textDecoration: 'none' }}>
            <Button variant="primary" style={{ padding: '8px 16px', fontSize: 13 }}>
              Try AI
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}
