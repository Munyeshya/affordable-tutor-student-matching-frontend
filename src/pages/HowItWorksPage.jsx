import React from 'react'
import { Link } from 'react-router-dom'

import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import './HowItWorksPage.css'

const journeys = [
  {
    role: 'Students',
    icon: 'students',
    summary: 'Find support that fits the subject, level, schedule, and budget.',
    steps: [
      { title: 'Discover', text: 'Search verified tutors or browse complete courses.', icon: 'search' },
      { title: 'Compare', text: 'Check teaching focus, ratings, availability, and price.', icon: 'reviews' },
      { title: 'Book or buy', text: 'Request a lesson or purchase the right course.', icon: 'bookings' },
      { title: 'Learn and measure', text: 'Complete learning, assessments, and a review.', icon: 'assessments' },
    ],
  },
  {
    role: 'Parents',
    icon: 'account',
    summary: 'Arrange trusted learning support and follow formally linked students.',
    steps: [
      { title: 'Link a student', text: 'Connect the learner whose support you manage.', icon: 'students' },
      { title: 'Choose support', text: 'Compare suitable tutors, courses, and prices.', icon: 'courses' },
      { title: 'Confirm payment', text: 'Complete the guided payment flow when required.', icon: 'payments' },
      { title: 'Follow progress', text: 'Read booking updates, outcomes, and reports.', icon: 'reports' },
    ],
  },
  {
    role: 'Tutors',
    icon: 'courses',
    summary: 'Build a credible teaching presence and manage learners professionally.',
    steps: [
      { title: 'Create an account', text: 'Add accurate personal and teaching details.', icon: 'account' },
      { title: 'Get verified', text: 'Submit qualifications, ID, and the signed agreement.', icon: 'verification' },
      { title: 'Publish teaching', text: 'Create lessons, courses, outcomes, and availability.', icon: 'courses' },
      { title: 'Teach and report', text: 'Manage bookings, progress, reviews, and earnings.', icon: 'earnings' },
    ],
  },
]

const learningCycle = [
  { number: '01', title: 'Starting point', text: 'The tutor records the learner’s initial level and expected knowledge outcomes.' },
  { number: '02', title: 'Active learning', text: 'Lessons, schedule updates, course activity, and progress stay connected.' },
  { number: '03', title: 'Outcome check', text: 'A final assessment records what changed after the agreed learning period.' },
  { number: '04', title: 'Visible progress', text: 'Reports present growth clearly for the student and formally linked parent.' },
]

const trustPoints = [
  { icon: 'verification', title: 'Verified before visible', text: 'Tutor profiles appear publicly only after administrator review.' },
  { icon: 'payments', title: 'Price before commitment', text: 'Students compare lesson and course costs before choosing.' },
  { icon: 'reports', title: 'Progress after learning', text: 'Assessments and reports turn activity into understandable outcomes.' },
]

function JourneyLane({ journey }) {
  return (
    <article className="how-journey-lane">
      <header className="how-lane-header">
        <span className="how-icon-box"><DashboardIcon name={journey.icon} size={22} /></span>
        <div>
          <p>{journey.role}</p>
          <h3>{journey.summary}</h3>
        </div>
      </header>

      <ol className="how-lane-steps">
        {journey.steps.map((step, index) => (
          <li key={step.title}>
            <span className="how-step-index">0{index + 1}</span>
            <span className="how-step-icon"><DashboardIcon name={step.icon} size={18} /></span>
            <div><strong>{step.title}</strong><p>{step.text}</p></div>
          </li>
        ))}
      </ol>
    </article>
  )
}

