import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  decideAdminReviewReport,
  getAdminReviewReport,
  listAdminReviewReports,
} from '../api/services/reviews.js'
import { renderWithProviders } from '../test/render.jsx'
import { AdminReviewModerationPage } from './AdminReviewModerationPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../api/services/reviews.js', () => ({
  decideAdminReviewReport: vi.fn(),
  getAdminReviewReport: vi.fn(),
  listAdminReviewReports: vi.fn(),
}))

const report = {
  id: 41,
  review_type: 'BOOKING',
  context_label: 'Mathematics tutoring session',
  rating: 1,
  comment: 'The original student feedback.',
  reporter_name: 'Alice Tutor',
  reporter_email: 'alice@isomo.test',
  author_name: 'Test Student',
  tutor_name: 'Alice Tutor',
  category: 'PRIVACY',
  category_display: 'Privacy concern',
  details: 'This review contains private contact information.',
  visibility_status: 'VISIBLE',
  status: 'OPEN',
  created_at: '2026-07-10T10:00:00Z',
  decisions: [],
}

describe('AdminReviewModerationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listAdminReviewReports.mockResolvedValue({
      data: { count: 1, next: null, previous: null, results: [report] },
    })
    getAdminReviewReport.mockResolvedValue({ data: report })
    decideAdminReviewReport.mockResolvedValue({ data: { ...report, visibility_status: 'HIDDEN' } })
  })

  it('loads the quality queue and preserves the original evidence in the dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminReviewModerationPage />)

    expect(await screen.findByText('Mathematics tutoring session')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Inspect report' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('The original student feedback.')).toBeInTheDocument()
    expect(screen.getByText(/rating and comment are read-only/i)).toBeInTheDocument()
  })

  it('requires a reason and sends a traceable hide decision', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminReviewModerationPage />)
    await user.click(await screen.findByRole('button', { name: 'Inspect report' }))
    await screen.findByText('The original student feedback.')
    await user.click(screen.getByRole('button', { name: 'Hide' }))
    await user.type(screen.getByLabelText('Required moderation reason'), 'Private information is visible in the feedback.')
    await user.click(screen.getByRole('button', { name: 'Hide review' }))

    await waitFor(() => expect(decideAdminReviewReport).toHaveBeenCalledWith(41, {
      action: 'HIDE',
      reason: 'Private information is visible in the feedback.',
    }))
    expect(toast.success).toHaveBeenCalledWith('Hide review completed.')
  })
})
