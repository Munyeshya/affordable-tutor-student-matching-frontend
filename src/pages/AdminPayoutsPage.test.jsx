import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  decidePayout,
  getAdminPayoutSummary,
  getPayoutHistory,
  listAdminPayouts,
} from '../api/services/payments.js'
import { renderWithProviders } from '../test/render.jsx'
import { AdminPayoutsPage } from './AdminPayoutsPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../api/services/payments.js', () => ({
  decidePayout: vi.fn(),
  getAdminPayoutSummary: vi.fn(),
  getPayoutHistory: vi.fn(),
  listAdminPayouts: vi.fn(),
}))

const payout = {
  id: 14,
  tutor: 7,
  tutor_name: 'Aline Uwase',
  amount: '25000.00',
  status: 'REQUESTED',
  paid_at: null,
  created_at: '2026-07-18T10:00:00Z',
  decisions: [],
}

describe('AdminPayoutsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listAdminPayouts.mockResolvedValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [payout],
      },
    })
    getAdminPayoutSummary.mockResolvedValue({
      data: {
        active_count: 1,
        active_amount: 25000,
        statuses: {
          REQUESTED: { count: 1, amount: 25000 },
          APPROVED: { count: 0, amount: 0 },
          PAID: { count: 0, amount: 0 },
          REJECTED: { count: 0, amount: 0 },
        },
      },
    })
    getPayoutHistory.mockResolvedValue({ data: [] })
    decidePayout.mockResolvedValue({
      data: { ...payout, status: 'APPROVED' },
    })
  })

  it('shows the payout queue and aggregate amounts', async () => {
    renderWithProviders(<AdminPayoutsPage />)

    expect(await screen.findByText('Aline Uwase')).toBeInTheDocument()
    expect(screen.getAllByText('25,000 RWF').length).toBeGreaterThan(0)
    expect(screen.getByText('1 matching payouts')).toBeInTheDocument()
    expect(screen.getByText('Requested funds remain reserved during review.')).toBeInTheDocument()
  })

  it('opens a request, reviews history, and approves it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminPayoutsPage />)

    await user.click(await screen.findByRole('button', { name: 'Review payout' }))
    expect(await screen.findByRole('dialog')).toHaveTextContent('25,000 RWF')
    await user.click(screen.getByRole('button', { name: 'Approve request' }))
    fireEvent.change(screen.getByLabelText('Decision note (optional)'), {
      target: { value: 'Balance and identity reviewed.' },
    })
    await user.click(screen.getByRole('button', { name: 'Approve request' }))

    await waitFor(() => expect(decidePayout).toHaveBeenCalled())
    expect(decidePayout.mock.calls[0][0]).toBe(14)
    expect(decidePayout.mock.calls[0][1]).toEqual({
      status: 'APPROVED',
      reason: 'Balance and identity reviewed.',
    })
    expect(toast.success).toHaveBeenCalledWith('Approve request completed.')
  })

  it('requires a clear reason before rejecting a request', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminPayoutsPage />)

    await user.click(await screen.findByRole('button', { name: 'Review payout' }))
    await user.click(screen.getByRole('button', { name: 'Reject request' }))

    expect(screen.getByRole('button', { name: 'Reject request' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Required rejection reason'), {
      target: { value: 'Bank account details do not match.' },
    })
    await user.click(screen.getByRole('button', { name: 'Reject request' }))

    await waitFor(() => expect(decidePayout).toHaveBeenCalled())
    expect(decidePayout.mock.calls[0][1]).toEqual({
      status: 'REJECTED',
      reason: 'Bank account details do not match.',
    })
  })
})
