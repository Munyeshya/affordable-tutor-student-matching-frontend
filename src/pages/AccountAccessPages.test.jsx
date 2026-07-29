import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  confirmPasswordReset,
  requestPasswordReset,
  resendVerification,
  verifyEmail,
} from '../api/services/auth.js'
import {
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './AccountAccessPages.jsx'

vi.mock('../api/services/auth.js', () => ({
  confirmPasswordReset: vi.fn(),
  requestPasswordReset: vi.fn(),
  resendVerification: vi.fn(),
  verifyEmail: vi.fn(),
}))

function ResetDestination() {
  const location = useLocation()
  return <h1>Reset for {location.state?.recoveryEmail}</h1>
}

describe('account OTP pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('verifies a newly registered email with its six-digit code', async () => {
    const user = userEvent.setup()
    verifyEmail.mockResolvedValue({ data: { message: 'Verified' } })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/verify-email', state: { registeredEmail: 'student@example.com' } }]}>
        <Routes><Route path="/verify-email" element={<VerifyEmailPage />} /></Routes>
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Email address')).toHaveValue('student@example.com')
    await user.type(screen.getByLabelText('Six-digit code'), '123456')
    await user.click(screen.getByRole('button', { name: 'Verify email' }))

    expect(verifyEmail).toHaveBeenCalledWith({ email: 'student@example.com', code: '123456' })
    expect(await screen.findByRole('link', { name: 'Continue to sign in' })).toBeInTheDocument()
  })

  it('automatically sends the verification code after registration', async () => {
    resendVerification.mockResolvedValue({ data: { message: 'Sent' } })

    render(
      <MemoryRouter initialEntries={[{
        pathname: '/verify-email',
        state: { registeredEmail: 'new-student@example.com', sendVerificationCode: true },
      }]}>
        <Routes><Route path="/verify-email" element={<VerifyEmailPage />} /></Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Code sent. Check your inbox and spam folder.')).toBeInTheDocument()
    expect(resendVerification).toHaveBeenCalledTimes(1)
    expect(resendVerification).toHaveBeenCalledWith('new-student@example.com')
  })

  it('carries the recovery email to the OTP password form', async () => {
    const user = userEvent.setup()
    requestPasswordReset.mockResolvedValue({ data: { message: 'Sent' } })

    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetDestination />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Email address'), 'student@example.com')
    await user.click(screen.getByRole('button', { name: 'Send recovery code' }))

    expect(requestPasswordReset).toHaveBeenCalledWith('student@example.com')
    expect(await screen.findByRole('heading', { name: 'Reset for student@example.com' })).toBeInTheDocument()
  })

  it('submits the OTP and new password together', async () => {
    const user = userEvent.setup()
    confirmPasswordReset.mockResolvedValue({ data: { message: 'Updated' } })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/reset-password', state: { recoveryEmail: 'student@example.com' } }]}>
        <Routes><Route path="/reset-password" element={<ResetPasswordPage />} /></Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Six-digit code'), '654321')
    await user.type(screen.getByLabelText('New password'), 'DifferentPass456!')
    await user.type(screen.getByLabelText('Confirm password'), 'DifferentPass456!')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(confirmPasswordReset).toHaveBeenCalledWith({
      email: 'student@example.com',
      code: '654321',
      new_password: 'DifferentPass456!',
    })
    expect(await screen.findByRole('link', { name: 'Sign in with new password' })).toBeInTheDocument()
  })
})
