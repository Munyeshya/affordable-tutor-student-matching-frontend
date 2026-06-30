import React from 'react'
import { Link } from 'react-router-dom'
import { Page } from './App'

const tutorCards = [
  { name: 'Aline M.', lesson: 'Mathematics', level: 'Lower secondary', price: 'From $8 / lesson' },
  { name: 'Jean P.', lesson: 'English', level: 'Upper secondary', price: 'From $7 / lesson' },
  { name: 'Diane K.', lesson: 'Computer', level: 'University', price: 'From $10 / lesson' },
]

const howItWorksSteps = [
  { title: 'Search', text: 'Find tutors by name, lesson, topic, or level.' },
  { title: 'Compare', text: 'Review documents, ratings, and lesson pricing.' },
  { title: 'Request', text: 'Send a request and wait for approval.' },
  { title: 'Learn', text: 'Take the lesson and rate the tutor after.' },
]

const joinChecklist = [
  'Qualification documents',
  'Signed agreement form',
  'Lessons and levels taught',
  'Profile photo and bio',
]

const supportTopics = [
  'Tutor account approval',
  'Document upload support',
  'Lesson and pricing updates',
  'Student matching help',
]

const signInRoles = [
  'Student dashboard access',
  'Tutor profile and lesson management',
  'Admin review and approval tools',
]

function CompactCard({ title, text }) {
  return (
    <article className="info-card card">
      <p className="eyebrow">{title}</p>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

function MinimalList({ items }) {
  return (
    <div className="mini-list">
      {items.map((item) => (
        <div key={item}>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

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
        <CompactCard title="Students" text="Compare tutors by lesson, topic, and level." />
        <CompactCard title="Tutors" text="Show your qualifications and teaching focus." />
        <CompactCard title="Admins" text="Approve tutors and keep quality consistent." />
      </section>
    </>
  )
}

export function TutorsPage() {
  return (
    <>
      <Page
        title="Tutors"
        text="Browse tutors by name, lesson, topic, and level."
        action="Join now"
        secondary={{ to: '/join', label: 'Become a tutor' }}
      />

      <section className="card trust-section">
        <div className="section-heading section-heading-center">
          <div>
            <p className="eyebrow">Search</p>
            <h2>Find the right tutor faster.</h2>
          </div>
          <p className="section-text section-text-center">
            Tutors are organized by lesson focus, education level, and pricing.
          </p>
        </div>

        <div className="trust-marks">
          <span className="trust-mark">By name</span>
          <span className="trust-mark">By lesson</span>
          <span className="trust-mark">By topic</span>
          <span className="trust-mark">By level</span>
        </div>
      </section>

            <section className="panel card">
        <p className="eyebrow">Quick search</p>
        <h2>Search by name, lesson, or topic.</h2>
        <div className="steps-list">
          <input type="text" placeholder="Tutor name" aria-label="Tutor name" />
          <input type="text" placeholder="Lesson or topic" aria-label="Lesson or topic" />
          <select aria-label="Level">
            <option>Primary</option>
            <option>Secondary lower level</option>
            <option>Secondary upper level</option>
            <option>University</option>
          </select>
        </div>
      </section>


    </>
  )
}

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
    </>
  )
}

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

export function SignInPage() {
  return (
    <>
      <Page
        title="Sign in"
        text="Return to your account and continue where you left off."
        action="Continue"
        secondary={{ to: '/join', label: 'Join now' }}
      />

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to manage your activity.</h2>
          <div className="steps-list">
            <input type="email" placeholder="Email address" aria-label="Email address" />
            <input type="password" placeholder="Password" aria-label="Password" />
            <button className="primary-button" type="button">
              Sign in
            </button>
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">Access</p>
          <h2>One entry point for the main user types.</h2>
          <MinimalList items={signInRoles} />
        </article>
      </section>
    </>
  )
}

export function JoinPage() {
  return (
    <>
      <Page
        title="Join now"
        text="Create an account as a student or tutor."
        action="Create account"
        secondary={{ to: '/tutors', label: 'Browse tutors' }}
      />

      <section className="benefits-grid">
        <CompactCard title="Student" text="Search tutors and request lessons quickly." />
        <CompactCard title="Tutor" text="Upload documents and present your lessons." />
        <CompactCard title="Approval" text="Admin reviews keep the marketplace trusted." />
      </section>

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Create account</p>
          <h2>Choose the role that fits you.</h2>
          <div className="steps-list">
            <input type="text" placeholder="Full name" aria-label="Full name" />
            <select aria-label="Account type">
              <option>Student</option>
              <option>Tutor</option>
            </select>
            <input type="email" placeholder="Email address" aria-label="Email address" />
            <input type="password" placeholder="Password" aria-label="Password" />
            <button className="primary-button" type="button">
              Create account
            </button>
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">Tutor checklist</p>
          <h2>What tutors should prepare.</h2>
          <MinimalList items={joinChecklist} />
        </article>
      </section>
    </>
  )
}

