import React from 'react'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getTutor } from '../api/services/tutors'
import { useAuth } from '../context/AuthContext.jsx'
import { renderWithProviders } from '../test/render.jsx'
import { TutorDetailPage } from './TutorDetailPage.jsx'

vi.mock('../api/services/tutors', () => ({
  getTutor: vi.fn(),
}))
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}))

describe('TutorDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    })
    getTutor.mockResolvedValue({
      data: {
        id: 1,
        user_id: 7,
        full_name: 'Aline Uwase',
        headline: 'Patient mathematics tutor',
        bio: 'Clear and affordable mathematics support.',
        hourly_rate: '8000.00',
        currency: 'RWF',
        location: 'Kigali',
        teaches_online: true,
        teaches_in_person: false,
        average_rating: '4.80',
        review_count: 12,
        subject_levels: [{ subject: 'Mathematics', level: 'SECONDARY_LOWER' }],
        availability_summary: {
          next_available_at: '2030-01-10T08:00:00Z',
        },
        upcoming_availability: [
          {
            id: 31,
            start_datetime: '2030-01-10T08:00:00Z',
            end_datetime: '2030-01-10T09:00:00Z',
            mode: 'ONLINE',
          },
          {
            id: 32,
            start_datetime: '2030-01-10T14:00:00Z',
            end_datetime: '2030-01-10T15:00:00Z',
            mode: 'IN_PERSON',
          },
          {
            id: 33,
            start_datetime: '2030-01-11T10:00:00Z',
            end_datetime: '2030-01-11T11:00:00Z',
            mode: 'ONLINE',
          },
        ],
        reviews: [],
        courses: [{
          id: 11,
          title: 'Algebra Focus',
          description: 'Practice equations through a short structured course.',
          subject: 3,
          subject_name: 'Mathematics',
          academic_level: 'SECONDARY_LOWER',
          price: '12000.00',
          currency: 'RWF',
          thumbnail_url: null,
          lessons: [{
            id: 20,
            order_number: 1,
            title: 'Variables',
            topic: 'Expressions',
            duration: 30,
            average_rating: '4.50',
            review_count: 4,
          }],
        }],
      },
    })
  })

  it('keeps course content full width and formats prices clearly', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/tutors/:id" element={<TutorDetailPage />} />
      </Routes>,
      { route: '/tutors/1' },
    )

    expect(await screen.findByRole('heading', { name: 'Aline Uwase' })).toBeInTheDocument()
    expect(screen.getByText('12,000 RWF / course')).toBeInTheDocument()
    expect(screen.getByText('8,000 RWF / hour')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Request lesson' })).toHaveAttribute(
      'href',
      '/book?tutor=7&profile=1&subject=3',
    )
    expect(screen.getByRole('heading', { name: 'Algebra Focus' }).closest('.tutor-course-overview')).toHaveClass(
      'tutor-course-overview-no-image',
    )
    expect(screen.getAllByLabelText('4.8 out of 5').length).toBeGreaterThan(0)
    expect(screen.getByText('3 open across 2 days')).toBeInTheDocument()
    expect(screen.getByText('2 available times')).toBeInTheDocument()
    expect(screen.getByText('1 available time')).toBeInTheDocument()
    expect(screen.getByText('Times are shown in your local timezone.')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /choose .*online/i })[0]).toHaveAttribute(
      'href',
      '/book?tutor=7&profile=1&slot=31&mode=ONLINE',
    )
  })
})
