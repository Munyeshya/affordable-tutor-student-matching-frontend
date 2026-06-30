import React from 'react'
import { Link } from 'react-router-dom'
import { Page } from './App'

const tutorCards = [
  {
    name: 'Aline M.',
    lesson: 'Mathematics',
    level: 'Lower secondary',
    price: 'From $8 / lesson',
    note: 'Focuses on exam preparation and confidence building.',
  },
  {
    name: 'Jean P.',
    lesson: 'English',
    level: 'Upper secondary',
    price: 'From $7 / lesson',
    note: 'Helps with grammar, writing, and speaking practice.',
  },
  {
    name: 'Diane K.',
    lesson: 'Computer',
    level: 'University',
    price: 'From $10 / lesson',
    note: 'Covers practical digital skills and coursework support.',
  },
]

const howItWorksSteps = [
  {
    title: 'Search',
    text: 'Find tutors by name, lesson, topic, or level in just a few taps.',
  },
  {
    title: 'Compare',
    text: 'Review verified documents, lesson focus, price, and availability.',
  },
  {
    title: 'Request',
    text: 'Send a lesson request and wait for approval or confirmation.',
  },
  {
    title: 'Learn',
    text: 'Start the lesson and rate the tutor after the session ends.',
  },
]

const supportCards = [
  {
    title: 'Students',
    text: 'Search, compare, request, and review tutors with clear pricing.',
  },
  {
    title: 'Tutors',
    text: 'Show qualifications, upload documents, and manage lessons by topic.',
  },
  {
    title: 'Admins',
    text: 'Approve tutors, review documents, and keep the marketplace trusted.',
  },
]

const tutorBenefits = [
  'Document-backed approval',
  'Lesson-specific profiles',
  'Affordable comparison first',
]

const trustPoints = [
  'All tutor profiles are reviewed before visibility.',
  'Tutors can be rated on individual lessons they teach.',
  'Students can search by name, lesson, topic, or level.',
]

