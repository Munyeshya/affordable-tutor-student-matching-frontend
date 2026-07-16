import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearAuthSession,
  hasStoredAccessToken,
  setAuthSession,
} from '../api/client.js'
import { getCurrentUser, login } from '../api/services/auth.js'
import { AuthProvider, useAuth } from './AuthContext.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../api/services/auth.js', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}))
vi.mock('../api/client.js', () => ({
  AUTH_SESSION_EXPIRED_EVENT: 'auth:session-expired',
  clearAuthSession: vi.fn(),
  getStoredRefreshToken: vi.fn(),
  hasStoredAccessToken: vi.fn(),
  setAuthSession: vi.fn(),
}))

function AuthProbe() {
  const auth = useAuth()
  return (
    <div>
      <p>{auth.loading ? 'loading' : 'ready'}</p>
      <p>{auth.user?.email || 'signed out'}</p>
      <p>{auth.error || 'no error'}</p>
      <button type="button" onClick={() => auth.signIn({ email: 'student@isomo.test', password: 'secret' }).catch(() => {})}>
        Sign in probe
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hasStoredAccessToken.mockReturnValue(false)
  })

  it('finishes hydration without calling the API when no token exists', async () => {
    render(<AuthProvider><AuthProbe /></AuthProvider>)

    expect(await screen.findByText('ready')).toBeInTheDocument()
    expect(screen.getByText('signed out')).toBeInTheDocument()
    expect(getCurrentUser).not.toHaveBeenCalled()
  })

  it('hydrates the stored user when an access token exists', async () => {
    hasStoredAccessToken.mockReturnValue(true)
    getCurrentUser.mockResolvedValue({ data: { id: 3, email: 'parent@isomo.test', role: 'PARENT' } })

    render(<AuthProvider><AuthProbe /></AuthProvider>)

    expect(await screen.findByText('parent@isomo.test')).toBeInTheDocument()
  })

  it('stores tokens and exposes the user after successful sign-in', async () => {
    const user = userEvent.setup()
    login.mockResolvedValue({
      data: {
        access: 'access-token',
        refresh: 'refresh-token',
        user: { id: 8, email: 'student@isomo.test', full_name: 'Test Student', role: 'STUDENT' },
      },
    })
    render(<AuthProvider><AuthProbe /></AuthProvider>)
    await screen.findByText('ready')

    await user.click(screen.getByRole('button', { name: 'Sign in probe' }))

    expect(await screen.findByText('student@isomo.test')).toBeInTheDocument()
    expect(setAuthSession).toHaveBeenCalledWith({ accessToken: 'access-token', refreshToken: 'refresh-token' })
    expect(toast.success).toHaveBeenCalledWith('Welcome back, Test Student.')
  })

  it('shows a clear API message after failed sign-in', async () => {
    const user = userEvent.setup()
    login.mockRejectedValue({
      response: { status: 400, data: { email: ['Enter a valid email address.'] } },
    })
    render(<AuthProvider><AuthProbe /></AuthProvider>)
    await screen.findByText('ready')

    await user.click(screen.getByRole('button', { name: 'Sign in probe' }))

    expect(await screen.findByText('Email: Enter a valid email address.')).toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith('Email: Enter a valid email address.')
  })

  it('clears the user when the global session-expired event is received', async () => {
    hasStoredAccessToken.mockReturnValue(true)
    getCurrentUser.mockResolvedValue({ data: { id: 9, email: 'tutor@isomo.test', role: 'TUTOR' } })
    render(<AuthProvider><AuthProbe /></AuthProvider>)
    await screen.findByText('tutor@isomo.test')

    act(() => window.dispatchEvent(new Event('auth:session-expired')))

    await waitFor(() => expect(screen.getByText('signed out')).toBeInTheDocument())
    expect(toast.info).toHaveBeenCalledWith('Your session expired. Please sign in again.')
    expect(clearAuthSession).not.toHaveBeenCalled()
  })
})
