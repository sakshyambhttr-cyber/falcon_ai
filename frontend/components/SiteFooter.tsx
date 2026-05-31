'use client'

import React from 'react'
import Link from 'next/link'
import { APP_NAME } from '../lib/brand'

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL

export default function SiteFooter() {
  // Evaluated at render time on both server and client — consistent
  const YEAR = new Date().getFullYear()
  return (
    <footer className="ff-site-footer" role="contentinfo">
      <p className="ff-site-footer-copy" suppressHydrationWarning>
        © {YEAR} {APP_NAME}. Built by Saksyam Bhattarai.
      </p>
      <nav className="ff-site-footer-links" aria-label="Footer navigation">
        <Link href="/privacy" className="ff-site-footer-link">Privacy</Link>
        <Link href="/terms" className="ff-site-footer-link">Terms</Link>
        <Link href="/contact" className="ff-site-footer-link">Contact</Link>
        {GITHUB_URL && (
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="ff-site-footer-link">
            GitHub
          </a>
        )}
      </nav>
    </footer>
  )
}