const onboardingPoints = [
  'Create a student or tutor account.',
  'Upload documents and choose your lessons.',
  'Wait for admin approval before going public.',
  'Keep your profile updated as you add skills.',
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

const joinChecklist = [
  'Qualification documents',
  'Signed agreement form',
  'Lessons and levels taught',
  'Profile photo and bio',
]

export function AboutPage() {
  return (
    <>
      <Page
        title="About"
        text="A trusted marketplace for affordable tutoring."
        action="Search tutors"
        secondary={{ to: '/contact', label: 'Contact' }}
      />

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Our mission</p>
          <h2>Make tutor discovery simple, affordable, and trustworthy.</h2>
          <p className="supporting-text">
            Isomo helps students find the right tutor quickly while giving tutors a professional
            space to present verified lessons, levels, and rates.
          </p>
          <div className="mini-list">
            <div>
              <span>Affordable first</span>
            </div>
            <div>
              <span>Verification backed</span>
            </div>
            <div>
              <span>Lesson-focused matching</span>
            </div>
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">What we value</p>
          <h2>Trust, clarity, and a smooth experience for every user.</h2>
          <p className="supporting-text">
            Each design and platform choice is shaped around clear journeys, strong tutor
            screening, and a premium feel that stays simple.
          </p>
          <div className="mini-list">
            <div>
              <span>Clear tutor profiles</span>
            </div>
            <div>
              <span>Fast student actions</span>
            </div>
            <div>
              <span>Admin quality control</span>
            </div>
          </div>
        </article>
      </section>

      <section className="benefits-grid">
        {supportCards.map((card) => (
          <article className="info-card card" key={card.title}>
            <p className="eyebrow">{card.title}</p>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Why students trust Isomo</p>
          <h2>Built around transparency from the first search.</h2>
          <div className="mini-list">
            {trustPoints.map((point) => (
              <div key={point}>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">What tutoring feels like here</p>
          <h2>Professional, organized, and affordable.</h2>
          <div className="mini-list">
            {tutorBenefits.map((point) => (
              <div key={point}>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </article>
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
        secondary={{ to: '/how-it-works', label: 'How it works' }}
      />

      <section className="card trust-section">
        <div className="section-heading section-heading-center">
          <div>
            <p className="eyebrow">Search</p>
            <h2>Find the right tutor faster.</h2>
          </div>
          <p className="section-text section-text-center">
            Tutors are organized by lesson focus, education level, and pricing so students can
            compare before they request.
          </p>
        </div>

        <div className="trust-marks">
          <span className="trust-mark">By name</span>
          <span className="trust-mark">By lesson</span>
          <span className="trust-mark">By topic</span>
          <span className="trust-mark">By level</span>
        </div>
      </section>

      <section className="cards-grid">
        {tutorCards.map((tutor) => (
          <article className="tutor-card" key={tutor.name}>
            <div className="tutor-card-top">
              <div>
                <h3>{tutor.name}</h3>
                <p>{tutor.lesson}</p>
              </div>
              <span className="soft-chip">{tutor.level}</span>
            </div>
            <p>{tutor.note}</p>
            <p className="tutor-price">{tutor.price}</p>
            <div className="hero-actions" style={{ marginTop: 0 }}>
              <Link className="primary-button" to="/join">
                Request tutor
              </Link>
              <Link className="secondary-button" to="/about">
                View profile
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Popular filters</p>
          <h2>Use the same search logic the platform was built for.</h2>
          <div className="mini-list">
            <div>
              <span>Mathematics, English, Computer</span>
            </div>
            <div>
              <span>Primary, secondary, university</span>
            </div>
            <div>
              <span>Lesson-specific rates</span>
            </div>
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">Tutor profile expectations</p>
          <h2>Profiles stay focused on what matters.</h2>
          <div className="mini-list">
            <div>
              <span>Qualifications and approvals</span>
            </div>
            <div>
              <span>Lessons taught and topics covered</span>
            </div>
            <div>
              <span>Ratings per lesson</span>
            </div>
          </div>
        </article>
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

      <section className="content-section split-layout">
        <article className="panel card">
          <p className="eyebrow">Student flow</p>
          <h2>Simple steps with no extra noise.</h2>
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
          <h2>Build a trusted profile, then manage lessons.</h2>
          <p className="supporting-text">
            Tutors upload qualifications, sign the platform agreement, select the lessons they
            teach, and wait for admin approval before appearing publicly.
          </p>
          <div className="mini-list">
            <div>
              <span>Create account</span>
            </div>
            <div>
              <span>Upload documents</span>
            </div>
            <div>
              <span>Choose lessons and levels</span>
            </div>
            <div>
              <span>Get approved by admin</span>
            </div>
          </div>
        </article>
      </section>

      <section className="benefits-grid">
        <article className="info-card card">
          <p className="eyebrow">Step 1</p>
          <h3>Search fast</h3>
          <p>Start by typing a tutor name, subject, topic, or academic level.</p>
        </article>

        <article className="info-card card">
          <p className="eyebrow">Step 2</p>
          <h3>Verify quality</h3>
          <p>Check documents, lesson focus, and tutor ratings before deciding.</p>
        </article>

        <article className="info-card card">
          <p className="eyebrow">Step 3</p>
          <h3>Learn confidently</h3>
          <p>Meet the tutor, take the lesson, and leave a rating after the session.</p>
        </article>
      </section>

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Admin review</p>
          <h2>Approval keeps the platform trusted.</h2>
          <div className="mini-list">
            <div>
              <span>Confirm documents</span>
            </div>
            <div>
              <span>Check lessons and levels</span>
            </div>
            <div>
              <span>Publish only approved tutors</span>
            </div>
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">Tutor management</p>
          <h2>Tutors can update their teaching focus later.</h2>
          <div className="mini-list">
            <div>
              <span>Add new lessons</span>
            </div>
            <div>
              <span>Change pricing by lesson</span>
            </div>
            <div>
              <span>Track ratings per subject</span>
            </div>
          </div>
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

      <section className="contact-card card">
        <div>
          <p className="eyebrow">Support</p>
          <h2>We reply to student, tutor, and admin questions.</h2>
          <p className="supporting-text">
            Use the details below for onboarding help, tutor verification questions, or platform
            support.
          </p>
        </div>
        <div className="mini-list">
          <div>
            <span>Email: support@isomo.rw</span>
          </div>
          <div>
            <span>Phone: +250 7xx xxx xxx</span>
          </div>
          <div>
            <span>WhatsApp: Available for quick help</span>
          </div>
        </div>
      </section>

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Send a message</p>
          <h2>Tell us what you need.</h2>
          <div className="steps-list">
            <input type="text" placeholder="Your name" aria-label="Your name" />
            <input type="email" placeholder="Email address" aria-label="Email address" />
            <textarea rows="5" placeholder="Message" aria-label="Message" />
            <button className="primary-button" type="button">
              Send message
            </button>
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">Help topics</p>
          <h2>Common reasons people contact us.</h2>
          <div className="mini-list">
            {supportTopics.map((topic) => (
              <div key={topic}>
                <span>{topic}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="benefits-grid">
        <article className="info-card card">
          <p className="eyebrow">For students</p>
          <h3>Help finding the right tutor</h3>
          <p>Need help comparing tutors by lesson or level? We can guide you.</p>
        </article>

        <article className="info-card card">
          <p className="eyebrow">For tutors</p>
          <h3>Account and document support</h3>
          <p>Need help with upload or approval? We can walk you through it.</p>
        </article>

        <article className="info-card card">
          <p className="eyebrow">For admins</p>
          <h3>Platform operations</h3>
          <p>Need a workflow update or report issue? Contact the team directly.</p>
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
          <h2>Sign in to manage your tutor or student activity.</h2>
          <div className="steps-list">
            <input type="email" placeholder="Email address" aria-label="Email address" />
            <input type="password" placeholder="Password" aria-label="Password" />
            <button className="primary-button" type="button">
              Sign in
            </button>
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">Need access?</p>
          <h2>Students and tutors use the same clean entry point.</h2>
          <div className="mini-list">
            {signInRoles.map((role) => (
              <div key={role}>
                <span>{role}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="benefits-grid">
        <article className="info-card card">
          <p className="eyebrow">Secure</p>
          <h3>Keep accounts protected</h3>
          <p>Use a strong password and sign in only from your own device.</p>
        </article>

        <article className="info-card card">
          <p className="eyebrow">Fast</p>
          <h3>Return in one step</h3>
          <p>Once you sign in, your dashboard should take you straight to the next action.</p>
        </article>

        <article className="info-card card">
          <p className="eyebrow">Simple</p>
          <h3>No confusion, no clutter</h3>
          <p>The same entry point works for the main user types on the platform.</p>
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
        <article className="info-card card">
          <p className="eyebrow">Student</p>
          <h3>Request lessons quickly.</h3>
          <p>Search tutors, compare options, and request a lesson in a few taps.</p>
        </article>

        <article className="info-card card">
          <p className="eyebrow">Tutor</p>
          <h3>Show your skills professionally.</h3>
          <p>Upload qualifications, select lessons, and wait for admin approval.</p>
        </article>

        <article className="info-card card">
          <p className="eyebrow">Approval</p>
          <h3>Keep the marketplace trusted.</h3>
          <p>Admin reviews protect quality before tutors become visible publicly.</p>
        </article>
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
          <div className="mini-list">
            {joinChecklist.map((item) => (
              <div key={item}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="benefits-grid">
        <article className="info-card card">
          <p className="eyebrow">Before approval</p>
          <h3>Keep your profile complete</h3>
          <p>Write a clear bio, add your teaching levels, and prepare your documents.</p>
        </article>

        <article className="info-card card">
          <p className="eyebrow">After approval</p>
          <h3>Become visible to students</h3>
          <p>Once admin approves your application, your tutor profile can be searched publicly.</p>
        </article>

        <article className="info-card card">
          <p className="eyebrow">Next step</p>
          <h3>Start managing lessons</h3>
          <p>Use your account to update lessons, pricing, and availability over time.</p>
        </article>
      </section>
    </>
  )
}

