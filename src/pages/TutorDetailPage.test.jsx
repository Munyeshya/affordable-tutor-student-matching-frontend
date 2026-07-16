import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
            id: 34,
            start_datetime: '2030-01-10T15:00:00Z',
            end_datetime: '2030-01-10T16:00:00Z',
            mode: 'ONLINE',
          },
          {
            id: 35,
            start_datetime: '2030-01-10T16:00:00Z',
            end_datetime: '2030-01-10T17:00:00Z',
            mode: 'ONLINE',
          },
          {
            id: 36,
            start_datetime: '2030-01-10T17:00:00Z',
            end_datetime: '2030-01-10T18:00:00Z',
            mode: 'ONLINE',
          },
          {
            id: 37,
            start_datetime: '2030-01-10T18:00:00Z',
            end_datetime: '2030-01-10T19:00:00Z',
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

  it('keeps course content full width and presents interactive calendar availability', async () => {
    const user = userEvent.setup()
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
    expect(screen.getByText('7 open across 2 days')).toBeInTheDocument()
    expect(screen.getByText('6 open')).toBeInTheDocument()
    expect(screen.getByText('Times are shown in your local timezone.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tutor availability calendar' })).toBeInTheDocument()
    expect(screen.getAllByText('Choose')).toHaveLength(4)
    expect(screen.getByText('1-4 of 6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getAllByRole('link', { name: /choose .*online/i })[0]).toHaveAttribute(
      'href',
      '/book?tutor=7&profile=1&slot=31&mode=ONLINE',
    )

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getAllByText('Choose')).toHaveLength(2)
    expect(screen.getByText('5-6 of 6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('link', { name: /choose .*in person/i })).toHaveAttribute(
      'href',
      '/book?tutor=7&profile=1&slot=37&mode=IN_PERSON',
    )

    const unavailableDate = screen.getByRole('button', {
      name: /12 January 2030, no available lesson times/i,
    })
    await user.click(unavailableDate)
    expect(screen.getByRole('heading', { name: 'No available lesson times' })).toBeInTheDocument()
    expect(screen.getByText(/has not published an open slot for this date/i)).toBeInTheDocument()

    const availableDate = screen.getByRole('button', {
      name: /10 January 2030, 6 available lesson times/i,
    })
    await user.click(availableDate)
    expect(screen.queryByRole('heading', { name: 'No available lesson times' })).not.toBeInTheDocument()
    expect(screen.getByText('6 open')).toBeInTheDocument()
    expect(screen.getByText('1-4 of 6')).toBeInTheDocument()
  })
})
