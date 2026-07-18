import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  decideTutorVerification,
  listTutorVerifications,
  previewTutorDocument,
  reviewTutorDocument,
} from '../api/services/tutors.js'
import { useAuth } from '../context/AuthContext.jsx'
import { renderWithProviders } from '../test/render.jsx'
import { AdminTutorReviewsPage } from './AdminTutorReviewsPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../api/services/tutors.js', () => ({
  decideTutorVerification: vi.fn(),
  listTutorVerifications: vi.fn(),
  previewTutorDocument: vi.fn(),
  reviewTutorDocument: vi.fn(),
}))

const documents = [
  {
    id: 10,
    doc_type: 'ID',
    doc_type_display: 'National ID',
    file: '/media/id.pdf',
    status: 'PENDING',
    status_display: 'Pending',
  },
  {
    id: 11,
    doc_type: 'CERTIFICATE',
    doc_type_display: 'Qualification certificate',
    file: '/media/certificate.pdf',
    status: 'APPROVED',
    status_display: 'Approved',
  },
]

const verification = {
  id: 1,
  tutor_name: 'Aline Tutor',
  tutor_email: 'aline@example.com',
  profile_image_url: null,
  status: 'PENDING',
  created_at: '2026-07-15T09:00:00Z',
  documents,
  missing_required_documents: [],
  document_summary: {
    all_required_uploaded: true,
    all_required_approved: false,
    has_blocking_issues: false,
    status_counts: { APPROVED: 1, PENDING: 1 },
  },
}

describe('AdminTutorReviewsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 99, role: 'ADMIN', email: 'admin@isomo.rw' },
    })
    listTutorVerifications.mockResolvedValue({ data: [verification] })
    reviewTutorDocument.mockResolvedValue({ data: { ...documents[0], status: 'APPROVED' } })
    decideTutorVerification.mockResolvedValue({ data: { ...verification, status: 'APPROVED' } })
    previewTutorDocument.mockResolvedValue({
      data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
      headers: { 'content-type': 'application/pdf' },
    })
    window.URL.createObjectURL = vi.fn(() => 'blob:verification-document')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('keeps document review and final tutor approval workflows available', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTutorReviewsPage />)

    expect(await screen.findByRole('heading', { name: 'Aline Tutor' })).toBeInTheDocument()
    expect(screen.getAllByText('Ready to decide').length).toBeGreaterThan(0)

    await user.click(screen.getAllByRole('button', { name: 'Approve document' })[0])
    await waitFor(() => expect(reviewTutorDocument).toHaveBeenCalled())
    expect(reviewTutorDocument.mock.calls[0][0]).toBe(10)
    expect(reviewTutorDocument.mock.calls[0][1]).toEqual({ status: 'APPROVED' })

    await user.type(
      screen.getByLabelText('Tutor verification decision note'),
      'Identity and qualification evidence reviewed.',
    )
    await user.click(screen.getByRole('button', { name: 'Approve tutor' }))

    await waitFor(() => expect(decideTutorVerification).toHaveBeenCalled())
    expect(decideTutorVerification.mock.calls[0][0]).toBe(1)
    expect(decideTutorVerification.mock.calls[0][1]).toEqual({
      status: 'APPROVED',
      reason: 'Identity and qualification evidence reviewed.',
    })
  })

  it('previews a protected tutor document before review', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTutorReviewsPage />)

    await screen.findByRole('heading', { name: 'Aline Tutor' })
    await user.click(screen.getAllByRole('button', { name: 'Preview document' })[0])

    await waitFor(() => expect(previewTutorDocument).toHaveBeenCalledWith(10))
    expect(await screen.findByRole('dialog')).toHaveTextContent('National ID')
    expect(screen.getByTitle('National ID preview')).toHaveAttribute(
      'src',
      'blob:verification-document',
    )
    expect(screen.getByRole('link', { name: 'Download copy' })).toHaveAttribute(
      'download',
      'id.pdf',
    )
  })
})
