'use client'

import ContactForm from '../../components/ContactForm'
import AssetImage from '../../components/AssetImage'
import AmbientBackground from '../../components/AmbientBackground'

export default function ContactPage() {
  return (
    <div className="ff-page ff-page-flow ff-page-contact">
      <AmbientBackground />
      <div className="ff-page-flow-inner">
        <header className="ff-page-header">
          <span className="ff-icon-box">
            <AssetImage asset="nav-contact" size={24} alt="" />
          </span>
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
