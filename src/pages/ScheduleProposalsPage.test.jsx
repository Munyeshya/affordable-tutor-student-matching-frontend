import React from 'react'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '../context/AuthContext.jsx'
import { useScheduleProposalsQuery } from '../hooks/useCommonQueries.js'
import { renderWithProviders } from '../test/render.jsx'
import { ScheduleProposalsPage } from './ScheduleProposalsPage.jsx'

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useCommonQueries.js', () => ({ useScheduleProposalsQuery: vi.fn() }))
vi.mock('../api/services/bookings.js', () => ({ updateScheduleProposal: vi.fn() }))

describe('ScheduleProposalsPage', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { id: 20, role: 'TUTOR' } })
    useScheduleProposalsQuery.mockReturnValue({
      data: [{
        id: 12,
        requested_by: 4,
        requester_name: 'Parent One',
        tutor: 20,
        tutor_name: 'Tutor One',
        student_name: 'Student One',
        subject_name: 'Mathematics',
        status: 'PENDING',
        current_revision_number: 1,
        can_respond: true,
        revisions: [{
          id: 31,
          revision_number: 1,
          proposed_by_name: 'Parent One',
          created_at: '2030-01-01T10:00:00Z',
        }],
        current_revision: {
          mode: 'ONLINE',
          location: '',
          timezone: 'Africa/Kigali',
          estimated_total: '24000.00',
          currency: 'RWF',
          message: 'Weekly support',
          sessions: [
            { id: 1, start_datetime: '2030-01-10T14:00:00Z', end_datetime: '2030-01-10T15:00:00Z' },
            { id: 2, start_datetime: '2030-01-17T14:00:00Z', end_datetime: '2030-01-17T15:00:00Z' },
          ],
        },
      }],
      isLoading: false,
      isError: false,
    })
  })

  it('shows the current schedule and negotiation actions to the tutor', () => {
    renderWithProviders(<ScheduleProposalsPage />, { route: '/schedule-proposals?proposal=12' })

    expect(screen.getByRole('heading', { name: /Mathematics with Parent One/i })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accept schedule' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Counter-offer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
  })
})
