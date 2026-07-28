import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors.js'
import {
  confirmPasswordReset,
  requestPasswordReset,
  resendVerification,
  verifyEmail,
} from '../api/services/auth.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import './AccountAccessPages.css'

function AccountAccessShell({ eyebrow, title, text, children }) {
  return (
    <section className="account-access-page">
      <article className="account-access-card">
        <span className="account-access-icon"><DashboardIcon name="verification" size={22} /></span>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
        {children}
      </article>
    </section>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
      toast.success('Password reset instructions requested.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not request a password reset.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AccountAccessShell eyebrow="Account recovery" title="Reset your password." text="Enter the email used for your Isomo account.">
      {sent ? (
        <div className="account-access-status" role="status">
          Check your inbox. If the account exists, a secure reset link has been sent.
        </div>
      ) : (
        <form onSubmit={submit}>
          <label><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</button>
        </form>
      )}
      <Link className="account-access-link" to="/sign-in">Return to sign in</Link>
    </AccountAccessShell>
  )
}

export function ResendVerificationPage() {
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.registeredEmail || '')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await resendVerification(email)
      setSent(true)
      toast.success('Verification email requested.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not resend the verification email.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AccountAccessShell eyebrow="Email verification" title="Request a new verification link." text="Use the same email address you entered during registration.">
      {sent ? <div className="account-access-status" role="status">Check your inbox for the latest verification link.</div> : (
        <form onSubmit={submit}>
          <label><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Sending...' : 'Resend verification'}</button>
        </form>
      )}
      <Link className="account-access-link" to="/sign-in">Return to sign in</Link>
    </AccountAccessShell>
  )
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')
  const [state, setState] = useState(() => (
    uid && token
      ? { status: 'loading', message: 'Verifying your email...' }
      : { status: 'error', message: 'This verification link is incomplete.' }
  ))
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current || !uid || !token) return
    requested.current = true
    verifyEmail({ uid, token })
      .then(() => setState({ status: 'success', message: 'Your email is verified. You can now sign in.' }))
      .catch((error) => setState({ status: 'error', message: getApiErrorMessage(error, 'This verification link is invalid or expired.') }))
  }, [token, uid])

  return (
    <AccountAccessShell eyebrow="Email verification" title={state.status === 'success' ? 'Email verified.' : 'Confirming your account.'} text={state.message}>
      {state.status === 'loading' ? <div className="account-access-loader" aria-label="Verifying email" /> : null}
      {state.status === 'success' ? <Link className="primary-button" to="/sign-in">Continue to sign in</Link> : null}
      {state.status === 'error' ? <Link className="primary-button" to="/resend-verification">Request a new link</Link> : null}
    </AccountAccessShell>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (password !== confirmPassword) {
      toast.error('The passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await confirmPasswordReset({ uid: searchParams.get('uid'), token: searchParams.get('token'), new_password: password })
      setComplete(true)
      toast.success('Password updated successfully.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not reset this password.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AccountAccessShell eyebrow="Account recovery" title="Choose a new password." text="Use a strong password that you have not used for another account.">
      {complete ? <Link className="primary-button" to="/sign-in">Sign in with new password</Link> : (
        <form onSubmit={submit}>
          <label><span>New password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength="8" required /></label>
          <label><span>Confirm password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength="8" required /></label>
          <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Updating...' : 'Update password'}</button>
        </form>
      )}
    </AccountAccessShell>
  )
}
