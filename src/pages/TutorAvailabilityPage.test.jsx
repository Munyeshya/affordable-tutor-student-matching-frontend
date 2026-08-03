import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createAvailability,
  deleteAvailability,
  listMyAvailability,
} from '../api/services/availability.js'
import { renderWithProviders } from '../test/render.jsx'
import { TutorAvailabilityPage } from './TutorAvailabilityPage.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../api/services/availability.js', () => ({
  createAvailability: vi.fn(),
  deleteAvailability: vi.fn(),
  listMyAvailability: vi.fn(),
}))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))

const slots = [
  {
    id: 1,
    start_datetime: '2030-03-20T07:00:00Z',
    end_datetime: '2030-03-20T08:00:00Z',
    mode: 'ONLINE',
    is_booked: false,
  },
  {
    id: 2,
    start_datetime: '2030-03-21T12:00:00Z',
    end_datetime: '2030-03-21T13:00:00Z',
    mode: 'IN_PERSON',
    is_booked: true,
  },
]

describe('TutorAvailabilityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listMyAvailability.mockResolvedValue({ data: slots })
    createAvailability.mockResolvedValue({ data: { id: 3 } })
    deleteAvailability.mockResolvedValue({ status: 204 })
    useAuth.mockReturnValue({ user: { profile: { data: { hourly_rate: '15000.00' } } } })
  })

  it('directs tutors to pricing before they can publish availability', async () => {
    useAuth.mockReturnValue({ user: { profile: { data: { hourly_rate: null } } } })
    renderWithProviders(<TutorAvailabilityPage />)

    expect(await screen.findByRole('heading', { name: 'Set your hourly rate first' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publish availability' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set hourly rate' })).toHaveAttribute('href', '/account?section=pricing')
  })

  it('shows open and booked availability while protecting reserved time', async () => {
    renderWithProviders(<TutorAvailabilityPage />)

    expect(await screen.findByText('2 total')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Booked')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1)
    expect(screen.getByText('Reserved by a confirmed lesson')).toBeInTheDocument()
  })

  it('publishes a future availability slot', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TutorAvailabilityPage />)

    await screen.findByText('2 total')
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2030-04-10' } })
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '14:00' } })
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '15:30' } })
    await user.selectOptions(screen.getByLabelText('Teaching mode'), 'IN_PERSON')
    await user.click(screen.getByRole('button', { name: 'Publish availability' }))

    await waitFor(() => expect(createAvailability).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'IN_PERSON',
      start_datetime: expect.any(String),
      end_datetime: expect.any(String),
    }), expect.anything()))
    expect(toast.success).toHaveBeenCalledWith('Availability published successfully.')
  })
})
