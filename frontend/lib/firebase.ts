/**
 * MURF FALCON — FIREBASE v10 CONFIGURATION
 *
 * Firebase Authentication with:
 * - Email + Password Sign Up / Sign In
 * - Google OAuth
 * - Password Reset
 * - Session persistence (IndexedDB — survives page refresh)
 * - Graceful degradation when keys are not configured
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  type Auth,
  type User,
  type UserCredential
} from 'firebase/auth'

import { getFirestore, type Firestore } from 'firebase/firestore'

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/**
 * Returns true if Firebase is properly configured with real credentials.
 * Checks for presence of required keys and absence of placeholder values.
 */
export function isFirebaseConfigured(): boolean {
  const key = firebaseConfig.apiKey
  const domain = firebaseConfig.authDomain
  const project = firebaseConfig.projectId
  if (!key || !domain || !project) return false
  if (key.includes('your-') || key.includes('placeholder') || key.includes('xxx')) return false
  return true
}

// ─── INITIALIZATION ───────────────────────────────────────────────────────────

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)
    // Persist session across page refreshes using IndexedDB
    void setPersistence(auth, browserLocalPersistence)
  } catch (err) {
    console.error('[Firebase] Initialization failed:', err)
    app = null
    auth = null
    db = null
  }
}

export { auth, db, type User, type UserCredential }

// ─── GOOGLE AUTH ──────────────────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')

export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local')
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (err: any) {
    // Log the full error object for debugging (includes code/message/ctx)
    console.error('[Firebase] signInWithGoogle failed:', err)
    // Re-throw a cleaned-up error so UI can show the SDK message but logs keep full details
    const message = err?.message || 'Unknown Firebase error during Google sign-in'
    const code = err?.code || 'auth/internal-error'
    const e = new Error(`${message} (${code})`)
    // attach original for deeper inspection in dev
    ;(e as any).original = err
    throw e
  }
}

// ─── EMAIL / PASSWORD ─────────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase is not configured.')
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase is not configured.')
  const result = await createUserWithEmailAndPassword(auth, email, password)
  return result.user
}

// ─── PASSWORD RESET ───────────────────────────────────────────────────────────

export async function resetPassword(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase is not configured.')
  await sendPasswordResetEmail(auth, email)
}

// ─── SIGN OUT ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  if (!auth) return
  await firebaseSignOut(auth)
}

// ─── AUTH STATE LISTENER ──────────────────────────────────────────────────────

export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}
