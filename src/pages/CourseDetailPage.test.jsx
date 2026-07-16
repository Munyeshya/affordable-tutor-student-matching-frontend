import React from 'react'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPublicCourse } from '../api/services/catalog'
import { useAuth } from '../context/AuthContext.jsx'
import { renderWithProviders } from '../test/render.jsx'
import { CourseDetailPage } from './CourseDetailPage.jsx'

vi.mock('../api/services/catalog', () => ({
  getPublicCourse: vi.fn(),
}))
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}))

describe('CourseDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    })
    getPublicCourse.mockResolvedValue({
      data: {
        id: 9,
        tutor: 4,
        tutor_name: 'Aline Tutor',
        title: 'Algebra Foundations',
        description: 'Build confidence with equations and practical problem solving.',
        subject_name: 'Mathematics',
        academic_level: 'SECONDARY_LOWER',
        price: '12000.00',
        lesson_count: 2,
        total_duration_minutes: 70,
        lessons: [{
          id: 21,
          title: 'Understanding variables',
          topic: 'Variables and expressions',
          duration: 30,
          order_number: 1,
          is_preview: true,
        }],
        curriculum: [
          {
            id: 21,
            title: 'Understanding variables',
            topic: 'Variables and expressions',
            description: 'Recognize variables and translate simple statements.',
            duration: 30,
            order_number: 1,
            is_preview: true,
          },
          {
            id: 22,
            title: 'Solving linear equations',
            topic: 'Linear equations',
            description: 'Solve one-step and two-step equations.',
            duration: 40,
            order_number: 2,
            is_preview: false,
          },
        ],
      },
    })
  })

  it('shows the full buyer checklist before offering enrollment', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/courses/:id" element={<CourseDetailPage />} />
      </Routes>,
      { route: '/courses/9' },
    )

    expect(await screen.findByRole('heading', { name: 'Algebra Foundations' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'A clear checklist of the learning journey.' })).toBeInTheDocument()
    expect(screen.getAllByText('Variables and expressions')).toHaveLength(2)
    expect(screen.getAllByText('Linear equations')).toHaveLength(2)
    expect(screen.getByText('Solve one-step and two-step equations.')).toBeInTheDocument()
    expect(screen.getByText('2 structured lessons')).toBeInTheDocument()
    expect(screen.getByText('1 hr 10 min of listed learning content')).toBeInTheDocument()
    expect(screen.getByText('Included after enrollment')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in to buy this course' })).toHaveAttribute('href', '/sign-in')
  })
})
