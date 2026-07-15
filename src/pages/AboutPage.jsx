import React from 'react'

import { Page } from '../App'
import { InfoCard } from '../components/ui/PagePrimitives.jsx'
export function AboutPage() {
  return (
    <>
      <Page
        title="About"
        text="A trusted marketplace for affordable tutoring."
        action="Search tutors"
        secondary={{ to: '/how-it-works', label: 'How it works' }}
      />

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Mission</p>
          <h2>Help students find the right tutor quickly and affordably.</h2>
          <p className="supporting-text">
            Isomo keeps tutor discovery simple: search, compare, and request with confidence.
          </p>
        </article>

        <article className="panel card">
          <p className="eyebrow">Trust</p>
          <h2>Verified tutors stay visible only after review.</h2>
          <p className="supporting-text">
            Tutors upload documents, select the lessons they teach, and wait for admin approval.
          </p>
        </article>
      </section>

      <section className="benefits-grid">
        <InfoCard title="Students" text="Compare tutors by lesson, topic, and level." />
        <InfoCard title="Tutors" text="Show your qualifications and teaching focus." />
        <InfoCard title="Admins" text="Approve tutors and keep quality consistent." />
      </section>
    </>
  )
}
