import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '../context/AuthContext.jsx'
import { ProtectedRoute } from './RouteGuards.jsx'

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))

function LocationState() {
  const location = useLocation()
  return <p>{location.state?.from?.pathname || 'missing return path'}</p>
}

function renderGuard(allowedRoles = []) {
  return render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/private" element={<h1>Protected content</h1>} />
        </Route>
        <Route path="/sign-in" element={<><h1>Sign in destination</h1><LocationState /></>} />
        <Route path="/unauthorized" element={<h1>Unauthorized destination</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuth.mockReset()
  })

  it('shows an accessible loading state while authentication hydrates', () => {
    useAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: true })
    renderGuard()

    const heading = screen.getByRole('heading', { name: 'Loading your account...' })
    expect(heading).toBeInTheDocument()
    expect(heading.closest('section')).toHaveAttribute('aria-busy', 'true')
  })

  it('redirects signed-out users and preserves their return path', () => {
    useAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: false })
    renderGuard()

    expect(screen.getByRole('heading', { name: 'Sign in destination' })).toBeInTheDocument()
    expect(screen.getByText('/private')).toBeInTheDocument()
  })

  it('redirects the wrong role to the unauthorized page', () => {
    useAuth.mockReturnValue({ user: { role: 'STUDENT' }, isAuthenticated: true, loading: false })
    renderGuard(['ADMIN'])

    expect(screen.getByRole('heading', { name: 'Unauthorized destination' })).toBeInTheDocument()
  })

  it('renders protected content for an allowed role', () => {
    useAuth.mockReturnValue({ user: { role: 'ADMIN' }, isAuthenticated: true, loading: false })
    renderGuard(['ADMIN'])

    expect(screen.getByRole('heading', { name: 'Protected content' })).toBeInTheDocument()
  })
})
