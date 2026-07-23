import React from 'react'
import { Link } from 'react-router-dom'

import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import './ContactPage.css'

const supportTopics = [
  {
    icon: 'account',
    title: 'Account access',
    text: 'Sign-in, registration, account role, or profile questions.',
    subject: 'Isomo account support',
  },
  {
    icon: 'verification',
    title: 'Tutor verification',
    text: 'Documents, integrity agreement, teaching levels, or approval status.',
    subject: 'Isomo tutor verification support',
  },
  {
    icon: 'bookings',
    title: 'Bookings and payments',
    text: 'Lesson requests, schedule proposals, purchases, or payment records.',
    subject: 'Isomo booking or payment support',
  },
  {
    icon: 'disputes',
    title: 'Safety and disputes',
    text: 'Report a concern or ask for help with an existing dispute.',
    subject: 'Isomo safety or dispute support',
  },
]

function supportHref(subject) {
  return `mailto:support@isomo.rw?subject=${encodeURIComponent(subject)}`
}

export function ContactPage() {
  return (
    <div className="contact-page">
      <section className="contact-hero" aria-labelledby="contact-title">
        <div className="contact-hero-copy">
          <p className="contact-eyebrow">Contact Isomo</p>
          <h1 id="contact-title">Tell us where your learning journey needs support.</h1>
          <p>
            Choose the closest topic and include the details that help us understand the issue.
            Never send your password, payment PIN, or other private credentials.
          </p>
          <div className="contact-hero-actions">
            <a className="primary-button" href={supportHref('Isomo support request')}>
              <DashboardIcon name="messages" size={18} /> Email support
            </a>
            <Link className="secondary-button" to="/how-it-works">Read how Isomo works</Link>
          </div>
        </div>

        <aside className="contact-brief" aria-label="Information to include in a support request">
          <header><span>Before you send</span><h2>Help us understand it the first time.</h2></header>
          <ol>
            <li><span>01</span><p><strong>Your account email</strong><small>So the request can be connected to the correct account.</small></p></li>
            <li><span>02</span><p><strong>What you were trying to do</strong><small>For example, book a lesson or submit tutor documents.</small></p></li>
            <li><span>03</span><p><strong>Relevant reference details</strong><small>Include a booking, course, payment, or dispute reference if available.</small></p></li>
          </ol>
          <p className="contact-security-note"><DashboardIcon name="verification" size={17} /> Isomo support will never ask for your password.</p>
        </aside>
      </section>

      <section className="contact-topics" aria-labelledby="contact-topics-title">
        <header className="contact-section-heading">
          <div><p className="contact-eyebrow">Choose a support topic</p><h2 id="contact-topics-title">Send your request to the right context.</h2></div>
          <p>Each option opens your email application with a useful subject already added.</p>
        </header>

        <div className="contact-topic-grid">
          {supportTopics.map((topic, index) => (
            <article key={topic.title}>
              <div className="contact-topic-topline"><span>0{index + 1}</span><DashboardIcon name={topic.icon} size={21} /></div>
              <h3>{topic.title}</h3>
              <p>{topic.text}</p>
              <a href={supportHref(topic.subject)}>Email about this <span aria-hidden="true">-&gt;</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-compose" aria-labelledby="contact-compose-title">
        <div className="contact-compose-intro">
          <p className="contact-eyebrow">Write a complete request</p>
          <h2 id="contact-compose-title">Give support the useful details, without sharing sensitive information.</h2>
          <p>The form opens your device's email application. You can review everything before sending it.</p>
          <div className="contact-direct-email">
            <DashboardIcon name="messages" size={21} />
            <div><span>Direct support email</span><a href="mailto:support@isomo.rw">support@isomo.rw</a></div>
          </div>
        </div>

        <form
          className="contact-form"
          aria-label="Email Isomo support"
          action="mailto:support@isomo.rw?subject=Isomo%20support%20request"
          method="post"
          encType="text/plain"
        >
          <div className="contact-form-grid">
            <label><span>Full name</span><input name="Full name" type="text" autoComplete="name" required /></label>
            <label><span>Account email</span><input name="Account email" type="email" autoComplete="email" required /></label>
          </div>
          <label>
            <span>Support topic</span>
            <select name="Support topic" defaultValue="" required>
              <option value="" disabled>Select the closest topic</option>
              <option>Account access</option>
              <option>Tutor verification</option>
              <option>Bookings and payments</option>
              <option>Safety and disputes</option>
              <option>General question</option>
            </select>
          </label>
          <label><span>Reference number <small>Optional</small></span><input name="Reference number" type="text" placeholder="Booking, course, payment, or dispute reference" /></label>
          <label><span>What happened?</span><textarea name="Request details" rows="5" placeholder="Explain what you tried, what happened, and what help you need." required /></label>
          <div className="contact-form-footer">
            <p><DashboardIcon name="verification" size={16} /> Do not include passwords or payment PINs.</p>
            <button className="primary-button" type="submit">Open email application</button>
          </div>
        </form>
      </section>

      <section className="contact-faq" aria-labelledby="contact-faq-title">
        <header><p className="contact-eyebrow">Quick answers</p><h2 id="contact-faq-title">You may not need to wait for support.</h2></header>
        <div>
          <details><summary>Where can I find and compare tutors?</summary><p>Use the public tutor marketplace to filter by name, lesson, topic, level, price, rating, and availability.</p><Link to="/tutors">Open tutor search</Link></details>
          <details><summary>How do tutor applications work?</summary><p>Create a tutor account, upload the required verification documents and signed agreement, then wait for administrator review.</p><Link to="/join">Create a tutor account</Link></details>
          <details><summary>Can I understand Isomo before registering?</summary><p>Yes. Tutor discovery, course details, and the complete platform journey are available publicly.</p><Link to="/how-it-works">Read how it works</Link></details>
        </div>
      </section>
    </div>
  )
}
