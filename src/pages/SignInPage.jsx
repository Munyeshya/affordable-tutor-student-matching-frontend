import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getRoleHomePath } from '../routes/rolePaths.js'
import './SignInPage.css'

const signInRoles = [
  {
    icon: 'students',
    title: 'Students and parents',
    text: 'Bookings, courses, progress, payments, and reports.',
  },
  {
    icon: 'courses',
    title: 'Tutors',
    text: 'Teaching, learners, schedules, verification, and earnings.',
  },
  {
    icon: 'verification',
    title: 'Administrators',
    text: 'Trust, moderation, platform impact, and user support.',
  },
]

function getSafeReturnPath(from) {
  const pathname = from?.pathname

  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return null
  }

  return `${pathname}${from.search || ''}${from.hash || ''}`
}

export function SignInPage() {
  const { signIn, submitting, error, setError, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const returnPath = getSafeReturnPath(location.state?.from)
  const [email, setEmail] = useState(location.state?.registeredEmail || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const signedInUser = await signIn({ email, password })
      navigate(returnPath || getRoleHomePath(signedInUser?.role), { replace: true })
    } catch {
      // The authentication context provides a safe, actionable error message.
    }
  }

  return (
    <section className="sign-in-page" aria-labelledby="sign-in-title">
      <div className="sign-in-frame">
        <aside className="sign-in-story" aria-label="Isomo account access">
          <div className="sign-in-story-accent" aria-hidden="true"><span /><span /><span /><span /></div>
          <div className="sign-in-story-copy">
            <p className="sign-in-kicker">Learn / Connect / Grow</p>
            <h1>Welcome back to learning that moves with you.</h1>
            <p>One secure account keeps every lesson, payment, conversation, and learning outcome in the right place.</p>
          </div>

          <div className="sign-in-role-list">
            {signInRoles.map((role) => (
              <article key={role.title}>
                <span><DashboardIcon name={role.icon} size={19} /></span>
                <div><strong>{role.title}</strong><p>{role.text}</p></div>
              </article>
            ))}
          </div>

          <img className="sign-in-illustration" src="/aking-notes.svg" alt="" aria-hidden="true" />
        </aside>

        <article className="sign-in-panel">
          <header className="sign-in-heading">
            <span>Account access</span>
            <h2 id="sign-in-title">Sign in to manage your activity.</h2>
            <p>Enter the email address and password connected to your Isomo account.</p>
          </header>

          {returnPath ? (
            <div className="sign-in-return-notice">
              <DashboardIcon name="verification" size={17} />
              <p><strong>Continue where you left off</strong><span>You will return to your requested page after signing in.</span></p>
            </div>
          ) : null}

          <form className="sign-in-form" onSubmit={handleSubmit}>
            <label htmlFor="sign-in-email">
              <span>Email address</span>
              <div className="sign-in-input-wrap">
                <DashboardIcon name="account" size={18} />
                <input
                  id="sign-in-email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </label>

            <label htmlFor="sign-in-password">
              <span>Password</span>
              <div className="sign-in-input-wrap sign-in-password-wrap">
                <DashboardIcon name="verification" size={18} />
                <input
                  id="sign-in-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error ? (
              <div className="sign-in-error" role="alert">
                <DashboardIcon name="disputes" size={18} />
                <p><strong>Sign-in unsuccessful</strong><span>{error}</span></p>
              </div>
            ) : null}

            <button className="sign-in-submit" type="submit" disabled={submitting}>
              <span>{submitting ? 'Signing you in...' : 'Sign in'}</span>
              {!submitting ? <DashboardIcon name="logout" size={18} /> : null}
            </button>
          </form>

          <div className="sign-in-join">
            <p><strong>New to Isomo?</strong><span>Create a student, parent, or tutor account.</span></p>
            <Link to="/join">Create account</Link>
          </div>

          {isAuthenticated ? <p className="sign-in-session-note" role="status">You already have an active Isomo session.</p> : null}
        </article>
      </div>

    </section>
  )
}
