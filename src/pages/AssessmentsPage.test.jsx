import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  listAssessmentAttempts,
  listAssessments,
  submitAssessmentAttempt,
} from '../api/services/assessments'
import { useAuth } from '../context/AuthContext.jsx'
import { renderWithProviders } from '../test/render.jsx'
import { AssessmentsPage } from './AssessmentsPage.jsx'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../api/services/assessments', () => ({
  createAssessment: vi.fn(),
  createAssessmentQuestion: vi.fn(),
  getLearningImpact: vi.fn(),
  listAssessmentAttempts: vi.fn(),
  listAssessmentConfirmations: vi.fn(() => Promise.resolve({ data: [] })),
  listAssessments: vi.fn(),
  submitAssessmentAttempt: vi.fn(),
  submitAssessmentConfirmation: vi.fn(),
}))

const baseAssessment = {
  context_type: 'COURSE',
  course: 7,
  context_title: 'Algebra foundations',
  description: 'Checks course knowledge.',
  expected_knowledge_outcomes: 'Solve an equation.',
  instructions: '',
  marks: 1,
  can_attempt: true,
  questions: [{
    id: 101,
    question: 'What is x when x + 1 = 2?',
    option_a: '1',
    option_b: '2',
    option_c: '',
    option_d: '',
  }],
}

describe('assessment completion refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: { role: 'STUDENT' } })
    listAssessments.mockResolvedValue({
      data: [
        { ...baseAssessment, id: 1, title: 'Initial check', attempt_type: 'PRE_TEST' },
        { ...baseAssessment, id: 2, title: 'Final check', attempt_type: 'POST_TEST' },
      ],
    })
    let submitted = false
    listAssessmentAttempts.mockImplementation(() => Promise.resolve({
      data: submitted ? [{
        id: 41,
        assessment: 1,
        course: 7,
        context_type: 'COURSE',
        attempt_type: 'PRE_TEST',
        percentage: 100,
        submitted_at: '2026-07-29T10:00:00Z',
      }] : [],
    }))
    submitAssessmentAttempt.mockImplementation(() => {
      submitted = true
      return Promise.resolve({ data: { percentage: 100 } })
    })
  })

  it('reloads attempt eligibility before returning to the assessment cards', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <AssessmentsPage contextType="COURSE" contextId={7} contextTitle="Algebra foundations" embedded learningCompleted />,
    )

    const startButtons = await screen.findAllByRole('button', { name: 'Start assessment' })
    await user.click(startButtons[0])
    await user.click(await screen.findByRole('radio', { name: /1/ }))
    await user.click(screen.getByRole('button', { name: 'Submit assessment' }))

    await waitFor(() => expect(listAssessmentAttempts).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('100%')).toBeInTheDocument()
    expect(screen.queryByText('Initial assessment required')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start assessment' })).toBeEnabled()
  })
})
