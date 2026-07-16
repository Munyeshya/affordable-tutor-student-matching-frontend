import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAdminCourse, listAdminCourses, moderateAdminCourse } from '../api/services/adminCourses.js'
import { useSubjectsQuery } from '../hooks/useCommonQueries.js'
import { renderWithProviders } from '../test/render.jsx'
import { AdminCoursesPage } from './AdminCoursesPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../hooks/useCommonQueries.js', () => ({ useSubjectsQuery: vi.fn() }))
vi.mock('../api/services/adminCourses.js', () => ({
  getAdminCourse: vi.fn(),
  listAdminCourses: vi.fn(),
  moderateAdminCourse: vi.fn(),
}))

const course = {
  id: 51,
  title: 'Affordable Algebra Foundations',
  description: 'A structured algebra course for secondary learners.',
  subject_name: 'Mathematics',
  academic_level: 'Secondary upper level',
  tutor_name: 'Alice Uwase',
  tutor_email: 'alice@isomo.test',
  tutor_verification_status: 'APPROVED',
  tutor_marketplace_ready: true,
  status: 'PENDING_REVIEW',
  price: 12000,
  lesson_count: 1,
  submitted_at: '2026-07-10T10:00:00Z',
  lessons: [{
    id: 1,
    order_number: 1,
    title: 'Linear equations',
    topic: 'Solving equations',
    duration: 45,
    description: 'Build equation-solving confidence.',
    is_preview: true,
    video_file_url: null,
    video_url: null,
  }],
  moderation_history: [],
}

describe('AdminCoursesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSubjectsQuery.mockReturnValue({ data: [{ id: 1, name: 'Mathematics' }] })
    listAdminCourses.mockResolvedValue({ data: { count: 1, next: null, previous: null, results: [course] } })
    getAdminCourse.mockResolvedValue({ data: course })
    moderateAdminCourse.mockResolvedValue({ data: { ...course, status: 'PUBLISHED' } })
  })

  it('previews lesson content and publishes an eligible submission', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminCoursesPage />)

    await user.click(await screen.findByRole('button', { name: 'Preview and review' }))
    expect(await screen.findByRole('dialog')).toHaveTextContent('Linear equations')
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    await user.click(screen.getByRole('button', { name: 'Publish course' }))

    await waitFor(() => expect(moderateAdminCourse).toHaveBeenCalledWith(51, {
      status: 'PUBLISHED',
      reason: '',
    }))
    expect(toast.success).toHaveBeenCalledWith('Publish course completed.')
  })
})
