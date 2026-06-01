'use client'

/**
 * FOUNDER FALCON — SPEECH INPUT HOOK
 *
 * Provides real-time speech-to-text using the Web Speech API.
 * Transcript appears live as the user speaks.
 *
 * ARCHITECTURE NOTES (important for correctness):
 *
 * - SpeechRecognition is created fresh on each start() call and torn down on
 *   stop()/clear()/unmount. There is never more than one active instance.
 *
 * - finalTranscriptRef accumulates ONLY within a single recording session.
 *   It is reset to '' at the top of every start() call so that re-starting
 *   never doubles up previous results.
 *
 * - The hook exposes `transcript` (read-only state) and `setExternalText`
 *   (one-way write from parent). The parent must NOT feed `transcript` back
 *   into `append()` — that creates a feedback loop. The parent should only
 *   read `transcript` and write its own state from it.
 *
 * - React StrictMode mounts components twice in development. The cleanup
 *   function in useEffect aborts any live recognition so the second mount
 *   starts clean.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechInputPhase = 'idle' | 'listening' | 'processing' | 'ready' | 'error'

export type SpeechInputState = {
  /** Final + interim transcript text from the current/last session */
  transcript: string
  /** Current phase of the mic input */
  phase: SpeechInputPhase
  /** Error message if phase === 'error' */
  errorMessage: string | null
  /** Whether the browser supports Web Speech API */
  isSupported: boolean
  /** Start a new recording session (resets transcript) */
  start: () => void
  /** Stop the current recording session gracefully */
  stop: () => void
  /** Abort recording and reset everything to idle */
  clear: () => void
}

// ─── BROWSER COMPAT ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any

function getSpeechRecognitionClass(): (new () => SR) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (
    (w['SpeechRecognition'] as (new () => SR) | undefined) ??
    (w['webkitSpeechRecognition'] as (new () => SR) | undefined) ??
    null
  )
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useSpeechInput(): SpeechInputState {
  const [transcript, setTranscript] = useState('')
  const [phase, setPhase] = useState<SpeechInputPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Single recognition instance — never recreated mid-session
  const recognitionRef = useRef<SR | null>(null)
  // Accumulates final results within the current session only
  const finalRef = useRef('')
  // Guards against double-start (StrictMode, rapid clicks)
  const activeRef = useRef(false)

  // Detect support once — stable across renders
  const isSupported = useRef(getSpeechRecognitionClass() !== null)

  // ─── CLEANUP ON UNMOUNT ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      activeRef.current = false
      if (recognitionRef.current) {
        recognitionRef.current.onstart   = null
        recognitionRef.current.onresult  = null
        recognitionRef.current.onerror   = null
        recognitionRef.current.onend     = null
        try { recognitionRef.current.abort() } catch { /* ignore */ }
        recognitionRef.current = null
      }
    }
  }, [])

  // ─── START ──────────────────────────────────────────────────────────────────

  const start = useCallback(() => {
    ;(async () => {
      const SpeechRecognitionClass = getSpeechRecognitionClass()

      if (!SpeechRecognitionClass) {
        setPhase('error')
        setErrorMessage('Speech recognition is not supported in this browser. Try Chrome or Edge.')
        return
      }

      // Proactively request microphone permission via getUserMedia. Some
      // browsers only show a permission prompt when media is requested and
      // this improves reliability for SpeechRecognition start(). If the user
      // denies access, show a helpful message.
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true })
        }
      } catch (err) {
        setPhase('error')
        setErrorMessage('Microphone permission was denied. Allow microphone access in your browser settings and try again.')
        return
      }

    // Prevent double-start
    if (activeRef.current) return

    // Tear down any previous instance cleanly before creating a new one
    if (recognitionRef.current) {
      recognitionRef.current.onstart  = null
      recognitionRef.current.onresult = null
      recognitionRef.current.onerror  = null
      recognitionRef.current.onend    = null
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    // Reset session transcript — critical: prevents accumulation across sessions
    finalRef.current = ''
    setTranscript('')
    setErrorMessage(null)

    const recognition = new SpeechRecognitionClass()
    recognitionRef.current = recognition

    recognition.continuous      = true   // keep listening until stop() is called
    recognition.interimResults  = true   // show partial results live
    recognition.lang            = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      activeRef.current = true
      setPhase('listening')
      setErrorMessage(null)
    }

    recognition.onresult = (event: SR) => {
      let interim = ''

      // Only process results from this event batch (event.resultIndex onwards)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          // Append to session-scoped accumulator — never the full transcript state
          finalRef.current += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      // Transcript = finalized text + current interim (display only)
      const combined = (finalRef.current + interim).trim()
      setTranscript(combined)
    }

    recognition.onerror = (event: SR) => {
      // 'no-speech' and 'aborted' are not real errors
      if (event.error === 'no-speech') return
      if (event.error === 'aborted') return

      activeRef.current = false

      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setPhase('error')
        setErrorMessage('Microphone access was denied. Allow microphone permissions in your browser settings.')
        return
      }

      setPhase('error')
      setErrorMessage(`Speech recognition error: ${event.error}. Please try again.`)
    }

    recognition.onend = () => {
      activeRef.current = false

      // Transition to ready if we captured anything, otherwise back to idle
      if (finalRef.current.trim()) {
        setTranscript(finalRef.current.trim())
        setPhase('ready')
      } else {
        setPhase('idle')
      }
    }

      try {
        recognition.start()
      } catch {
        activeRef.current = false
        setPhase('error')
        setErrorMessage('Could not start microphone. Please check permissions and try again.')
      }
    })()
  }, []) // No dependencies — getSpeechRecognitionClass() is called inside, not captured

  // ─── STOP ───────────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    if (!recognitionRef.current || !activeRef.current) return
    setPhase('processing')
    try { recognitionRef.current.stop() } catch { /* ignore */ }
  }, [])

  // ─── CLEAR ──────────────────────────────────────────────────────────────────

  const clear = useCallback(() => {
    activeRef.current = false
    finalRef.current = ''

    if (recognitionRef.current) {
      recognitionRef.current.onstart  = null
      recognitionRef.current.onresult = null
      recognitionRef.current.onerror  = null
      recognitionRef.current.onend    = null
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    setTranscript('')
    setPhase('idle')
    setErrorMessage(null)
  }, [])

  return {
    transcript,
    phase,
    errorMessage,
    isSupported: isSupported.current,
    start,
    stop,
    clear,
  }
}
