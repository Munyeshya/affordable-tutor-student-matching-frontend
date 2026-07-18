import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  downloadTutorAgreement,
  getTutorAgreementDetails,
  getTutorChecklist,
  getTutorDocuments,
  uploadTutorAgreement,
  uploadTutorDocument,
} from '../api/services/tutors.js'
import { useAuth } from '../context/AuthContext.jsx'
import { renderWithProviders } from '../test/render.jsx'
import { TutorDocumentsPage } from './TutorDocumentsPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warn: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../api/services/tutors.js', () => ({
  downloadTutorAgreement: vi.fn(),
  getTutorAgreementDetails: vi.fn(),
  getTutorChecklist: vi.fn(),
  getTutorDocuments: vi.fn(),
  uploadTutorAgreement: vi.fn(),
  uploadTutorDocument: vi.fn(),
}))

const checklist = {
  marketplace_ready: false,
  verification_status: 'PENDING',
  completion_percentage: 60,
  steps: [
    { key: 'profile', label: 'Create tutor profile', completed: true },
    { key: 'subjects', label: 'Add subjects and levels', completed: true },
    { key: 'documents', label: 'Upload required documents', completed: false },
    { key: 'agreement', label: 'Sign integrity agreement', completed: false },
  ],
  document_summary: {
    all_required_uploaded: false,
    all_required_approved: false,
    action_required: [],
  },
}

const documentRecord = {
  id: 12,
  doc_type: 'ID',
  doc_type_display: 'National ID',
  status: 'PENDING',
  status_display: 'Pending Review',
  file: '/media/national-id.pdf',
  review_message: '',
  created_at: '2026-07-18T08:00:00Z',
  updated_at: '2026-07-18T08:00:00Z',
}

describe('TutorDocumentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: { id: 8, role: 'TUTOR', email: 'tutor@isomo.test' },
      isAuthenticated: true,
    })
    getTutorChecklist.mockResolvedValue({ data: checklist })
    getTutorDocuments.mockResolvedValue({ data: [documentRecord] })
    getTutorAgreementDetails.mockResolvedValue({ data: { status: 'PENDING', signed_file: null } })
    uploadTutorDocument.mockResolvedValue({ data: documentRecord })
    uploadTutorAgreement.mockResolvedValue({ data: {} })
    downloadTutorAgreement.mockResolvedValue({ data: 'agreement template' })
  })

  it('presents verification progress and uploaded document status', async () => {
    renderWithProviders(<TutorDocumentsPage />)

    expect(await screen.findByRole('heading', { name: '60% complete' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Tutor setup completion' })).toHaveAttribute('aria-valuenow', '60')
    expect(screen.getByText('Create tutor profile')).toBeInTheDocument()
    expect(screen.getByText('Pending Review')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open file' })).toHaveAttribute('href', '/media/national-id.pdf')
  })

  it('uploads a selected verification document', async () => {
    const browserUser = userEvent.setup()
    const certificate = new File(['certificate'], 'certificate.pdf', { type: 'application/pdf' })
    renderWithProviders(<TutorDocumentsPage />)

    await screen.findByRole('heading', { name: 'Upload verification document' })
    await browserUser.selectOptions(screen.getByLabelText('Document type'), 'CERTIFICATE')
    await browserUser.upload(screen.getByLabelText('Document file'), certificate)
    expect(screen.getByText('certificate.pdf')).toBeInTheDocument()
    await browserUser.click(screen.getByRole('button', { name: 'Upload document' }))

    await waitFor(() => expect(uploadTutorDocument).toHaveBeenCalledWith(expect.any(FormData)))
    expect(toast.success).toHaveBeenCalledWith('Document uploaded successfully.')
  })
})
