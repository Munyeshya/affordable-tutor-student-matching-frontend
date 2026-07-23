import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '../context/AuthContext.jsx'
import { useLearningLibraryQuery } from '../hooks/useCommonQueries.js'
import { LearningPage } from './LearningPage.jsx'

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useCommonQueries.js', () => ({ useLearningLibraryQuery: vi.fn() }))
vi.mock('../api/services/payments', () => ({
  recordLessonView: vi.fn(() => Promise.resolve()),
  updateLessonProgress: vi.fn(),
}))

const course = {
  id: 31,
  course_id: 7,
  title: 'Algebra foundations',
  subject_name: 'Mathematics',
  academic_level: "O'Level",
  tutor_id: 4,
  tutor_name: 'Alice Tutor',
  completed_lessons: 0,
  total_lessons: 1,
  progress_percent: 0,
  lessons: [{
    id: 12,
    order_number: 1,
    title: 'Linear equations',
    topic: 'Algebra',
    description: 'Learn how to solve a linear equation.',
    duration: 30,
    progress: null,
  }],
}

function renderLearningPage(entry) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/my-courses" element={<LearningPage />} />
          <Route path="/my-courses/:courseId" element={<LearningPage />} />
          <Route path="/my-courses/:courseId/lessons/:lessonId" element={<LearningPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('student course learning hierarchy', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'STUDENT' } })
    useLearningLibraryQuery.mockReturnValue({ data: [course], isLoading: false, isError: false })
  })

  it('shows only the purchased-course library at the index route', () => {
    renderLearningPage('/my-courses')

    expect(screen.getByRole('heading', { name: 'Your learning library' })).toBeInTheDocument()
    expect(screen.getByText('Open course').closest('a')).toHaveAttribute('href', '/my-courses/7')
    expect(screen.queryByRole('heading', { name: 'Curriculum' })).not.toBeInTheDocument()
  })

  it('opens curriculum and lesson content after choosing a course', () => {
    renderLearningPage('/my-courses/7')

    expect(screen.getByRole('heading', { name: 'Curriculum' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Linear equations' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Purchased courses' })).not.toBeInTheDocument()
  })
})
