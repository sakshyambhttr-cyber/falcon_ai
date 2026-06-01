'use client'

import React, { useState } from 'react'
import Button from './Button'
import { saveContactSubmission } from '../lib/contact-storage'

type FormState = {
  fullName: string
  email: string
  subject: string
  startupIdea: string
  message: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const SUBJECTS = [
  { value: '', label: 'Select a topic…' },
  { value: 'early-access', label: 'Early Access Request' },
  { value: 'partnership', label: 'Partnership Inquiry' },
  { value: 'feedback', label: 'Product Feedback' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'other', label: 'Other' },
]

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!values.fullName.trim() || values.fullName.trim().length < 2) {
    errors.fullName = 'Enter your full name.'
  }
  if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!values.subject) {
    errors.subject = 'Select a topic.'
  }
  if (!values.message.trim() || values.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters.'
  }
  return errors
}

export default function ContactForm() {
  const [values, setValues] = useState<FormState>({
    fullName: '',
    email: '',
    subject: '',
    startupIdea: '',
    message: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  function set(field: keyof FormState, value: string) {
    setValues(v => ({ ...v, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    await new Promise(r => setTimeout(r, 900))
    saveContactSubmission({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      startupIdea: values.startupIdea.trim() || undefined,
      message: `[${values.subject}] ${values.message.trim()}`
    })
    setSubmitting(false)
    setSuccess(true)
    setValues({ fullName: '', email: '', subject: '', startupIdea: '', message: '' })
  }

  if (success) {
    return (
      <div className="ff-contact-success-card">
        <div className="ff-contact-success-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3>Message received</h3>
        <p>Thanks for reaching out. We read every message and will follow up at <strong>{values.email || 'your email'}</strong> within 1–2 business days.</p>
        <Button variant="outline" onClick={() => setSuccess(false)}>
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <form className="ff-contact-form-v2" onSubmit={handleSubmit} noValidate>
      <div className="ff-contact-row-2">
        <div className="ff-contact-field">
          <label htmlFor="cf-name">Full Name <span aria-hidden="true">*</span></label>
          <input
            id="cf-name"
            type="text"
            autoComplete="name"
            placeholder="Jane Founder"
            value={values.fullName}
            onChange={e => set('fullName', e.target.value)}
            className={errors.fullName ? 'ff-input-error' : ''}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'cf-name-err' : undefined}
          />
          {errors.fullName && <span id="cf-name-err" className="ff-contact-field-error" role="alert">{errors.fullName}</span>}
        </div>

        <div className="ff-contact-field">
          <label htmlFor="cf-email">Email Address <span aria-hidden="true">*</span></label>
          <input
            id="cf-email"
            type="email"
            autoComplete="email"
            placeholder="you@startup.com"
            value={values.email}
            onChange={e => set('email', e.target.value)}
            className={errors.email ? 'ff-input-error' : ''}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'cf-email-err' : undefined}
          />
          {errors.email && <span id="cf-email-err" className="ff-contact-field-error" role="alert">{errors.email}</span>}
        </div>
      </div>

      <div className="ff-contact-field">
        <label htmlFor="cf-subject">Topic <span aria-hidden="true">*</span></label>
        <select
          id="cf-subject"
          value={values.subject}
          onChange={e => set('subject', e.target.value)}
          className={errors.subject ? 'ff-input-error' : ''}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'cf-subject-err' : undefined}
        >
          {SUBJECTS.map(s => (
            <option key={s.value} value={s.value} disabled={s.value === ''}>
              {s.label}
            </option>
          ))}
        </select>
        {errors.subject && <span id="cf-subject-err" className="ff-contact-field-error" role="alert">{errors.subject}</span>}
      </div>

      <div className="ff-contact-field">
        <label htmlFor="cf-idea">
          Startup Idea
          <span className="ff-contact-field-optional">optional</span>
        </label>
        <input
          id="cf-idea"
          type="text"
          placeholder="e.g. AI platform for scholarship matching…"
          value={values.startupIdea}
          onChange={e => set('startupIdea', e.target.value)}
        />
      </div>

      <div className="ff-contact-field">
        <label htmlFor="cf-message">
          Message <span aria-hidden="true">*</span>
          <span className="ff-contact-char-count">{values.message.length}/1000</span>
        </label>
        <textarea
          id="cf-message"
          rows={5}
          placeholder="Tell us how Founder Falcon can help, or share your feedback…"
          value={values.message}
          onChange={e => set('message', e.target.value.slice(0, 1000))}
          className={errors.message ? 'ff-input-error' : ''}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'cf-message-err' : undefined}
        />
        {errors.message && <span id="cf-message-err" className="ff-contact-field-error" role="alert">{errors.message}</span>}
      </div>

      <div className="ff-contact-submit-row">
        <p className="ff-contact-privacy-note">
          We store your message locally and never share your data with third parties.
        </p>
        <Button variant="primary" type="submit" disabled={submitting} className="ff-contact-submit-btn">
          {submitting ? (
            <span className="ff-btn-loading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"
                  strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate"
                    from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                </circle>
              </svg>
              Sending…
            </span>
          ) : (
            'Send Message →'
          )}
        </Button>
      </div>
    </form>
  )
}
