import React from 'react'

import { Page } from '../App'
import { MinimalList } from '../components/ui/PagePrimitives.jsx'

const supportTopics = [
  'Tutor account approval',
  'Document upload support',
  'Lesson and pricing updates',
  'Student matching help',
]
export function ContactPage() {
  return (
    <>
      <Page
        title="Contact"
        text="Reach the team for support or onboarding help."
        action="Contact support"
        secondary={{ to: '/about', label: 'About' }}
      />

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Support</p>
          <h2>We reply to student, tutor, and admin questions.</h2>
          <MinimalList
            items={[
              'Email: support@isomo.rw',
              'Phone: +250 7xx xxx xxx',
              'WhatsApp: Available for quick help',
            ]}
          />
        </article>

        <article className="panel card">
          <p className="eyebrow">Help topics</p>
          <h2>Common reasons people contact us.</h2>
          <MinimalList items={supportTopics} />
        </article>
      </section>

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Send a message</p>
          <h2>Tell us what you need.</h2>
          <div className="steps-list">
            <input type="text" placeholder="Your name" aria-label="Your name" />
            <input type="email" placeholder="Email address" aria-label="Email address" />
            <select aria-label="Topic">
              <option>Student help</option>
              <option>Tutor approval</option>
              <option>General support</option>
            </select>
            <textarea rows="4" placeholder="Message" aria-label="Message" />
            <button className="primary-button" type="button">
              Send message
            </button>
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">Who we help</p>
          <h2>Support stays focused on the platform users.</h2>
          <MinimalList
            items={[
              'Students looking for tutors',
              'Tutors managing approvals',
              'Admins handling reviews',
            ]}
          />
        </article>
      </section>
    </>
  )
}
