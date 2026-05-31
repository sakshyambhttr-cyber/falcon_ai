import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="ff-page">
      <div className="ff-page-inner">
        <h1>Terms of Service</h1>
        <p className="ff-section-subtitle">
          Founder Falcon provides AI-generated startup intelligence for informational purposes. Outputs
          should be validated before business or investment decisions.
        </p>
        <p>
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
