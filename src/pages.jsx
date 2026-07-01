import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listTutors } from './api/services/tutors.js'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
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

const levelOptions = [
  { value: '', label: 'Any level' },
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'SECONDARY_LOWER', label: 'Secondary lower level' },
  { value: 'SECONDARY_UPPER', label: 'Secondary upper level' },
  { value: 'UNIVERSITY', label: 'University' },
]

function formatTutorRate(rate, currency = 'RWF') {
  if (rate === null || rate === undefined || rate === '') {
    return 'Price on request'
  }

  const numericRate = Number(rate)
  if (Number.isNaN(numericRate)) {
    return 'Price on request'
  }

  return `${currency} ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: numericRate % 1 === 0 ? 0 : 2,
  }).format(numericRate)} / lesson`
}

function normalizeTutorListResponse(responseData) {
  if (Array.isArray(responseData)) {
    return responseData
  }

  if (responseData && Array.isArray(responseData.results)) {
    return responseData.results
  }

  return []
}

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
  const [filters, setFilters] = useState({
    q: '',
    lesson: '',
    topic: '',
    level: '',
  })

  const tutorsQuery = useQuery({
    queryKey: ['tutors', filters],
    queryFn: async () => {
      const params = {}

      if (filters.q.trim()) {
        params.q = filters.q.trim()
      }

      if (filters.lesson.trim()) {
        params.lesson = filters.lesson.trim()
      }

      if (filters.topic.trim()) {
        params.topic = filters.topic.trim()
      }

      if (filters.level) {
        params.level = filters.level
      }

      const response = await listTutors(params)
      return normalizeTutorListResponse(response.data)
    },
  })

  const tutors = tutorsQuery.data ?? []

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
        <form
          className="steps-list"
          onSubmit={(event) => {
            event.preventDefault()
            tutorsQuery.refetch()
          }}
        >
          <input
            type="text"
            placeholder="Tutor name"
            aria-label="Tutor name"
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Lesson"
            aria-label="Lesson"
            value={filters.lesson}
            onChange={(event) => setFilters((current) => ({ ...current, lesson: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Topic"
            aria-label="Topic"
            value={filters.topic}
            onChange={(event) => setFilters((current) => ({ ...current, topic: event.target.value }))}
          />
          <select
            aria-label="Level"
            value={filters.level}
            onChange={(event) => setFilters((current) => ({ ...current, level: event.target.value }))}
          >
            {levelOptions.map((option) => (
              <option key={option.value || 'any'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="primary-button" type="submit">
            Search
          </button>
        </form>
      </section>

      <section className="trust-section card">
        <div className="section-heading section-heading-center">
          <div>
            <p className="eyebrow">Results</p>
            <h2>
              {tutorsQuery.isLoading
                ? 'Loading tutors...'
                : `${tutors.length} tutor${tutors.length === 1 ? '' : 's'} found`}
            </h2>
          </div>
          <p className="section-text section-text-center">
            Showing affordable tutors with verified profiles.
          </p>
        </div>

        <div className="trust-marks">
          <span className="trust-mark">Mathematics</span>
          <span className="trust-mark">English</span>
          <span className="trust-mark">Computer</span>
          <span className="trust-mark">Verified</span>
        </div>
      </section>

      <section className="cards-grid">
        {tutorsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <article className="tutor-card tutor-card-skeleton" key={index} aria-busy="true">
              <div className="skeleton skeleton-line skeleton-title" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-button" />
            </article>
          ))
        ) : tutorsQuery.isError ? (
          <article className="panel card">
            <p className="supporting-text">We could not load tutors right now. Please try again.</p>
          </article>
        ) : tutors.length === 0 ? (
          <article className="panel card">
            <p className="supporting-text">No tutors match your search yet. Try a different lesson or topic.</p>
          </article>
        ) : (
          tutors.map((tutor) => {
            const levels = Array.isArray(tutor.subject_levels) ? tutor.subject_levels : []
            const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : []

            return (
              <article className="tutor-card" key={tutor.id}>
                <div className="tutor-card-top">
                  <div>
                    <h3>{tutor.full_name}</h3>
                    <p>{tutor.headline || subjects[0] || 'Tutor profile'}</p>
                  </div>
                  <span className="soft-chip">{tutor.location || 'Online'}</span>
                </div>
                <p className="tutor-price">{formatTutorRate(tutor.hourly_rate, tutor.currency)}</p>
                <div className="trust-marks" style={{ marginBottom: '1rem' }}>
                  {levels.slice(0, 3).map((levelItem) => (
                    <span className="trust-mark" key={`${tutor.id}-${levelItem.subject}-${levelItem.level}`}>
                      {levelItem.subject} - {levelItem.level}
                    </span>
                  ))}
                </div>
                <div className="hero-actions" style={{ marginTop: 0 }}>
                  <Link className="primary-button" to="/join">
                    Request tutor
                  </Link>
                  <Link className="secondary-button" to="/contact">
                    Ask question
                  </Link>
                </div>
              </article>
            )
          })
        )}
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

      <section className="benefits-grid">
        <CompactCard title="FAQ" text="Approval usually follows document review. Ratings are lesson-specific. Search works by name, lesson, topic, and level." />
        <CompactCard title="FAQ" text="After booking, the tutor and student continue inside their accounts. Tutors submit ID, certificates, agreement form, and lesson list." />
        <CompactCard title="FAQ" text="Admin reviews documents and lesson coverage before tutors become visible." />
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
  const { signIn, submitting, error, setError, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.registeredEmail || '')
  const [password, setPassword] = useState('')
  const [localMessage, setLocalMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLocalMessage('')
    setError('')

    try {
      await signIn({ email, password })
      navigate('/')
    } catch {
      // context already sets the error message
    }
  }

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
          <form className="steps-list" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error ? <p className="supporting-text">{error}</p> : null}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </article>

        <article className="panel card">
          <p className="eyebrow">Access</p>
          <h2>One entry point for the main user types.</h2>
          <MinimalList items={signInRoles} />
          {isAuthenticated ? <p className="supporting-text">You are already signed in.</p> : null}
        </article>
      </section>
    </>
  )
}

export function JoinPage() {
  const { signUp, submitting, error, setError } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  })
  const [successMessage, setSuccessMessage] = useState('')

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSuccessMessage('')
    setError('')

    try {
      await signUp(form)
      setSuccessMessage('Account created. Please sign in to continue.')
      navigate('/sign-in', { state: { registeredEmail: form.email } })
    } catch {
      // context already sets the error message
    }
  }

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
          <form className="steps-list" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Full name"
              aria-label="Full name"
              value={form.full_name}
              onChange={(event) => updateField('full_name', event.target.value)}
            />
            <select
              aria-label="Account type"
              value={form.role}
              onChange={(event) => updateField('role', event.target.value)}
            >
              <option value="STUDENT">Student</option>
              <option value="TUTOR">Tutor</option>
              <option value="PARENT">Parent</option>
            </select>
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
            />
            {error ? <p className="supporting-text">{error}</p> : null}
            {successMessage ? <p className="supporting-text">{successMessage}</p> : null}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
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

