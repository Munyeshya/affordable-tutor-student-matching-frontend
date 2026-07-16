import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createBooking } from '../api/services/bookings.js'
import { getTutor } from '../api/services/tutors.js'
import { useAuth } from '../context/AuthContext.jsx'
import { usePublicTutorsQuery, useSubjectsQuery } from '../hooks/useCommonQueries.js'
import { renderWithProviders } from '../test/render.jsx'
import { BookingRequestPage } from './BookingRequestPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useCommonQueries.js', () => ({
  usePublicTutorsQuery: vi.fn(),
  useSubjectsQuery: vi.fn(),
}))
vi.mock('../api/services/bookings.js', () => ({ createBooking: vi.fn() }))
vi.mock('../api/services/tutors.js', () => ({ getTutor: vi.fn() }))
vi.mock('../api/services/parents.js', () => ({ listParentLinks: vi.fn() }))

const selectedTutor = {
  id: 10,
  user_id: 20,
  full_name: 'Alice Uwase',
  headline: 'Patient mathematics tutor',
  hourly_rate: 8000,
  currency: 'RWF',
  subjects: ['Mathematics'],
  teaches_online: true,
  teaches_in_person: false,
  upcoming_availability: [{
    id: 5,
    start_datetime: '2030-01-10T10:00:00Z',
    end_datetime: '2030-01-10T11:00:00Z',
    mode: 'ONLINE',
  }],
}

describe('BookingRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: { id: 1, role: 'STUDENT' } })
    usePublicTutorsQuery.mockReturnValue({
      data: { count: 1, results: [selectedTutor] },
      isLoading: false,
    })
    useSubjectsQuery.mockReturnValue({ data: [{ id: 3, name: 'Mathematics' }], isLoading: false })
    getTutor.mockResolvedValue({ data: selectedTutor })
    createBooking.mockResolvedValue({ data: { id: 77, status: 'PENDING' } })
  })

  it('validates incomplete booking details before advancing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BookingRequestPage />, { route: '/book' })

    await user.click(screen.getByRole('button', { name: 'Review request' }))

    expect(screen.getByText('Choose an available tutor.')).toBeInTheDocument()
    expect(screen.getByText('Choose a subject taught by this tutor.')).toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith('Please check the highlighted booking details.')
  })

  it('submits a selected tutor slot and shows the booking reference', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BookingRequestPage />, { route: '/book?profile=10&tutor=20' })

    await waitFor(() => expect(getTutor).toHaveBeenCalledWith('10'))
    await user.selectOptions(await screen.findByLabelText('Subject'), '3')
    await user.click(screen.getAllByRole('radio')[0])
    await user.type(screen.getByLabelText(/What should the tutor know/), 'Please revise quadratic equations.')
    await user.click(screen.getByRole('button', { name: 'Review request' }))

    expect(screen.getByRole('heading', { name: 'Confirm the lesson details.' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Submit request' }))

    expect(await screen.findByText('#77')).toBeInTheDocument()
    expect(createBooking).toHaveBeenCalledWith({
      tutor_id: 20,
      subject_id: 3,
      mode: 'ONLINE',
      location: '',
      notes: 'Please revise quadratic equations.',
      availability_slot_id: 5,
    })
    expect(toast.success).toHaveBeenCalledWith('Booking request submitted successfully.')
  })
})
