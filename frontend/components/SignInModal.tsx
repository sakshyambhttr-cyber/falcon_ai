'use client'

/**
 * MURF FALCON — SIGN IN MODAL
 *
 * Supports:
 * - Google OAuth
 * - Email + Password Sign In
 * - Email + Password Sign Up
 * - Password Reset (forgot password)
 * - Graceful degradation when Firebase is not configured
 */

import React, { useState } from 'react'
import Link from 'next/link'
import Button from './Button'
import Card from './Card'
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  isFirebaseConfigured
} from '../lib/firebase'

type SignInModalProps = {
  open: boolean
  onClose: () => void
}

type AuthMode = 'signin' | 'signup' | 'reset'

// ─── ERROR FORMATTER ──────────────────────────────────────────────────────────

function formatAuthError(err: unknown): string {
  if (!(err instanceof Error)) return 'An unexpected error occurred. Please try again.'
  const msg = err.message
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
    return 'Invalid email or password. Please try again.'
  }
  if (msg.includes('email-already-in-use')) return 'An account with this email already exists. Try signing in.'
  if (msg.includes('weak-password')) return 'Password must be at least 6 characters.'
  if (msg.includes('invalid-email')) return 'Please enter a valid email address.'
  if (msg.includes('popup-closed-by-user') || msg.includes('cancelled-popup-request')) return 'Sign-in was cancelled.'
  if (msg.includes('popup-blocked')) return 'Popup was blocked — trying redirect sign-in instead.'
  if (msg.includes('unauthorized-domain')) {
    return 'This domain is not authorized in Firebase. Go to Firebase Console → Authentication → Settings → Authorized domains and add "localhost".'
  }
  if (msg.includes('operation-not-allowed')) {
    return 'Google sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method and enable Google.'
  }
  if (msg.includes('network-request-failed')) return 'Network error. Please check your connection.'
  if (msg.includes('too-many-requests')) return 'Too many attempts. Please wait a moment and try again.'
  if (msg.includes('Redirecting to Google')) return 'Redirecting to Google sign-in…'
  return msg
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function SignInModal({ open, onClose }: SignInModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const firebaseReady = isFirebaseConfigured()

  if (!open) return null

  function clearMessages() { setError(null); setSuccess(null) }

  function switchMode(next: AuthMode) {
    clearMessages()
    setMode(next)
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    clearMessages()
    try {
      await signInWithGoogle()
      onClose()
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (mode !== 'reset' && !password.trim()) { setError('Please enter your password.'); return }
    setLoading(true)
    clearMessages()
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
        onClose()
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password)
        onClose()
      } else if (mode === 'reset') {
        await resetPassword(email)
        setSuccess('Password reset email sent. Check your inbox.')
      }
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const TITLES: Record<AuthMode, string> = {
    signin: 'Welcome back',
    signup: 'Create account',
    reset: 'Reset password'
  }

  const SUBTITLES: Record<AuthMode, string> = {
    signin: 'Sign in to save your startup intelligence sessions.',
    signup: 'Join Murf Falcon to build your startup operating system.',
    reset: 'Enter your email and we\'ll send a reset link.'
  }

  return (
    <div
      className="ff-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
      onClick={onClose}
    >
      <Card className="ff-modal-card ff-signin-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ff-signin-header">
          <h2 id="signin-title" className="ff-modal-title">{TITLES[mode]}</h2>
          <p className="ff-modal-body" style={{ marginBottom: 0 }}>{SUBTITLES[mode]}</p>
        </div>

        {/* Firebase not configured */}
        {!firebaseReady ? (
          <div className="ff-signin-form">
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Authentication is being set up. You can use the full workspace without an account today.
            </p>
            <div className="ff-modal-actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <Link href="/workspace" style={{ textDecoration: 'none' }} onClick={onClose}>
                <Button variant="primary">Continue to Workspace</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="ff-signin-form">

            {/* Google — only on signin/signup */}
            {mode !== 'reset' && (
              <>
                <button
                  type="button"
                  className="ff-signin-google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  aria-label="Sign in with Google"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  Continue with Google
                </button>
                <div className="ff-signin-divider"><span>or</span></div>
              </>
            )}

            {/* Email form */}
            <form onSubmit={handleEmailAuth} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="ff-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); clearMessages() }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                    required
                    aria-label="Email address"
                  />
                </div>

                {mode !== 'reset' && (
                  <div className="ff-field">
                    <span>Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); clearMessages() }}
                      placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      disabled={loading}
                      required
                      aria-label="Password"
                    />
                  </div>
                )}

                {/* Forgot password link */}
                {mode === 'signin' && (
                  <button
                    type="button"
                    className="ff-signin-forgot"
                    onClick={() => switchMode('reset')}
                  >
                    Forgot password?
                  </button>
                )}

                {error && <div className="ff-signin-error" role="alert">{error}</div>}
                {success && <div className="ff-signin-success" role="status">{success}</div>}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 4 }}
                >
                  {loading
                    ? (mode === 'signin' ? 'Signing in…' : mode === 'signup' ? 'Creating account…' : 'Sending…')
                    : (mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset email')}
                </Button>
              </div>
            </form>

            {/* Mode switcher */}
            <p className="ff-signin-footer">
              {mode === 'signin' && (
                <>Don&apos;t have an account?{' '}
                  <a href="#" onClick={e => { e.preventDefault(); switchMode('signup') }}>Sign up</a>
                </>
              )}
              {mode === 'signup' && (
                <>Already have an account?{' '}
                  <a href="#" onClick={e => { e.preventDefault(); switchMode('signin') }}>Sign in</a>
                </>
              )}
              {mode === 'reset' && (
                <a href="#" onClick={e => { e.preventDefault(); switchMode('signin') }}>← Back to sign in</a>
              )}
            </p>

            <div className="ff-modal-actions" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 4 }}>
              <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
              <Link href="/workspace" style={{ textDecoration: 'none' }} onClick={onClose}>
                <Button variant="outline">Skip — Use Workspace</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
