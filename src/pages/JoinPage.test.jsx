import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '../context/AuthContext.jsx'
import { JoinPage } from './JoinPage.jsx'

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))

function SignInDestination() {
  const location = useLocation()
  return <h1>Sign in for {location.state?.registeredEmail}</h1>
}

function renderJoin() {
  return render(
    <MemoryRouter initialEntries={['/join']}>
      <Routes>
        <Route path="/join" element={<JoinPage />} />
        <Route path="/sign-in" element={<SignInDestination />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('JoinPage', () => {
  const signUp = vi.fn()
  const setError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ signUp, submitting: false, error: '', setError })
  })

  it('creates the selected account and carries the email to sign in', async () => {
    const user = userEvent.setup()
    signUp.mockResolvedValue({ id: 25 })
    renderJoin()

    await user.type(screen.getByLabelText('Full name'), 'Aline Student')
    await user.selectOptions(screen.getByLabelText('Account type'), 'PARENT')
    expect(screen.queryByLabelText('Phone number')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.type(screen.getByLabelText('Phone number'), '0788000000')
    await user.type(screen.getByLabelText('Email address'), 'aline@example.com')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.type(screen.getByLabelText('Password'), 'secure-password')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(signUp).toHaveBeenCalledWith({
      full_name: 'Aline Student',
      phone_number: '0788000000',
      email: 'aline@example.com',
      password: 'secure-password',
      role: 'PARENT',
    })
    expect(await screen.findByRole('heading', { name: 'Sign in for aline@example.com' })).toBeInTheDocument()
  })

  it('reveals the password and explains the selected role', async () => {
    const user = userEvent.setup()
    renderJoin()

    await user.type(screen.getByLabelText('Full name'), 'Tutor Test')
    await user.selectOptions(screen.getByLabelText('Account type'), 'TUTOR')
    expect(screen.getByText('Tutor account')).toBeInTheDocument()
    expect(screen.getByText(/submit qualifications/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.type(screen.getByLabelText('Phone number'), '0788000000')
    await user.type(screen.getByLabelText('Email address'), 'tutor@example.com')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.type(screen.getByLabelText('Password'), 'secure-password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  })
})
