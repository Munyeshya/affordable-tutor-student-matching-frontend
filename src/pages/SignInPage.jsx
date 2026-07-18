import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Page } from '../App'
import { MinimalList } from '../components/ui/PagePrimitives.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getRoleHomePath } from '../routes/rolePaths.js'
import './SignInPage.css'

const signInRoles = [
  'Student dashboard access',
  'Tutor profile and lesson management',
  'Admin review and approval tools',
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

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const signedInUser = await signIn({ email, password })
      navigate(returnPath || getRoleHomePath(signedInUser?.role), { replace: true })
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
          <form className="steps-list sign-in-form" onSubmit={handleSubmit}>
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
