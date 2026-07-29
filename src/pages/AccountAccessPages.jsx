import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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

function OTPInput({ value, onChange, autoFocus = false }) {
  return (
    <label>
      <span>Six-digit code</span>
      <input
        className="account-access-otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength="6"
        placeholder="000000"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
        autoFocus={autoFocus}
        required
      />
    </label>
  )
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await requestPasswordReset(email)
      toast.success('If the account exists, a password reset code has been sent.')
      navigate('/reset-password', { state: { recoveryEmail: email } })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not request a password reset code.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AccountAccessShell eyebrow="Account recovery" title="Reset your password" text="Enter the email used for your YigaReach account. We will send a six-digit recovery code.">
      <form onSubmit={submit}>
        <label><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Sending code...' : 'Send recovery code'}</button>
      </form>
      <Link className="account-access-link" to="/sign-in">Return to sign in</Link>
    </AccountAccessShell>
  )
}

export function ResendVerificationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.registeredEmail || '')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await resendVerification(email)
      toast.success('If the account is awaiting verification, a new code has been sent.')
      navigate('/verify-email', { state: { registeredEmail: email } })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not send a new verification code.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AccountAccessShell eyebrow="Email verification" title="Request a new code" text="Use the same email address you entered during registration.">
      <form onSubmit={submit}>
        <label><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Sending code...' : 'Send verification code'}</button>
      </form>
      <Link className="account-access-link" to="/sign-in">Return to sign in</Link>
    </AccountAccessShell>
  )
}

export function VerifyEmailPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(location.state?.registeredEmail || searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [complete, setComplete] = useState(false)
  const [deliveryStatus, setDeliveryStatus] = useState(
    location.state?.sendVerificationCode ? 'sending' : 'idle',
  )
  const automaticDeliveryStarted = useRef(false)

  useEffect(() => {
    if (!location.state?.sendVerificationCode || !email || automaticDeliveryStarted.current) return

    automaticDeliveryStarted.current = true
    setResending(true)
    resendVerification(email)
      .then(() => {
        setDeliveryStatus('sent')
        toast.success('Your verification code has been sent.')
      })
      .catch((error) => {
        setDeliveryStatus('failed')
        toast.error(getApiErrorMessage(error, 'Your account was created, but the code could not be sent. Try again below.'))
      })
      .finally(() => setResending(false))
  }, [email, location.state?.sendVerificationCode])

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await verifyEmail({ email, code })
      setComplete(true)
      toast.success('Email verified successfully.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'The verification code is invalid or expired.'))
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    if (!email) {
      toast.error('Enter your email address first.')
      return
    }
    setResending(true)
    setDeliveryStatus('sending')
    try {
      await resendVerification(email)
      setCode('')
      setDeliveryStatus('sent')
      toast.success('If the account is awaiting verification, a new code has been sent.')
    } catch (error) {
      setDeliveryStatus('failed')
      toast.error(getApiErrorMessage(error, 'Could not send a new verification code.'))
    } finally {
      setResending(false)
    }
  }

  return (
    <AccountAccessShell eyebrow="Email verification" title={complete ? 'Email verified' : 'Enter your verification code'} text={complete ? 'Your YigaReach account is ready. You can now sign in.' : 'Enter the six-digit code sent to your email. Only the latest code works and it expires shortly.'}>
      {complete ? <Link className="primary-button" to="/sign-in">Continue to sign in</Link> : (
        <form onSubmit={submit}>
          {deliveryStatus !== 'idle' ? (
            <p className={`account-access-delivery is-${deliveryStatus}`} role="status">
              {deliveryStatus === 'sending' ? 'Account created. Sending your verification code now...' : null}
              {deliveryStatus === 'sent' ? 'Code sent. Check your inbox and spam folder.' : null}
              {deliveryStatus === 'failed' ? 'Your account exists, but email delivery failed. Use Send a new code to retry.' : null}
            </p>
          ) : null}
          <label><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <OTPInput value={code} onChange={setCode} autoFocus={Boolean(email)} />
          <button className="primary-button" type="submit" disabled={busy || code.length !== 6}>{busy ? 'Verifying...' : 'Verify email'}</button>
          <button className="account-access-secondary" type="button" onClick={resend} disabled={resending}>{resending ? 'Sending...' : 'Send a new code'}</button>
        </form>
      )}
      {!complete ? <Link className="account-access-link" to="/sign-in">Return to sign in</Link> : null}
    </AccountAccessShell>
  )
}

export function ResetPasswordPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(location.state?.recoveryEmail || searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [complete, setComplete] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (password !== confirmPassword) {
      toast.error('The passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await confirmPasswordReset({ email, code, new_password: password })
      setComplete(true)
      toast.success('Password updated successfully.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not reset this password.'))
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    if (!email) {
      toast.error('Enter your email address first.')
      return
    }
    setResending(true)
    try {
      await requestPasswordReset(email)
      setCode('')
      toast.success('If the account exists, a new recovery code has been sent.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not send a new recovery code.'))
    } finally {
      setResending(false)
    }
  }

  return (
    <AccountAccessShell eyebrow="Account recovery" title={complete ? 'Password updated' : 'Choose a new password'} text={complete ? 'Your new password is active.' : 'Enter the code from your latest email and choose a strong new password.'}>
      {complete ? <Link className="primary-button" to="/sign-in">Sign in with new password</Link> : (
        <form onSubmit={submit}>
          <label><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <OTPInput value={code} onChange={setCode} autoFocus={Boolean(email)} />
          <label><span>New password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength="8" required /></label>
          <label><span>Confirm password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength="8" required /></label>
          <button className="primary-button" type="submit" disabled={busy || code.length !== 6}>{busy ? 'Updating...' : 'Update password'}</button>
          <button className="account-access-secondary" type="button" onClick={resend} disabled={resending}>{resending ? 'Sending...' : 'Send a new code'}</button>
        </form>
      )}
    </AccountAccessShell>
  )
}
