import React from 'react'

import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import './ContactPage.css'

const SUPPORT_EMAIL = 'treanparentcharityupdates@gmail.com'

export function ContactPage() {
  return (
    <section className="contact-page" aria-labelledby="contact-title">
      <aside className="contact-map-panel" aria-label="Isomo support in Rwanda">
        <div className="contact-map-heading">
          <p>Isomo / Rwanda</p>
          <h1 id="contact-title">Learning support starts with one clear conversation.</h1>
        </div>

        <div className="contact-map-stage">
          <span className="contact-map-orbit contact-map-orbit-one" aria-hidden="true" />
          <span className="contact-map-orbit contact-map-orbit-two" aria-hidden="true" />
          <img src="/rwanda-map.svg" alt="Outline map of Rwanda" />
          <span className="contact-kigali-marker" aria-hidden="true"><i /></span>
          <p className="contact-kigali-label"><strong>Kigali</strong><span>Support connection</span></p>
        </div>

        <div className="contact-map-footer">
          <span>RW</span>
          <p>Connecting students, parents, and tutors with clearer learning support.</p>
        </div>
      </aside>

      <article className="contact-form-panel">
        <header>
          <p>Contact Isomo</p>
          <h2>How can we help?</h2>
          <span>Complete the form and your email application will open with the request ready to review.</span>
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

          <label>
            <span>What do you need help with?</span>
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
            <input name="Reference number" type="text" placeholder="Booking, course, payment, or dispute reference" />
          </label>

          <label>
            <span>Your message</span>
            <textarea name="Request details" rows="5" placeholder="Explain what happened and what help you need." required />
          </label>

          <div className="contact-form-footer">
            <p><DashboardIcon name="verification" size={16} /> Never include passwords or payment PINs.</p>
            <button className="primary-button" type="submit">Open email application</button>
          </div>
        </form>

        <p className="contact-email-line">Sending to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      </article>
    </section>
  )
}
