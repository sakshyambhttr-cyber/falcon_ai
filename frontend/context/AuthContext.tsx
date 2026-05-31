'use client'

/**
 * MURF FALCON — AUTH CONTEXT
 *
 * Centralized auth state management. Provides:
 * - Current user object
 * - Auth status (loading / authenticated / unauthenticated)
 * - Firebase readiness flag
 * - No prop drilling — consume with useAuth() anywhere
 *
 * Session persists across page refreshes via Firebase IndexedDB persistence.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react'
import { onAuthChange, isFirebaseConfigured, handleRedirectResult, type User } from '../lib/firebase'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthContextValue = {
  user: User | null
  status: AuthStatus
  isLoading: boolean
  isAuthenticated: boolean
  isFirebaseReady: boolean
  /** Display name or email prefix for UI */
  displayName: string
  /** First letter of display name for avatar */
  userInitial: string
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: 'loading',
  isLoading: true,
  isAuthenticated: false,
  isFirebaseReady: false,
  displayName: '',
  userInitial: '?',
})

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const firebaseReady = isFirebaseConfigured()

  useEffect(() => {
    if (!firebaseReady) {
      setStatus('unauthenticated')
      return
    }

    // Handle redirect result first (for Google sign-in redirect flow on localhost)
    void handleRedirectResult()

    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser)
      setStatus(firebaseUser ? 'authenticated' : 'unauthenticated')
    })

    return unsubscribe
  }, [firebaseReady])

  const displayName =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    ''

  const userInitial =
    user?.displayName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    '?'

  const value: AuthContextValue = {
    user,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isFirebaseReady: firebaseReady,
    displayName,
    userInitial,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

export default AuthContext
