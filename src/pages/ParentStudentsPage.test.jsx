import React from 'react'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getParentDashboard, getParentStudent } from '../api/services/parents.js'
import { renderWithProviders } from '../test/render.jsx'
import { ParentStudentDetailPage } from './ParentStudentDetailPage.jsx'
import { ParentStudentsPage } from './ParentStudentsPage.jsx'

vi.mock('../api/services/parents.js', () => ({
  getParentDashboard: vi.fn(),
  getParentStudent: vi.fn(),
}))

const linkedStudent = {
  link: { id: 4, student: 12, label: 'My daughter', is_primary: true },
  student: {
    id: 7,
    full_name: 'Aline Mukamana',
    email: 'aline@example.com',
    level: 'Primary',
    school_name: 'Kigali Primary School',
    subjects_needing_help_names: ['Mathematics'],
    prefers_online: true,
  },
  booking_stats: {
    total_bookings: 3,
    confirmed_bookings: 1,
    completed_bookings: 2,
    pending_bookings: 0,
  },
  learning_stats: { confirmed_results: 1, average_improvement: 24.5 },
}

describe('parent student experience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getParentDashboard.mockResolvedValue({
      data: { linked_students: [linkedStudent], summary: { linked_students: 1 } },
    })
    getParentStudent.mockResolvedValue({
      data: {
        ...linkedStudent,
        bookings: [{
          id: 31,
          status: 'CONFIRMED',
          subject_name: 'Mathematics',
          tutor_name: 'Eric Tutor',
          currency: 'RWF',
          total_amount: 8000,
          start_datetime: '2030-01-10T10:00:00Z',
          progress: {
            progress_percent: 65,
            summary: 'Aline now solves equivalent fractions.',
            topics_covered: 'Equivalent fractions',
            next_steps: 'Mixed numbers',
            updated_by_name: 'Eric Tutor',
            updated_at: '2030-01-09T10:00:00Z',
          },
        }],
        learning_outcomes: [],
      },
    })
  })

  it('presents linked students as a directory with individual profile links', async () => {
    renderWithProviders(<ParentStudentsPage />)

    expect(await screen.findByRole('heading', { name: 'Aline Mukamana' })).toBeInTheDocument()
    expect(screen.getAllByText('24.5%')).toHaveLength(2)
    expect(screen.getByRole('link', { name: /View student/ })).toHaveAttribute('href', '/parent-students/12')
  })

  it('shows active booking progress on the individual student profile', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/parent-students/:studentId" element={<ParentStudentDetailPage />} />
      </Routes>,
      { route: '/parent-students/12' },
    )

    expect(await screen.findByRole('heading', { name: 'Aline Mukamana' })).toBeInTheDocument()
    expect(screen.getByText('65%')).toBeInTheDocument()
    expect(screen.getByText('Aline now solves equivalent fractions.')).toBeInTheDocument()
    expect(getParentStudent).toHaveBeenCalledWith('12')
  })
})
