'use client'

import ContactForm from '../../components/ContactForm'
import AssetImage from '../../components/AssetImage'

export default function ContactPage() {
  return (
    <div className="ff-page ff-page-contact">
      <div className="ff-page-inner">
        <header className="ff-page-header">
          <AssetImage asset="nav-contact" size={32} alt="" />
          <div>
            <h1>Contact Founder Falcon</h1>
            <p>Partnerships, feedback, and early access — we read every message.</p>
          </div>
        </header>
        <ContactForm />
      </div>
    </div>
  )
}
