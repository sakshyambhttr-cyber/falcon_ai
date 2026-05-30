'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AppIcon from './AppIcon'
import type { NavIconName } from '../lib/icons'

type NavItem = {
  href: string
  label: string
  icon: NavIconName
  match: (path: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: 'home', match: p => p === '/' },
  { href: '/about', label: 'About Falcon', icon: 'about', match: p => p.startsWith('/about') },
  { href: '/demo', label: 'Demo', icon: 'demo', match: p => p.startsWith('/demo') },
  { href: '/contact', label: 'Contact', icon: 'contact', match: p => p.startsWith('/contact') },
  { href: '/workspace', label: 'Try AI', icon: 'ai', match: p => p.startsWith('/workspace') }
]

export default function BottomNav() {
  const pathname = usePathname() || '/'

  return (
    <nav className="ff-bottom-nav" aria-label="Main navigation">
      <div className="ff-bottom-nav-inner">
        {NAV_ITEMS.map(item => {
          const active = item.match(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`ff-bottom-nav-item${active ? ' ff-bottom-nav-item-active' : ''}`}
            >
              <span className="ff-bottom-nav-icon-wrap">
                <AppIcon name={item.icon} size={22} alt="" />
                {active && <span className="ff-bottom-nav-glow" aria-hidden />}
              </span>
              <span className="ff-bottom-nav-label">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
