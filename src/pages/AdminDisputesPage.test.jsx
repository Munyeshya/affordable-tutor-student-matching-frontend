import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { decideDispute, getDispute, listDisputes } from '../api/services/bookings.js'
import { useAuth } from '../context/AuthContext.jsx'
import { renderWithProviders } from '../test/render.jsx'
import { AdminDisputesPage } from './AdminDisputesPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../api/services/bookings.js', () => ({
  decideDispute: vi.fn(),
  getDispute: vi.fn(),
  listDisputes: vi.fn(),
}))

const dispute = {
  id: 7,
  booking_id: 34,
  reported_by_name: 'Aline Student',
  reported_by_email: 'aline@example.com',
  reported_against_name: 'Eric Tutor',
  reported_against_email: 'eric@example.com',
  reason: 'The tutor did not attend the confirmed lesson.',
  status: 'OPEN',
  admin_comment: '',
  reviewed_by: null,
  reviewed_by_name: '',
  reviewed_at: null,
  resolved_at: null,
  decisions: [],
  created_at: '2026-07-17T10:00:00Z',
  booking_context: {
    subject: 'Mathematics',
    status: 'CONFIRMED',
    mode: 'ONLINE',
    total_amount: '15000.00',
    currency: 'RWF',
    created_at: '2026-07-16T08:00:00Z',
  },
}

describe('AdminDisputesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: { id: 2, role: 'ADMIN', email: 'admin@isomo.test' },
      isAuthenticated: true,
    })
    listDisputes.mockResolvedValue({ data: [dispute] })
    getDispute.mockResolvedValue({
      data: {
        ...dispute,
        reviewed_by: 2,
        reviewed_by_name: 'ISOMO Admin',
        reviewed_at: '2026-07-18T08:00:00Z',
      },
    })
    decideDispute.mockResolvedValue({
      data: {
        ...dispute,
        status: 'RESOLVED',
        reviewed_by: 2,
        reviewed_by_name: 'ISOMO Admin',
        reviewed_at: '2026-07-18T08:00:00Z',
        decisions: [{
          id: 1,
          status: 'RESOLVED',
          comment: 'The evidence supports resolving this case.',
          admin_name: 'ISOMO Admin',
          created_at: '2026-07-18T08:05:00Z',
        }],
      },
    })
  })

  it('requires the admin to inspect evidence before decision controls appear', async () => {
    const browserUser = userEvent.setup()
    renderWithProviders(<AdminDisputesPage />)

    expect(await screen.findByText('Dispute #7')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument()

    await browserUser.click(screen.getByRole('button', { name: 'Inspect case' }))

    expect(await screen.findByRole('heading', { name: 'Relevant booking context' })).toBeInTheDocument()
    expect(screen.getByText('The tutor did not attend the confirmed lesson.')).toBeInTheDocument()
    expect(screen.getByText('ISOMO Admin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeInTheDocument()
    expect(getDispute).toHaveBeenCalledWith(7)
  })

  it('submits a reasoned final decision from the inspected case', async () => {
    const browserUser = userEvent.setup()
    renderWithProviders(<AdminDisputesPage />)

    await browserUser.click(await screen.findByRole('button', { name: 'Inspect case' }))
    await browserUser.click(await screen.findByRole('button', { name: 'Resolve' }))
    await browserUser.type(
      screen.getByLabelText('Required decision reason'),
      'The evidence supports resolving this case.',
    )
    await browserUser.click(screen.getByRole('button', { name: 'Resolve dispute' }))

    await waitFor(() => expect(decideDispute).toHaveBeenCalledWith(7, {
      status: 'RESOLVED',
      comment: 'The evidence supports resolving this case.',
    }))
    expect(toast.success).toHaveBeenCalledWith('Resolve dispute completed.')
  })
})
