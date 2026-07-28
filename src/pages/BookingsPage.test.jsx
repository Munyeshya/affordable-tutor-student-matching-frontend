import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'

import { getBooking, updateBookingProgress } from '../api/services/bookings.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useBookingsQuery, useLearningLibraryQuery } from '../hooks/useCommonQueries.js'
import { renderWithProviders } from '../test/render.jsx'
import { BookingsPage } from './BookingsPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useCommonQueries.js', () => ({ useBookingsQuery: vi.fn(), useLearningLibraryQuery: vi.fn() }))
vi.mock('../api/services/bookings.js', () => ({
  createDispute: vi.fn(),
  getBooking: vi.fn(),
  listDisputes: vi.fn(),
  updateBookingAction: vi.fn(),
  updateBookingProgress: vi.fn(),
  updateOnlineLessonSession: vi.fn(),
}))
vi.mock('../api/services/payments.js', () => ({ listPayments: vi.fn() }))
vi.mock('../api/services/assessments', () => ({
  listAssessments: vi.fn(() => Promise.resolve({ data: [] })),
  listAssessmentAttempts: vi.fn(() => Promise.resolve({ data: [] })),
  listAssessmentConfirmations: vi.fn(() => Promise.resolve({ data: [] })),
  submitAssessmentAttempt: vi.fn(),
  submitAssessmentConfirmation: vi.fn(),
  createAssessment: vi.fn(),
  createAssessmentQuestion: vi.fn(),
  getLearningImpact: vi.fn(),
}))

describe('BookingsPage progress', () => {
  function renderBookingPage(route = '/bookings/21') {
    return renderWithProviders(
      <Routes>
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/bookings/:bookingId" element={<BookingsPage />} />
      </Routes>,
      { route },
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: { id: 9, role: 'TUTOR' } })
    useLearningLibraryQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })
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
    getBooking.mockResolvedValue({
      data: {
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
      },
    })
    updateBookingProgress.mockResolvedValue({ data: { progress_percent: 50 } })
  })

  it('lets the assigned tutor publish a progress update', async () => {
    const user = userEvent.setup()
    renderBookingPage()

    expect(await screen.findByText('The tutor will add progress notes as this lesson moves forward.')).toBeInTheDocument()
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

  it('shows a compact list before opening the full booking workspace', async () => {
    const user = userEvent.setup()
    renderBookingPage('/bookings')

    expect(screen.getByRole('link', { name: 'View booking' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add progress' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'View booking' }))
    expect(screen.getByRole('button', { name: 'Add progress' })).toBeInTheDocument()
  })

  it('opens assessment management inside the corresponding booking', async () => {
    const user = userEvent.setup()
    renderBookingPage()

    await user.click(await screen.findByRole('button', { name: 'Set assessments' }))

    expect(screen.getByRole('heading', { name: 'Measure learning for this booking' })).toBeInTheDocument()
    expect(screen.getByText('Mathematics booking #21')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open assessments' })).not.toBeInTheDocument()
  })
})
