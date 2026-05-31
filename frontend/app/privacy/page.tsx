import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="ff-page">
      <div className="ff-page-inner">
        <h1>Privacy Policy</h1>
        <p className="ff-section-subtitle">
          Murf Falcon respects your privacy. Startup ideas submitted through the workspace are processed
          to generate intelligence outputs and are not sold to third parties.
        </p>
        <p>
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
