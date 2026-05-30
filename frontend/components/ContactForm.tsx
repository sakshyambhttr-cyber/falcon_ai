'use client'

import React, { useState } from 'react'
import Button from './Button'
import Card from './Card'
import { saveContactSubmission } from '../lib/contact-storage'

type FormState = {
  fullName: string
  email: string
  startupIdea: string
  message: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!values.fullName.trim() || values.fullName.trim().length < 2) {
    errors.fullName = 'Enter your full name (min 2 characters).'
  }
  if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.'
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
    startupIdea: '',
    message: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

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
      message: values.message.trim()
    })
    setSubmitting(false)
    setSuccess(true)
    setValues({ fullName: '', email: '', startupIdea: '', message: '' })
  }

  return (
    <Card className="ff-contact-card">
      {success ? (
        <div className="ff-contact-success">
          <strong>Message received</strong>
          <p>Thanks — your note is saved locally. Our team will follow up at your email.</p>
          <Button variant="outline" onClick={() => setSuccess(false)}>
            Send another
          </Button>
        </div>
      ) : (
        <form className="ff-contact-form" onSubmit={handleSubmit} noValidate>
          <label className="ff-field">
            <span>Full Name</span>
            <input
              className={errors.fullName ? 'ff-input-error' : ''}
              value={values.fullName}
              onChange={e => setValues(v => ({ ...v, fullName: e.target.value }))}
              placeholder="Jane Founder"
            />
            {errors.fullName && <em>{errors.fullName}</em>}
          </label>

          <label className="ff-field">
            <span>Email Address</span>
            <input
              type="email"
              className={errors.email ? 'ff-input-error' : ''}
              value={values.email}
              onChange={e => setValues(v => ({ ...v, email: e.target.value }))}
              placeholder="you@startup.com"
            />
            {errors.email && <em>{errors.email}</em>}
          </label>

          <label className="ff-field">
            <span>Startup Idea (optional)</span>
            <input
              value={values.startupIdea}
              onChange={e => setValues(v => ({ ...v, startupIdea: e.target.value }))}
              placeholder="AI platform for scholarship matching…"
            />
          </label>

          <label className="ff-field">
            <span>Message</span>
            <textarea
              className={errors.message ? 'ff-input-error' : ''}
              rows={5}
              value={values.message}
              onChange={e => setValues(v => ({ ...v, message: e.target.value }))}
              placeholder="Tell us how Founder Falcon can help…"
            />
            {errors.message && <em>{errors.message}</em>}
          </label>

          <Button variant="primary" type="submit" disabled={submitting} className="ff-contact-submit">
            {submitting ? (
              <span className="ff-btn-loading">
                <span />
                Sending…
              </span>
            ) : (
              'Send Message'
            )}
          </Button>
        </form>
      )}
    </Card>
  )
}
