import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './SignInPage.css'
import './JoinPage.css'

const joinRoles = [
  {
    icon: 'students',
    title: 'Students',
    text: 'Find affordable tutors, learn through courses, and measure progress.',
  },
  {
    icon: 'account',
    title: 'Parents and guardians',
    text: 'Arrange and monitor learning support for formally linked students.',
  },
  {
    icon: 'courses',
    title: 'Tutors',
    text: 'Build a professional teaching profile after document verification.',
  },
]

const roleGuidance = {
  STUDENT: ['Student account', 'Search tutors, book lessons, buy courses, complete assessments, and review your progress.'],
  PARENT: ['Parent account', 'Link student accounts, arrange tutoring, complete payments, and follow family learning reports.'],
  TUTOR: ['Tutor account', 'Create your account first, then submit qualifications and the signed integrity agreement for approval.'],
}

export function JoinPage() {
  const { signUp, submitting, error, setError } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
    role: 'STUDENT',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [roleTitle, roleDescription] = roleGuidance[form.role]

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
      // The authentication context provides a safe, actionable error message.
    }
  }

  return (
    <section className="sign-in-page join-page" aria-labelledby="join-title">
      <div className="sign-in-frame join-frame">
        <aside className="sign-in-story join-story" aria-label="Isomo account options">
          <div className="sign-in-story-accent" aria-hidden="true"><span /><span /><span /><span /></div>
          <div className="sign-in-story-copy">
            <p className="sign-in-kicker">Start your Isomo journey</p>
            <h1>Create one account for purposeful learning.</h1>
            <p>Choose your role, complete the essential details, and enter a trusted learning marketplace built around quality and affordability.</p>
          </div>

          <div className="sign-in-role-list">
            {joinRoles.map((role) => (
              <article key={role.title}>
                <span><DashboardIcon name={role.icon} size={19} /></span>
                <div><strong>{role.title}</strong><p>{role.text}</p></div>
              </article>
            ))}
          </div>

          <img className="sign-in-illustration join-illustration" src="/researcher.svg" alt="" aria-hidden="true" />
        </aside>

        <article className="sign-in-panel join-panel">
          <header className="sign-in-heading">
            <span>Create your account</span>
            <h2 id="join-title">Join Isomo in a few clear steps.</h2>
            <p>Use accurate information so lessons, payments, and learning records stay connected to the right person.</p>
          </header>

          <div className="join-role-note" aria-live="polite">
            <DashboardIcon name={form.role === 'TUTOR' ? 'verification' : form.role === 'PARENT' ? 'students' : 'courses'} size={18} />
            <p><strong>{roleTitle}</strong><span>{roleDescription}</span></p>
          </div>

          <form className="sign-in-form join-form" onSubmit={handleSubmit}>
            <div className="join-form-grid">
              <label htmlFor="join-full-name">
                <span>Full name</span>
                <div className="sign-in-input-wrap">
                  <DashboardIcon name="account" size={18} />
                  <input
                    id="join-full-name"
                    type="text"
                    placeholder="Your full name"
                    autoComplete="name"
                    value={form.full_name}
                    onChange={(event) => updateField('full_name', event.target.value)}
                    required
                  />
                </div>
              </label>

              <label htmlFor="join-role">
                <span>Account type</span>
                <div className="sign-in-input-wrap join-select-wrap">
                  <DashboardIcon name="students" size={18} />
                  <select id="join-role" value={form.role} onChange={(event) => updateField('role', event.target.value)}>
                    <option value="STUDENT">Student</option>
                    <option value="PARENT">Parent or guardian</option>
                    <option value="TUTOR">Tutor</option>
                  </select>
                </div>
              </label>

              <label htmlFor="join-phone">
                <span>Phone number</span>
                <div className="sign-in-input-wrap">
                  <DashboardIcon name="messages" size={18} />
                  <input
                    id="join-phone"
                    type="tel"
                    placeholder="For example, 0788 000 000"
                    autoComplete="tel"
                    value={form.phone_number}
                    onChange={(event) => updateField('phone_number', event.target.value)}
                    required
                  />
                </div>
              </label>

              <label htmlFor="join-email">
                <span>Email address</span>
                <div className="sign-in-input-wrap">
                  <DashboardIcon name="messages" size={18} />
                  <input
                    id="join-email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    required
                  />
                </div>
              </label>
            </div>

            <label htmlFor="join-password">
              <span>Password</span>
              <div className="sign-in-input-wrap sign-in-password-wrap">
                <DashboardIcon name="verification" size={18} />
                <input
                  id="join-password"
                  aria-label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a secure password"
                  autoComplete="new-password"
                  minLength="8"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <small className="join-field-help">Use at least 8 characters. Avoid a password you use on another service.</small>
            </label>

            {error ? (
              <div className="sign-in-error" role="alert">
                <DashboardIcon name="disputes" size={18} />
                <p><strong>Account could not be created</strong><span>{error}</span></p>
              </div>
            ) : null}

            {successMessage ? <p className="join-success" role="status">{successMessage}</p> : null}

            <button className="sign-in-submit" type="submit" disabled={submitting}>
              <span>{submitting ? 'Creating your account...' : 'Create account'}</span>
              {!submitting ? <DashboardIcon name="account" size={18} /> : null}
            </button>
          </form>

          <p className="join-terms">By creating an account, you agree to use Isomo responsibly and provide accurate account information.</p>

          <div className="sign-in-join">
            <p><strong>Already have an account?</strong><span>Return to your learning or teaching workspace.</span></p>
            <Link to="/sign-in">Sign in</Link>
          </div>
        </article>
      </div>

    </section>
  )
}
