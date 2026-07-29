import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createCourseReview,
  listBookingReviews,
  listCourseReviews,
  listEligibleReviews,
} from '../api/services/reviews'
import { useAuth } from '../context/AuthContext.jsx'
import { renderWithProviders } from '../test/render.jsx'
import { ReviewsPage } from './ReviewsPage.jsx'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../api/services/reviews', () => ({
  createBookingReview: vi.fn(),
  createCourseReview: vi.fn(),
  createReviewReport: vi.fn(),
  listBookingReviews: vi.fn(),
  listCourseReviews: vi.fn(),
  listEligibleReviews: vi.fn(),
}))

describe('course review flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'STUDENT' } })
    listEligibleReviews.mockResolvedValue({
      bookings: [],
      courses: [{
        id: 7,
        course_title: 'Algebra foundations',
        tutor_name: 'Alice Tutor',
        lesson_count: 4,
        completed_at: '2026-07-29T10:00:00Z',
      }],
    })
    listBookingReviews.mockResolvedValue({ data: [] })
    listCourseReviews.mockResolvedValue({ data: [] })
    createCourseReview.mockResolvedValue({ data: { id: 51 } })
  })

  it('rates a completed course as one learning experience', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReviewsPage />, { route: '/reviews?course=7' })

    expect(await screen.findByText('4 completed lessons')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /4\s*Very good/i }))
    await user.click(screen.getByRole('button', { name: 'Publish review' }))

    await waitFor(() => expect(createCourseReview).toHaveBeenCalledWith({
      course_id: 7,
      rating: 4,
      comment: '',
    }))
  })
})
