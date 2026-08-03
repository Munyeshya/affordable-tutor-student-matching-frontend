import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'

import { createTutorSubject, listMyCourses, listTutorSubjects } from '../api/services/catalog.js'
import { renderWithProviders } from '../test/render.jsx'
import { TutorSubjectPage } from './TutorSubjectPage.jsx'
import { TutorTeachingPage } from './TutorTeachingPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../api/services/catalog.js', () => ({
  createTutorSubject: vi.fn(),
  listMyCourses: vi.fn(),
  listTutorSubjects: vi.fn(),
}))

const teachingAreas = [{
  id: 4,
  subject: 9,
  subject_name: 'Mathematics',
  level: 'SECONDARY_LOWER',
  level_display: "O'Level",
  experience_years: 3,
}]

const courses = [{
  id: 21,
  subject: 9,
  subject_name: 'Mathematics',
  title: 'O-Level Algebra',
  academic_level: 'SECONDARY_LOWER',
  status: 'DRAFT',
  price: '15000.00',
  lessons: [],
}]

describe('tutor teaching hierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listTutorSubjects.mockResolvedValue({ data: teachingAreas })
    listMyCourses.mockResolvedValue({ data: courses })
    createTutorSubject.mockResolvedValue({ data: { id: 5 } })
  })

  it('lists teaching areas first and submits a typed subject name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TutorTeachingPage />)

    expect(await screen.findByRole('link', { name: /Mathematics/ })).toHaveAttribute('href', '/tutor-teaching/subjects/4')
    await user.type(screen.getByRole('textbox', { name: /Subject name/ }), 'Creative Writing')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Education level' }), 'UNIVERSITY')
    await user.click(screen.getByRole('button', { name: 'Add teaching subject' }))

    await waitFor(() => expect(createTutorSubject).toHaveBeenCalledWith({
      subject_input: 'Creative Writing',
      level: 'UNIVERSITY',
      experience_years: null,
    }))
  })

  it('opens courses within the chosen subject and level', async () => {
    renderWithProviders(<Routes><Route path="/tutor-teaching/subjects/:tutorSubjectId" element={<TutorSubjectPage />} /></Routes>, { route: '/tutor-teaching/subjects/4' })

    expect(await screen.findByRole('heading', { name: 'O-Level Algebra' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create course' })).toHaveAttribute(
      'href',
      '/tutor-teaching/courses/new?subject=9&level=SECONDARY_LOWER&teachingArea=4',
    )
    expect(screen.getByRole('link', { name: 'Assessments' })).toHaveAttribute('href', '/tutor-teaching/courses/21/assessments')
  })
})
