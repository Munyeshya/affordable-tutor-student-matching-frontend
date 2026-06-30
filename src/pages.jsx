import { Link } from 'react-router-dom'
import { Page } from './App'

const tutorCards = [
  {
    name: 'Aline M.',
    lesson: 'Mathematics',
    level: 'Lower secondary',
    price: 'From $8 / lesson',
  },
  {
    name: 'Jean P.',
    lesson: 'English',
    level: 'Upper secondary',
    price: 'From $7 / lesson',
  },
  {
    name: 'Diane K.',
    lesson: 'Computer',
    level: 'University',
    price: 'From $10 / lesson',
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
            <div>
              <span>Tutor account approval</span>
            </div>
            <div>
              <span>Document upload support</span>
            </div>
            <div>
              <span>Lesson and pricing updates</span>
            </div>
            <div>
              <span>Student matching help</span>
            </div>
          </div>
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
            <div>
              <span>Student dashboard</span>
            </div>
            <div>
              <span>Tutor dashboard</span>
            </div>
            <div>
              <span>Admin review tools</span>
            </div>
          </div>
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
            <div>
              <span>Qualification documents</span>
            </div>
            <div>
              <span>Signed agreement form</span>
            </div>
            <div>
              <span>Lessons and levels taught</span>
            </div>
            <div>
              <span>Profile photo and bio</span>
            </div>
          </div>
        </article>
      </section>
    </>
  )
}
