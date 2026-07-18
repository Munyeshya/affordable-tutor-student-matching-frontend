import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { updateBookingProgress } from '../api/services/bookings.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useBookingsQuery } from '../hooks/useCommonQueries.js'
import { renderWithProviders } from '../test/render.jsx'
import { BookingsPage } from './BookingsPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useCommonQueries.js', () => ({ useBookingsQuery: vi.fn() }))
vi.mock('../api/services/bookings.js', () => ({
  updateBookingAction: vi.fn(),
  updateBookingProgress: vi.fn(),
}))
vi.mock('../api/services/payments.js', () => ({ listPayments: vi.fn() }))

describe('BookingsPage progress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: { id: 9, role: 'TUTOR' } })
    useBookingsQuery.mockReturnValue({
      data: [{
        id: 21,
        status: 'CONFIRMED',
        subject_name: 'Mathematics',
        student_name: 'Aline Student',
        tutor_name: 'Eric Tutor',
        mode: 'ONLINE',
        start_datetime: '2030-01-10T10:00:00Z',
        currency: 'RWF',
        total_amount: 8000,
        events: [],
        progress: null,
      }],
      isLoading: false,
      isError: false,
    })
    updateBookingProgress.mockResolvedValue({ data: { progress_percent: 50 } })
  })

  it('lets the assigned tutor publish a progress update', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BookingsPage />)

    expect(screen.getByText('The tutor will add progress notes as this lesson moves forward.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add progress' }))
    await user.type(screen.getByLabelText('Progress summary'), 'The learner understands equivalent fractions.')
    await user.click(screen.getByRole('button', { name: 'Share progress update' }))

    await waitFor(() => expect(updateBookingProgress).toHaveBeenCalledWith(21, {
      progress_percent: 0,
      summary: 'The learner understands equivalent fractions.',
      topics_covered: '',
      next_steps: '',
    }))
    expect(toast.success).toHaveBeenCalledWith('Learning progress shared successfully.')
  })
})
