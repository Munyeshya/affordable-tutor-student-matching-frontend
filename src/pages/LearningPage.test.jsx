import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '../context/AuthContext.jsx'
import { useLearningLibraryQuery } from '../hooks/useCommonQueries.js'
import { listAssessmentAttempts, listAssessments } from '../api/services/assessments'
import { LearningPage } from './LearningPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useCommonQueries.js', () => ({ useLearningLibraryQuery: vi.fn() }))
vi.mock('../api/services/payments', () => ({
  recordLessonView: vi.fn(() => Promise.resolve()),
  updateLessonProgress: vi.fn(),
}))
vi.mock('../api/services/assessments', () => ({
  listAssessments: vi.fn(() => Promise.resolve({ data: [] })),
  listAssessmentAttempts: vi.fn(() => Promise.resolve({ data: [] })),
  listAssessmentConfirmations: vi.fn(() => Promise.resolve({ data: [] })),
  submitAssessmentAttempt: vi.fn(),
  submitAssessmentConfirmation: vi.fn(),
  createAssessment: vi.fn(),
  createAssessmentQuestion: vi.fn(),
  getLearningImpact: vi.fn(),
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
    vi.clearAllMocks()
    useAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'STUDENT' } })
    useLearningLibraryQuery.mockReturnValue({ data: [course], isLoading: false, isError: false })
    listAssessments.mockResolvedValue({ data: [] })
    listAssessmentAttempts.mockResolvedValue({ data: [] })
  })

  it('shows only the purchased-course library at the index route', () => {
    renderLearningPage('/my-courses')

    expect(screen.getByRole('heading', { name: 'Your learning library' })).toBeInTheDocument()
    expect(screen.getByText('Open course').closest('a')).toHaveAttribute('href', '/my-courses/7')
    expect(screen.queryByRole('heading', { name: 'Curriculum' })).not.toBeInTheDocument()
  })

  it('opens curriculum, lesson content, and course assessments after choosing a course', async () => {
    renderLearningPage('/my-courses/7')

    expect(screen.getByRole('heading', { name: 'Curriculum' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Linear equations' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Course assessments' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Purchased courses' })).not.toBeInTheDocument()
  })

  it('locks the final assessment until the initial assessment is submitted', async () => {
    const user = userEvent.setup()
    listAssessments.mockResolvedValue({
      data: [
        { id: 1, course: 7, course_id: 7, context_type: 'COURSE', context_title: 'Algebra foundations', attempt_type: 'PRE_TEST', title: 'Initial algebra check', description: 'Starting knowledge', expected_knowledge_outcomes: 'Solve a basic equation', marks: 1, can_attempt: true, availability_message: '', questions: [{ id: 101, question: '2 + 2?', option_a: '4', option_b: '5' }] },
        { id: 2, course: 7, course_id: 7, context_type: 'COURSE', context_title: 'Algebra foundations', attempt_type: 'POST_TEST', title: 'Final algebra check', description: 'Final knowledge', expected_knowledge_outcomes: 'Solve a basic equation', marks: 1, can_attempt: false, availability_message: 'Complete the initial assessment before taking the final assessment.', questions: [{ id: 102, question: '3 + 3?', option_a: '6', option_b: '7' }] },
      ],
    })

    renderLearningPage('/my-courses/7/lessons/12')

    expect(await screen.findByText('Initial assessment required')).toBeInTheDocument()
    const startButtons = screen.getAllByRole('button', { name: 'Start assessment' })
    expect(startButtons).toHaveLength(2)

    await user.click(startButtons[1])

    expect(toast.error).toHaveBeenCalledWith('Complete the initial assessment first.')
    expect(screen.queryByRole('button', { name: 'Exit quiz' })).not.toBeInTheDocument()
  })
})
