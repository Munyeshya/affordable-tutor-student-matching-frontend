import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePublicTutorsQuery, useSubjectsQuery } from '../../hooks/useCommonQueries.js'
import { renderWithProviders } from '../../test/render.jsx'
import { TutorsPage } from './TutorsPage.jsx'

vi.mock('../../hooks/useCommonQueries.js', () => ({
  usePublicTutorsQuery: vi.fn(),
  useSubjectsQuery: vi.fn(),
}))

const tutor = {
  id: 10,
  user_id: 20,
  full_name: 'Alice Uwase',
  headline: 'Patient mathematics tutor',
  hourly_rate: 8000,
  currency: 'RWF',
  location: 'Kigali',
  teaches_online: true,
  teaches_in_person: false,
  average_rating: 4.8,
  review_count: 12,
  match_score: 94,
  within_budget: true,
  match_reasons: ['Within your hourly budget', 'Highly rated by students'],
  subject_levels: [{ subject: 'Mathematics', level: 'SECONDARY_UPPER' }],
  availability_summary: {
    has_availability: true,
    available_slot_count: 2,
    next_available_at: '2030-01-10T10:00:00Z',
  },
}

describe('TutorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSubjectsQuery.mockReturnValue({ data: [{ id: 1, name: 'Mathematics' }], isLoading: false })
    usePublicTutorsQuery.mockReturnValue({
      data: { count: 1, next: null, previous: null, results: [tutor] },
      isLoading: false,
      isFetching: false,
      isError: false,
    })
  })

  it('loads URL filters and presents affordability-first tutor results', () => {
    renderWithProviders(<TutorsPage />, { route: '/tutors?q=Alice&budget=9000' })

    expect(screen.getByRole('heading', { name: 'Alice Uwase' })).toBeInTheDocument()
    expect(screen.getByText('8,000 RWF / hour')).toBeInTheDocument()
    expect(screen.getByText('Within budget')).toBeInTheDocument()
    expect(screen.getByLabelText('Match score 94 out of 100')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View profile' })).toHaveAttribute('href', '/tutors/10')
    expect(usePublicTutorsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'Alice',
        budget: '9000',
        page: 1,
        page_size: 9,
        sort: 'best_match',
      }),
      expect.objectContaining({ placeholderData: expect.any(Function) }),
    )
  })

  it('shows a clear validation error for an inverted rate range', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TutorsPage />, { route: '/tutors' })

    await user.clear(screen.getByLabelText('Minimum rate'))
    await user.type(screen.getByLabelText('Minimum rate'), '10000')
    await user.clear(screen.getByLabelText('Maximum rate'))
    await user.type(screen.getByLabelText('Maximum rate'), '5000')
    await user.click(screen.getByRole('button', { name: 'Show tutors' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Maximum rate must be greater than or equal to minimum rate.')
  })

  it('renders loading skeletons and API failure feedback', () => {
    usePublicTutorsQuery.mockReturnValueOnce({
      data: null,
      isLoading: true,
      isFetching: true,
      isError: false,
    })
    const { unmount } = renderWithProviders(<TutorsPage />, { route: '/tutors' })
    expect(screen.getByRole('heading', { name: 'Finding tutors...' })).toBeInTheDocument()
    unmount()

    usePublicTutorsQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: { code: 'ERR_NETWORK' },
      refetch: vi.fn(),
    })
    renderWithProviders(<TutorsPage />, { route: '/tutors' })
    expect(screen.getByRole('alert')).toHaveTextContent('The server could not be reached.')
  })
})