export function HowItWorksPage() {
  return (
    <div className="how-page">
      <section className="how-hero" aria-labelledby="how-title">
        <div className="how-hero-copy">
          <p className="how-eyebrow">How Isomo works</p>
          <h1 id="how-title">One clear path from “I need help” to “I can do this.”</h1>
          <p className="how-hero-text">
            Tell us what you want to learn, compare verified support by fit and price, then follow
            your progress from the first assessment to the final outcome.
          </p>
          <div className="how-actions">
            <Link className="primary-button" to="/tutors"><DashboardIcon name="search" size={18} /> Find a tutor</Link>
            <Link className="secondary-button" to="/courses"><DashboardIcon name="courses" size={18} /> Browse courses</Link>
          </div>
          <p className="how-hero-note"><DashboardIcon name="verification" size={17} /> Browse publicly. Sign in only when you are ready to request or buy.</p>
        </div>

        <aside className="how-match-visual" aria-label="Example of building a tutor match">
          <header className="how-match-heading">
            <span>Start here</span>
            <strong>Build your match</strong>
          </header>

          <div className="how-match-step">
            <span className="how-match-number">01</span>
            <div><small>I want to learn</small><strong>Mathematics</strong><p>Upper secondary / Algebra</p></div>
            <DashboardIcon name="courses" size={20} />
          </div>

          <div className="how-match-connector" aria-hidden="true"><span /></div>

          <div className="how-match-step">
            <span className="how-match-number">02</span>
            <div><small>My preferred fit</small><strong>Evenings / Online</strong><p>Within my selected budget</p></div>
            <DashboardIcon name="schedule" size={20} />
          </div>

          <div className="how-match-connector" aria-hidden="true"><span /></div>

          <div className="how-match-result">
            <span className="how-result-icon"><DashboardIcon name="verification" size={22} /></span>
            <div><small>Your result</small><strong>Verified matches</strong><p>Clear prices, availability, and lesson focus.</p></div>
            <span className="how-result-arrow" aria-hidden="true">→</span>
          </div>

          <p className="how-match-caption">You stay in control until you choose.</p>
        </aside>
      </section>

      <section className="how-journeys" aria-labelledby="journeys-title">
        <header className="how-section-heading">
          <div><p className="how-eyebrow">Choose your path</p><h2 id="journeys-title">One platform, three clear journeys.</h2></div>
          <p>Each account sees the tools and records relevant to its role.</p>
        </header>
        <div className="how-journey-list">
          {journeys.map((journey) => <JourneyLane journey={journey} key={journey.role} />)}
        </div>
      </section>

      <section className="how-trust-band" aria-label="Platform trust principles">
        {trustPoints.map((point) => (
          <article key={point.title}>
            <DashboardIcon name={point.icon} size={22} />
            <div><h3>{point.title}</h3><p>{point.text}</p></div>
          </article>
        ))}
      </section>

      <section className="how-impact" aria-labelledby="impact-title">
        <div className="how-impact-intro">
          <p className="how-eyebrow">Beyond the booking</p>
          <h2 id="impact-title">Learning support should show what changed.</h2>
          <p>
            A completed payment or lesson is not the final result. Isomo keeps the learner’s starting
            point, teaching activity, and final outcome connected so progress can be understood.
          </p>
          <div className="how-affordability-note">
            <DashboardIcon name="payments" size={22} />
            <div><strong>Affordability remains visible</strong><span>Compare prices first, then choose the support that fits.</span></div>
          </div>
        </div>

        <ol className="how-cycle">
          {learningCycle.map((item) => (
            <li key={item.number}>
              <span>{item.number}</span>
              <div><h3>{item.title}</h3><p>{item.text}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="how-faq" aria-labelledby="faq-title">
        <header className="how-section-heading">
          <div><p className="how-eyebrow">Common questions</p><h2 id="faq-title">Know what happens before you begin.</h2></div>
        </header>
        <div className="how-faq-list">
          <details>
            <summary>Can I explore tutors and courses before creating an account?</summary>
            <p>Yes. Discovery and course details are public. An account is required when you send a request, propose a schedule, purchase, or manage learning records.</p>
          </details>
          <details>
            <summary>How does Isomo verify tutors?</summary>
            <p>Tutors submit identity and qualification documents, a signed integrity agreement, and their teaching levels. Administrators review these before making a profile visible.</p>
          </details>
          <details>
            <summary>What happens if the listed availability does not fit?</summary>
            <p>A logged-in student or parent can propose a custom schedule. The tutor may accept it, reject it, or return a counter-offer without overriding already booked slots.</p>
          </details>
          <details>
            <summary>Who can see a student’s progress?</summary>
            <p>The student, connected tutors for their teaching records, formally linked parents, and explicitly authorized administrators can access the relevant information.</p>
          </details>
        </div>
      </section>

      <section className="how-cta">
        <div><p className="how-eyebrow">Ready when you are</p><h2>Start with the learning support you need today.</h2></div>
        <div className="how-actions">
          <Link className="primary-button" to="/tutors">Find a tutor</Link>
          <Link className="how-text-link" to="/join">Create an account <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </div>
  )
}
