import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getTutorEarnings, listPayouts, requestPayout } from '../api/services/payments.js'
import { useAuth } from '../context/AuthContext.jsx'
import { renderWithProviders } from '../test/render.jsx'
import { TutorEarningsPage } from './TutorEarningsPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../api/services/payments.js', () => ({
  getTutorEarnings: vi.fn(),
  listPayouts: vi.fn(),
  requestPayout: vi.fn(),
}))

const earnings = {
  booking_revenue: 12000,
  course_revenue: 8000,
  total_earnings: 20000,
  available_balance: 8000,
  reserved_payouts: 7000,
  paid_payouts: 5000,
  paid_bookings_count: 3,
  paid_course_purchases_count: 2,
  recent_earnings: [
    {
      id: 11,
      kind: 'BOOKING',
      title: 'Mathematics',
      amount: 7000,
      currency: 'RWF',
      earned_at: '2026-07-17T10:00:00Z',
    },
    {
      id: 12,
      kind: 'COURSE',
      title: 'Algebra Foundations',
      amount: 5000,
      currency: 'RWF',
      earned_at: '2026-07-16T10:00:00Z',
    },
  ],
}

describe('TutorEarningsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 4, role: 'TUTOR' },
    })
    getTutorEarnings.mockResolvedValue({ data: earnings })
    listPayouts.mockResolvedValue({
      data: [{
        id: 9,
        amount: 7000,
        status: 'REQUESTED',
        created_at: '2026-07-17T12:00:00Z',
        paid_at: null,
      }],
    })
    requestPayout.mockResolvedValue({ data: { id: 10, status: 'REQUESTED' } })
  })

  it('shows combined income, balances, and payout history', async () => {
    renderWithProviders(<TutorEarningsPage />)

    expect(await screen.findByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('Algebra Foundations')).toBeInTheDocument()
    expect(screen.getByText('Payout request #9')).toBeInTheDocument()
    expect(screen.getAllByText('8,000 RWF').length).toBeGreaterThan(0)
    expect(screen.getAllByText('7,000 RWF').length).toBeGreaterThan(0)
  })

  it('blocks an amount above the available balance before calling the API', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TutorEarningsPage />)

    const input = await screen.findByLabelText('Payout amount')
    fireEvent.change(input, { target: { value: '9000' } })
    await user.click(screen.getByRole('button', { name: 'Request payout' }))

    expect(requestPayout).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('You can request up to 8,000 RWF.')
  })

  it('submits a valid payout and refreshes the page data', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TutorEarningsPage />)

    fireEvent.change(await screen.findByLabelText('Payout amount'), {
      target: { value: '6000' },
    })
    await user.click(screen.getByRole('button', { name: 'Request payout' }))

    await waitFor(() => expect(requestPayout).toHaveBeenCalled())
    expect(requestPayout.mock.calls[0][0]).toEqual({ amount: '6000' })
    expect(toast.success).toHaveBeenCalledWith('Payout request submitted.')
  })
})
