import React from 'react'

import { Page } from '../App'
import { InfoCard, MinimalList } from '../components/ui/PagePrimitives.jsx'

const howItWorksSteps = [
  { title: 'Search', text: 'Find tutors by name, lesson, topic, or level.' },
  { title: 'Compare', text: 'Review documents, ratings, and lesson pricing.' },
  { title: 'Request', text: 'Send a request and wait for approval.' },
  { title: 'Learn', text: 'Take the lesson and rate the tutor after.' },
]
export function HowItWorksPage() {
  return (
    <>
      <Page
        title="How it works"
        text="Search, compare, request, and learn in just a few taps."
        action="Start searching"
        secondary={{ to: '/join', label: 'Become a tutor' }}
      />

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Student flow</p>
          <h2>Four simple steps.</h2>
          <div className="steps-list">
            {howItWorksSteps.map((step, index) => (
              <div className="step-item" key={step.title}>
                <div className="step-number">0{index + 1}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">Tutor flow</p>
          <h2>Keep the process clear before approval.</h2>
          <p className="supporting-text">
            Tutors upload qualifications, choose lessons and levels, then wait for admin review.
          </p>
          <MinimalList
            items={[
              'Create account',
              'Upload documents',
              'Choose lessons and levels',
              'Get approved by admin',
            ]}
          />
        </article>
      </section>

      <section className="benefits-grid">
        <InfoCard title="FAQ" text="Approval usually follows document review. Ratings are lesson-specific. Search works by name, lesson, topic, and level." />
        <InfoCard title="FAQ" text="After booking, the tutor and student continue inside their accounts. Tutors submit ID, certificates, agreement form, and lesson list." />
        <InfoCard title="FAQ" text="Admin reviews documents and lesson coverage before tutors become visible." />
      </section>
    </>
  )
}
