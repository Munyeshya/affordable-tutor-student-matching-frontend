import React from 'react'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listDisputes } from '../api/services/bookings.js'
import { getAdminDashboard } from '../api/services/reports.js'
import { listTutorVerifications } from '../api/services/tutors.js'
import { useAuth } from '../context/AuthContext.jsx'
import { renderWithProviders } from '../test/render.jsx'
import { AdminDashboardPage } from './AdminDashboardPage.jsx'

vi.mock('../api/services/bookings.js', () => ({ listDisputes: vi.fn() }))
vi.mock('../api/services/reports.js', () => ({ getAdminDashboard: vi.fn() }))
vi.mock('../api/services/tutors.js', () => ({ listTutorVerifications: vi.fn() }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))

const analytics = {
  users: { total_students: 1, total_tutors: 2, total_parents: 1, total_admins: 1 },
  tutoring: { total_bookings: 1, completed_bookings: 1 },
  tutor_pipeline: { marketplace_ready_tutors: 1 },
  educational_impact: {
    students_helped_by_period: { daily: 1, weekly: 2, monthly: 3 },
    average_initial_score: 45,
    average_final_score: 75,
    average_improvement: 30,
    highest_improvement: 38,
    students_with_improvement: 2,
    positive_outcome_rate: 100,
    verified_learning_outcomes: 2,
    rejected_improvements: 1,
    most_effective_subjects: [{
      impact_subject_name: 'Mathematics',
      avg_improvement: 34,
      count: 2,
    }],
    most_effective_tutors: [{
      impact_tutor_id: 9,
      impact_tutor_email: 'impact@example.com',
      impact_tutor_name: 'Impact Tutor',
      avg_improvement: 34,
      count: 2,
    }],
  },
  employment_impact: {
    tutors_earning_income: 2,
    estimated_unemployed_youth_supported: 1,
    booking_income_generated: 8000,
    course_income_generated: 8000,
    income_generated_through_platform: 16000,
    tutors_receiving_booking_income: 1,
    tutors_selling_courses: 2,
    employment_data_completion_rate: 100,
    employment_profiles_completed: 2,
    total_tutors_registered: 2,
  },
  courses: {
    published_courses: 3,
    total_lessons: 12,
    total_lesson_views: 24,
    course_purchases: 2,
    most_viewed_lessons: [{
      id: 8,
      title: 'Reading fluency',
      topic: 'Fluency',
      course__title: 'Reading confidence',
      view_count: 14,
    }],
    most_purchased_courses: [{
      course__id: 3,
      course__title: 'English foundations',
      count: 2,
      revenue: 8000,
    }],
  },
  revenue: {
    platform_revenue: 16000,
    booking_revenue: 8000,
    course_revenue: 8000,
    top_earning_tutors: [{
      tutor_id: 4,
      tutor_name: 'Ready Tutor',
      booking_revenue: 8000,
      course_revenue: 5000,
      total: 13000,
    }],
    revenue_by_subject: [{
      subject_name: 'English',
      transactions: 3,
      total: 16000,
    }],
  },
  platform_health: {},
  leaderboards: {},
  trends: {},
}

describe('AdminDashboardPage revenue analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: { first_name: 'Admin' } })
    getAdminDashboard.mockResolvedValue({ data: analytics })
    listTutorVerifications.mockResolvedValue({ data: [] })
    listDisputes.mockResolvedValue({ data: [] })
  })

  it('shows combined paid value, tutor earnings, and subject revenue', async () => {
    renderWithProviders(<AdminDashboardPage />)

    expect(await screen.findByRole('heading', { name: 'Paid marketplace activity' })).toBeInTheDocument()
    expect(await screen.findByText('Ready Tutor')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('3 paid transactions')).toBeInTheDocument()
    expect(screen.getAllByText('RWF 16,000').length).toBeGreaterThan(0)
    expect(screen.getByText(/gross marketplace activity, not ISOMO net profit/i)).toBeInTheDocument()
  })

  it('shows lesson views and the course performance rankings', async () => {
    renderWithProviders(<AdminDashboardPage />)

    expect(await screen.findByRole('heading', { name: 'Course reach and learner activity' })).toBeInTheDocument()
    expect(await screen.findByText('Reading fluency')).toBeInTheDocument()
    expect(screen.getByText('14 views')).toBeInTheDocument()
    expect(screen.getByText('English foundations')).toBeInTheDocument()
    expect(screen.getByText('2 enrollments')).toBeInTheDocument()
    expect(screen.getAllByText('24').length).toBeGreaterThan(0)
    expect(screen.getByText(/only when a signed-in student opens content/i)).toBeInTheDocument()
  })

  it('shows complete verified educational impact and rankings', async () => {
    renderWithProviders(<AdminDashboardPage />)

    expect(await screen.findByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('Impact Tutor')).toBeInTheDocument()
    expect(screen.getByText('Highest gain')).toBeInTheDocument()
    expect(screen.getByText('+38.0%')).toBeInTheDocument()
    expect(screen.getByText('Verified outcomes')).toBeInTheDocument()
    expect(screen.getByText('Rejected outcomes')).toBeInTheDocument()
    expect(screen.getAllByText('2 confirmed outcomes')).toHaveLength(2)
    expect(screen.getByText(/never influence improvement averages/i)).toBeInTheDocument()
  })
})
