'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'
import Button from './Button'
import SignInModal from './SignInModal'
import { APP_NAME } from '../lib/brand'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/firebase'

const PAGE_TITLES: Record<string, string> = {
  '/':          'Home',
  '/about':     'About Falcon',
  '/demo':      'Demo',
  '/contact':   'Contact',
  '/workspace': 'AI Workspace'
}

const MOBILE_LINKS = [
  { href: '/', label: 'Home', match: (p: string) => p === '/' },
  { href: '/about', label: 'About', match: (p: string) => p.startsWith('/about') },
  { href: '/demo', label: 'Demo', match: (p: string) => p.startsWith('/demo') },
  { href: '/contact', label: 'Contact', match: (p: string) => p.startsWith('/contact') },
  { href: '/workspace', label: 'Workspace', match: (p: string) => p.startsWith('/workspace') }
] as const

type TopBarProps = {
  onHomeNavigate?: () => void
}

export default function TopBar({ onHomeNavigate }: TopBarProps) {
  const pathname = usePathname() || '/'
  const title = PAGE_TITLES[pathname] || APP_NAME
  const isWorkspace = pathname.startsWith('/workspace')
  const [signInOpen, setSignInOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isAuthenticated, isLoading } = useAuth()

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    closeMenu()
  }, [pathname, closeMenu])

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.body.classList.add('ff-nav-menu-open')
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.classList.remove('ff-nav-menu-open')
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen, closeMenu])

  const handleHomeClick = () => {
    if (pathname === '/') onHomeNavigate?.()
  }

  async function handleSignOut() {
    try {
      await signOut()
      closeMenu()
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  const userInitial = user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <>
      <header className="ff-topbar" role="banner">
        <div className="ff-topbar-accent" aria-hidden />

        <div className="ff-topbar-start">
          <Logo
            size={34}
            showText
            href="/"
            className="ff-topbar-logo"
            onHomeClick={handleHomeClick}
          />
        </div>

        <nav className="ff-topbar-center" aria-label="Main navigation">
          <Link
            href="/"
            className={`ff-topbar-glass ff-topbar-nav-pill ff-topbar-page-link${pathname === '/' ? ' active' : ''}`}
            aria-label="Home"
            aria-current={pathname === '/' ? 'page' : undefined}
            onClick={handleHomeClick}
          >
            <span className="ff-topbar-page">Home</span>
          </Link>
          <Link
            href="/about"
            className={`ff-topbar-glass ff-topbar-nav-pill ff-topbar-page-link${pathname.startsWith('/about') ? ' active' : ''}`}
            aria-current={pathname.startsWith('/about') ? 'page' : undefined}
          >
            <span className="ff-topbar-page">About</span>
          </Link>
          <Link
            href="/contact"
            className={`ff-topbar-glass ff-topbar-nav-pill ff-topbar-page-link${pathname.startsWith('/contact') ? ' active' : ''}`}
            aria-current={pathname.startsWith('/contact') ? 'page' : undefined}
          >
            <span className="ff-topbar-page">Contact</span>
          </Link>
          <Link
            href="/workspace"
            className={`ff-topbar-glass ff-topbar-nav-pill ff-topbar-nav-pill-accent ff-topbar-badge-link${isWorkspace ? ' active' : ''}`}
            aria-label="Open AI workspace"
            aria-current={isWorkspace ? 'page' : undefined}
          >
            <span className="ff-topbar-badge">AI STARTUP OS</span>
          </Link>
        </nav>

        <div className="ff-topbar-actions">
          {/* Profile / auth — always visible on all pages */}
          {!isLoading && (
            <div className="ff-topbar-auth-group">
              {isAuthenticated && user ? (
                <>
                  {/* Profile dropdown trigger — visible everywhere */}
                  <div className="ff-topbar-profile-wrap">
                    <button
                      type="button"
                      className="ff-topbar-profile-btn"
                      aria-label={`Signed in as ${user.displayName || user.email}`}
                      title={user.displayName || user.email || 'Your account'}
                      onClick={handleSignOut}
                    >
                      {user.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Profile'}
                          className="ff-topbar-profile-photo"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="ff-user-avatar" aria-hidden="true">
                          {userInitial}
                        </span>
                      )}
                      <span className="ff-topbar-profile-name">
                        {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Account'}
                      </span>
                    </button>
                  </div>
                  {/* Workspace CTA — only on non-workspace pages */}
                  {!isWorkspace && (
                    <Link href="/workspace" className="ff-topbar-cta-link">
                      <Button variant="primary" className="ff-topbar-cta ff-topbar-glass ff-topbar-glass-cta">
                        Workspace
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                /* Not signed in — only show on non-workspace pages */
                !isWorkspace && (
                  <>
                    <Button
                      variant="ghost"
                      className="ff-topbar-signin ff-topbar-glass ff-topbar-glass-signin"
                      onClick={() => setSignInOpen(true)}
                      aria-label="Sign in to your account"
                    >
                      Sign in
                    </Button>
                    <Link href="/workspace" className="ff-topbar-cta-link">
                      <Button variant="primary" className="ff-topbar-cta ff-topbar-glass ff-topbar-glass-cta">
                        Try AI
                      </Button>
                    </Link>
                  </>
                )
              )}
            </div>
          )}

          <button
            type="button"
            className={`ff-topbar-menu-btn${menuOpen ? ' open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-haspopup="true"
            onClick={() => setMenuOpen(v => !v)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            className="ff-topbar-mobile-backdrop"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <nav
            id="mobile-menu"
            className="ff-topbar-mobile-menu"
            aria-label="Mobile navigation"
          >
            {!isWorkspace && !isLoading && (
              <div className="ff-mobile-nav-actions">
                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    className="ff-topbar-signin ff-topbar-glass-signin ff-topbar-user-btn"
                    onClick={handleSignOut}
                  >
                    <span className="ff-user-avatar" aria-hidden="true">
                      {userInitial}
                    </span>
                    <span className="ff-topbar-btn-label">Sign out</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="ff-topbar-signin ff-topbar-glass-signin"
                    onClick={() => {
                      setSignInOpen(true)
                      closeMenu()
                    }}
                  >
                    Sign in
                  </Button>
                )}
                <Link href="/workspace" className="ff-topbar-cta-link" onClick={closeMenu}>
                  <Button variant="primary" className="ff-topbar-cta-full">
                    {isAuthenticated ? 'Open Workspace' : 'Try AI'}
                  </Button>
                </Link>
              </div>
            )}

            <div className="ff-mobile-nav-section">
              <span className="ff-mobile-nav-heading">Navigate</span>
              {MOBILE_LINKS.map(link => {
                const active = link.match(pathname)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`ff-mobile-nav-link${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => {
                      closeMenu()
                      if (link.href === '/') handleHomeClick()
                    }}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </nav>
        </>
      )}

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  )
}
