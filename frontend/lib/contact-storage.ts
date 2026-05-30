export type ContactSubmission = {
  id: string
  fullName: string
  email: string
  startupIdea?: string
  message: string
  createdAt: number
}

const STORAGE_KEY = 'ff_contact_submissions'

export function saveContactSubmission(
  data: Omit<ContactSubmission, 'id' | 'createdAt'>
): ContactSubmission {
  const entry: ContactSubmission = {
    ...data,
    id: `msg-${Date.now()}`,
    createdAt: Date.now()
  }

  if (typeof window === 'undefined') return entry

  const existing = getContactSubmissions()
  existing.unshift(entry)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 50)))
  return entry
}

export function getContactSubmissions(): ContactSubmission[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ContactSubmission[]) : []
  } catch {
    return []
  }
}
