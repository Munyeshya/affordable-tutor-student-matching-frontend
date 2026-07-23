import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '../context/AuthContext.jsx'
import { SignInPage } from './SignInPage.jsx'

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))

function Destination() {
  const location = useLocation()
  return <h1>Destination {location.pathname}</h1>
}

function renderSignIn(initialEntry = '/sign-in') {
  const entry = typeof initialEntry === 'string'
    ? initialEntry
    : { pathname: '/sign-in', state: { from: initialEntry } }
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="*" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SignInPage', () => {
  const setError = vi.fn()
  const signIn = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ signIn, submitting: false, error: '', setError, isAuthenticated: false })
  })

  it('submits credentials and sends the user to the role dashboard', async () => {
    const user = userEvent.setup()
    signIn.mockResolvedValue({ role: 'TUTOR' })
    renderSignIn()

    await user.type(screen.getByLabelText('Email address'), 'tutor@isomo.test')
    await user.type(screen.getByLabelText('Password'), 'secure-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(signIn).toHaveBeenCalledWith({ email: 'tutor@isomo.test', password: 'secure-password' })
    expect(await screen.findByRole('heading', { name: 'Destination /tutor' })).toBeInTheDocument()
  })

  it('returns to the originally requested protected route', async () => {
    const user = userEvent.setup()
    signIn.mockResolvedValue({ role: 'STUDENT' })
    renderSignIn({ pathname: '/bookings', search: '?status=PENDING' })

    await user.type(screen.getByLabelText('Email address'), 'student@isomo.test')
    await user.type(screen.getByLabelText('Password'), 'secure-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Destination /bookings' })).toBeInTheDocument()
  })

  it('keeps the API error visible and does not navigate after rejection', async () => {
    const user = userEvent.setup()
    signIn.mockRejectedValue(new Error('Invalid login'))
    useAuth.mockReturnValue({
      signIn,
      submitting: false,
      error: 'The email address or password is incorrect.',
      setError,
      isAuthenticated: false,
    })
    renderSignIn()

    expect(screen.getByText('The email address or password is incorrect.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('heading', { name: 'Sign in to manage your activity.' })).toBeInTheDocument()
    expect(screen.queryByText(/Destination/)).not.toBeInTheDocument()
  })

  it('lets the user reveal and hide the password without changing its value', async () => {
    const user = userEvent.setup()
    renderSignIn()
    const password = screen.getByLabelText('Password')

    await user.type(password, 'secure-password')
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(password).toHaveValue('secure-password')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })
})
