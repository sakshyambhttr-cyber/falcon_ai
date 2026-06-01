'use client'

import ContactForm from '../../components/ContactForm'
import AmbientBackground from '../../components/AmbientBackground'
import Link from 'next/link'

const CONTACT_ITEMS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: 'Email',
    value: 'hello@founderfalcon.ai',
    sub: 'We reply within 1–2 business days'
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: 'Response time',
    value: '< 48 hours',
    sub: 'Monday – Friday'
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: 'Early access',
    value: 'Now open',
    sub: 'Limited spots available'
  },
]

export default function ContactPage() {
  return (
    <div className="ff-contact-page">
      <AmbientBackground />

      <div className="ff-contact-layout">

        {/* ── Left: info panel ── */}
        <aside className="ff-contact-info">
          <div className="ff-contact-info-inner">
            <span className="ff-section-label">Get in touch</span>
            <h1 className="ff-contact-title">We&apos;d love to hear from you</h1>
            <p className="ff-contact-lead">
              Whether you&apos;re looking for early access, want to partner, or just have feedback —
              every message goes directly to the founding team.
            </p>

            <div className="ff-contact-info-items">
              {CONTACT_ITEMS.map(item => (
                <div key={item.label} className="ff-contact-info-item">
                  <span className="ff-contact-info-icon" aria-hidden="true">{item.icon}</span>
                  <div>
                    <span className="ff-contact-info-label">{item.label}</span>
                    <strong className="ff-contact-info-value">{item.value}</strong>
                    <span className="ff-contact-info-sub">{item.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="ff-contact-info-cta">
              <p>Want to try Falcon first?</p>
              <Link href="/workspace" className="ff-contact-try-link">
                Launch the workspace →
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Right: form ── */}
        <main className="ff-contact-form-panel" id="main-content">
          <div className="ff-contact-form-card">
            <div className="ff-contact-form-header">
              <h2>Send a message</h2>
              <p>Fill in the form and we&apos;ll get back to you shortly.</p>
            </div>
            <ContactForm />
          </div>
        </main>

      </div>
    </div>
  )
}
