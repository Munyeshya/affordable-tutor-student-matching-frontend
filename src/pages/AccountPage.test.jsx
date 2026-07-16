import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { updateCurrentUser } from '../api/services/auth.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSubjectsQuery } from '../hooks/useCommonQueries.js'
import { renderWithProviders } from '../test/render.jsx'
import { AccountPage } from './AccountPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useCommonQueries.js', () => ({ useSubjectsQuery: vi.fn() }))
vi.mock('../api/services/auth.js', () => ({ updateCurrentUser: vi.fn() }))

const refreshUser = vi.fn()
const student = {
  id: 1,
  role: 'STUDENT',
  first_name: 'Old',
  last_name: 'Name',
  profile: {
    type: 'student',
    data: {
      full_name: 'Old Name',
      level: 'Secondary upper level',
      budget_min: 5000,
      budget_max: 10000,
      subjects_needing_help: [3],
      prefers_online: true,
    },
  },
}

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: student, loading: false, refreshUser })
    useSubjectsQuery.mockReturnValue({ data: [{ id: 3, name: 'Mathematics' }], isLoading: false, isError: false })
    updateCurrentUser.mockResolvedValue({ data: {} })
    refreshUser.mockResolvedValue(student)
  })

  it('shows a dedicated loading state while the account hydrates', () => {
    useAuth.mockReturnValue({ user: null, loading: true, refreshUser })
    renderWithProviders(<AccountPage />)

    expect(screen.getByRole('heading', { name: 'Loading your profile...' })).toBeInTheDocument()
  })

  it('submits role-specific student profile fields and confirms success', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountPage />)

    await user.clear(screen.getByLabelText('First name'))
    await user.type(screen.getByLabelText('First name'), 'Aline')
    await user.clear(screen.getByLabelText('Learning goals'))
    await user.type(screen.getByLabelText('Learning goals'), 'Improve exam confidence')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(() => expect(updateCurrentUser).toHaveBeenCalled())
    expect(updateCurrentUser.mock.calls[0][0]).toEqual(expect.objectContaining({
      first_name: 'Aline',
      full_name: 'Old Name',
      subjects_needing_help: [3],
      learning_goals: 'Improve exam confidence',
      budget_min: 5000,
      budget_max: 10000,
      prefers_online: true,
    }))
    expect(refreshUser).toHaveBeenCalled()
    expect(await screen.findByText('Your profile has been updated.')).toBeInTheDocument()
  })
})
