import React, { useEffect, useRef, useState } from 'react'

import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import rwandaMapMarkup from '../assets/rwanda.svg?raw'
import './ContactPage.css'

const SUPPORT_EMAIL = 'treanparentcharityupdates@gmail.com'

function InteractiveRwandaMap() {
  const mapRef = useRef(null)
  const [selectedProvince, setSelectedProvince] = useState('Select a province')

  useEffect(() => {
    mapRef.current?.querySelectorAll('path[id^="RW-"]').forEach((path) => {
      const province = path.getAttribute('title') || path.id
      path.setAttribute('tabindex', '0')
      path.setAttribute('role', 'button')
      path.setAttribute('aria-label', province)
      path.classList.toggle('is-selected', province === selectedProvince)
    })
  }, [selectedProvince])

  function selectProvince(target) {
    const path = target.closest?.('path[id^="RW-"]')
    if (path && mapRef.current?.contains(path)) {
      setSelectedProvince(path.getAttribute('title') || path.id)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectProvince(event.target)
    }
  }

  return (
    <div className="contact-map-stage">
      <span className="contact-map-orbit contact-map-orbit-one" aria-hidden="true" />
      <span className="contact-map-orbit contact-map-orbit-two" aria-hidden="true" />
      <div
        ref={mapRef}
        className="contact-map-svg"
        onClick={(event) => selectProvince(event.target)}
        onKeyDown={handleKeyDown}
        // This trusted local SVG is inline so its province paths can receive input.
        dangerouslySetInnerHTML={{ __html: rwandaMapMarkup }}
      />
      <p className="contact-map-selection" aria-live="polite"><span>Selected province</span><strong>{selectedProvince}</strong></p>
    </div>
  )
}

export function ContactPage() {
  return (
    <section className="contact-page" aria-labelledby="contact-title">
      <aside className="contact-map-panel" aria-label="Isomo support in Rwanda">
        <div className="contact-map-heading">
          <p>Isomo / Rwanda</p>
          <h1 id="contact-title">Learning support starts with one clear conversation.</h1>
        </div>

        <InteractiveRwandaMap />

        <div className="contact-map-footer">
          <span>RW</span>
          <p>Connecting students, parents, and tutors with clearer learning support.</p>
        </div>
      </aside>

      <article className="contact-form-panel">
        <header>
          <p>Contact Isomo</p>
          <h2>How can we help?</h2>
          <span>Complete the form and review the message in your email application before sending it to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</span>
        </header>

        <form
          className="contact-form"
          aria-label="Email Isomo support"
          action={`mailto:${SUPPORT_EMAIL}?subject=Isomo%20support%20request`}
          method="post"
          encType="text/plain"
        >
          <div className="contact-form-grid">
            <label>
              <span>Full name</span>
              <input name="Full name" type="text" autoComplete="name" placeholder="Your full name" required />
            </label>
            <label>
              <span>Email address</span>
              <input name="Email address" type="email" autoComplete="email" placeholder="name@example.com" required />
            </label>
          </div>

          <div className="contact-form-grid">
            <label>
              <span>Support topic</span>
              <select name="Support topic" defaultValue="" required>
                <option value="" disabled>Select a support topic</option>
                <option>Account access</option>
                <option>Tutor verification</option>
                <option>Bookings and schedules</option>
                <option>Courses and assessments</option>
                <option>Payments and earnings</option>
                <option>Safety and disputes</option>
                <option>General question</option>
              </select>
            </label>
            <label>
              <span>Reference number <small>Optional</small></span>
              <input name="Reference number" type="text" placeholder="Booking, course, or payment ID" />
            </label>
          </div>

          <label>
            <span>Your message</span>
            <textarea name="Request details" rows="4" placeholder="Explain what happened and what help you need." required />
          </label>

          <div className="contact-form-footer">
            <p><DashboardIcon name="verification" size={16} /> Never include passwords or payment PINs.</p>
            <button className="primary-button" type="submit">Open email application</button>
          </div>
        </form>

      </article>
    </section>
  )
}
