import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import {
  downloadTutorAgreement,
  getTutorAgreementDetails,
  getTutorChecklist,
  getTutorDocuments,
  uploadTutorAgreement,
  uploadTutorDocument,
} from '../api/services/tutors.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { DocumentActionSummary } from '../components/VerificationDocuments.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { queryKeys } from '../api/queryKeys'
import './TutorDocumentsPage.css'

function formatStatus(value) {
  return String(value || 'Pending').toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function formatDate(value) {
  if (!value) return 'Not reviewed yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-RW', { dateStyle: 'medium' }).format(date)
}

function getDocumentTone(status) {
  if (status === 'APPROVED') return 'is-approved'
  if (status === 'REJECTED' || status === 'REPLACEMENT_REQUESTED') return 'is-action'
  return 'is-pending'
}

export function TutorDocumentsPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [documentForm, setDocumentForm] = useState({ doc_type: 'ID', file: null })
  const [agreementForm, setAgreementForm] = useState({ signed_name: '', signed_file: null, agreed_to_terms: false })
  const [notice, setNotice] = useState('')
  const [downloadingAgreement, setDownloadingAgreement] = useState(false)

  const documentsQuery = useQuery({
    queryKey: queryKeys.tutors.documents,
    queryFn: async () => {
      const response = await getTutorDocuments()
      return response.data
    },
    enabled: isAuthenticated && user?.role === 'TUTOR',
  })

  const checklistQuery = useQuery({
    queryKey: queryKeys.tutors.checklist,
    queryFn: async () => {
      const response = await getTutorChecklist()
      return response.data
    },
    enabled: isAuthenticated && user?.role === 'TUTOR',
  })

  const agreementQuery = useQuery({
    queryKey: queryKeys.tutors.agreement,
    queryFn: async () => {
      const response = await getTutorAgreementDetails()
      return response.data
    },
    enabled: isAuthenticated && user?.role === 'TUTOR',
  })

  const documentMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('doc_type', documentForm.doc_type)
      formData.append('file', documentForm.file)
      const response = await uploadTutorDocument(formData)
      return response.data
    },
    onSuccess: async () => {
      setNotice('Document uploaded successfully.')
      toast.success('Document uploaded successfully.')
      setDocumentForm({ doc_type: 'ID', file: null })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.documents })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.checklist })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const agreementMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('signed_name', agreementForm.signed_name)
      formData.append('signed_file', agreementForm.signed_file)
      formData.append('agreed_to_terms', agreementForm.agreed_to_terms ? 'true' : 'false')
      const response = await uploadTutorAgreement(formData)
      return response.data
    },
    onSuccess: async () => {
      setNotice('Agreement uploaded successfully.')
      toast.success('Agreement uploaded successfully.')
      setAgreementForm({ signed_name: '', signed_file: null, agreed_to_terms: false })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.agreement })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.checklist })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  if (!isAuthenticated) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Tutor documents</p>
        <h1>Sign in to manage your verification documents.</h1>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create account</Link>
        </div>
      </section>
    )
  }

  if (user?.role !== 'TUTOR') {
    return (
      <section className="page-card card">
        <p className="eyebrow">Tutor documents</p>
        <h1>This area is only for tutors.</h1>
        <div className="hero-actions">
          <Link className="primary-button" to="/tutors">Browse tutors</Link>
          <Link className="secondary-button" to="/contact">Contact support</Link>
        </div>
      </section>
    )
  }

  const documents = Array.isArray(documentsQuery.data) ? documentsQuery.data : []
  const documentSummary = checklistQuery.data?.document_summary

  function selectDocumentForUpload(docType) {
    setDocumentForm({ doc_type: docType, file: null })
    window.setTimeout(() => {
      document.getElementById('document-upload')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 0)
  }

  async function handleAgreementDownload() {
    setDownloadingAgreement(true)
    try {
      const response = await downloadTutorAgreement()
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const disposition = response.headers?.['content-disposition'] || ''
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i)
      anchor.href = url
      anchor.download = filenameMatch?.[1] || 'isomo-tutor-agreement.pdf'
      anchor.click()
      window.URL.revokeObjectURL(url)
      toast.success('Personalized PDF agreement downloaded.')
    } catch {
      setNotice('Could not download the agreement template.')
      toast.error('Could not download the agreement template.')
    } finally {
      setDownloadingAgreement(false)
    }
  }

  const checklist = checklistQuery.data || {}
  const setupSteps = Array.isArray(checklist.steps) ? checklist.steps : []
  const completion = checklist.completion_percentage || 0
  const agreementStatus = agreementQuery.data?.status || 'PENDING'

  return (
    <section className="tutor-documents-page">
      <header className="tutor-documents-header">
        <div>
          <p className="tutor-documents-eyebrow">Tutor verification</p>
          <h1>Documents and agreement</h1>
          <p>Complete your identity, qualification, and integrity requirements before your profile can appear in tutor search.</p>
        </div>
        <div className="tutor-documents-header-actions">
          <button className="secondary-button" type="button" onClick={handleAgreementDownload} disabled={downloadingAgreement}>{downloadingAgreement ? 'Preparing...' : 'Download agreement'}</button>
          <Link className="primary-button" to="/tutor-dashboard">Back to dashboard</Link>
        </div>
      </header>

      {notice ? <div className="tutor-documents-notice" role="status" aria-live="polite"><DashboardIcon name="verification" size={18} /><span>{notice}</span></div> : null}

      <section className="tutor-verification-progress" aria-busy={checklistQuery.isLoading}>
        <header>
          <div><p>Approval progress</p><h2>{checklistQuery.isLoading ? 'Loading requirements...' : `${completion}% complete`}</h2></div>
          <span className={`tutor-verification-state ${checklist.marketplace_ready ? 'is-ready' : ''}`}>{checklist.marketplace_ready ? 'Marketplace ready' : formatStatus(checklist.verification_status)}</span>
        </header>
        <div className="tutor-verification-progress-bar" role="progressbar" aria-label="Tutor setup completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion}><span style={{ width: `${completion}%` }} /></div>
        <div className="tutor-verification-steps">
          {setupSteps.length ? setupSteps.map((step, index) => (
            <article className={step.completed ? 'is-complete' : ''} key={step.key}>
              <span>{step.completed ? <DashboardIcon name="verification" size={17} /> : index + 1}</span>
              <div><strong>{step.label}</strong><small>{step.completed ? 'Complete' : 'Required'}</small></div>
            </article>
          )) : Array.from({ length: 4 }).map((_, index) => <article className="is-loading" key={index}><span>{index + 1}</span><div><strong>Loading step</strong><small>Please wait</small></div></article>)}
        </div>
      </section>

      <section className="tutor-documents-summary" aria-label="Verification summary">
        <article><span><DashboardIcon name="documents" size={19} /></span><div><small>Uploaded files</small><strong>{documentsQuery.isLoading ? '...' : documents.length}</strong><p>Identity and qualification evidence</p></div></article>
        <article><span><DashboardIcon name="verification" size={19} /></span><div><small>Required documents</small><strong>{documentSummary?.all_required_approved ? 'Approved' : documentSummary?.all_required_uploaded ? 'In review' : 'Incomplete'}</strong><p>National ID and certificate</p></div></article>
        <article><span><DashboardIcon name="audit" size={19} /></span><div><small>Integrity agreement</small><strong>{agreementQuery.isLoading ? '...' : formatStatus(agreementStatus)}</strong><p>{agreementQuery.data?.signed_file ? 'Signed copy uploaded' : 'Signed copy required'}</p></div></article>
      </section>

      <DocumentActionSummary summary={documentSummary} onSelectDocument={selectDocumentForUpload} />

      <section className="tutor-document-workflow">
        <article className="tutor-document-form-card" id="document-upload">
          <header><span><DashboardIcon name="documents" size={21} /></span><div><p>Step 1</p><h2>Upload verification document</h2><small>Submit a readable PDF or image of your national ID or qualification certificate.</small></div></header>
          <form onSubmit={(event) => {
            event.preventDefault()
            if (!documentForm.file) {
              setNotice('Please choose a file first.')
              toast.warn('Please choose a file first.')
              return
            }
            documentMutation.mutate()
          }}>
            <label className="tutor-document-field"><span>Document type</span><select value={documentForm.doc_type} onChange={(event) => setDocumentForm((current) => ({ ...current, doc_type: event.target.value }))}><option value="ID">National ID</option><option value="CERTIFICATE">Qualification certificate</option><option value="OTHER">Other supporting document</option></select></label>
            <label className="tutor-document-file">
              <DashboardIcon name="documents" size={24} />
              <span>{documentForm.file ? documentForm.file.name : 'Choose PDF, PNG, or JPEG'}</span>
              <small>{documentForm.file ? 'Ready to upload' : 'Maximum file size is validated when submitted.'}</small>
              <input aria-label="Document file" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setDocumentForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} />
            </label>
            <button className="primary-button" type="submit" disabled={documentMutation.isPending}>{documentMutation.isPending ? 'Uploading...' : 'Upload document'}</button>
          </form>
        </article>

        <article className="tutor-document-form-card">
          <header><span><DashboardIcon name="audit" size={21} /></span><div><p>Step 2</p><h2>Sign the integrity agreement</h2><small>Download the template, sign it, and upload the completed copy with your legal name.</small></div></header>
          <button className="tutor-agreement-download" type="button" onClick={handleAgreementDownload} disabled={downloadingAgreement}><DashboardIcon name="documents" size={17} /><span>{downloadingAgreement ? 'Preparing template...' : 'Download agreement template'}</span></button>
          <form onSubmit={(event) => {
            event.preventDefault()
            if (!agreementForm.signed_file || !agreementForm.agreed_to_terms) {
              setNotice('Please sign the agreement and confirm the terms.')
              toast.warn('Please sign the agreement and confirm the terms.')
              return
            }
            agreementMutation.mutate()
          }}>
            <label className="tutor-document-field"><span>Signed name</span><input type="text" value={agreementForm.signed_name} onChange={(event) => setAgreementForm((current) => ({ ...current, signed_name: event.target.value }))} placeholder="Enter your legal name" /></label>
            <label className="tutor-document-file">
              <DashboardIcon name="documents" size={24} />
              <span>{agreementForm.signed_file ? agreementForm.signed_file.name : 'Choose signed agreement'}</span>
              <small>{agreementForm.signed_file ? 'Ready to upload' : 'PDF, PNG, or JPEG'}</small>
              <input aria-label="Signed agreement file" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setAgreementForm((current) => ({ ...current, signed_file: event.target.files?.[0] || null }))} />
            </label>
            <label className="tutor-agreement-check"><input type="checkbox" checked={agreementForm.agreed_to_terms} onChange={(event) => setAgreementForm((current) => ({ ...current, agreed_to_terms: event.target.checked }))} /><span><strong>Integrity confirmation</strong><small>I agree to the platform terms and understand that false information may lead to account or legal action.</small></span></label>
            <button className="primary-button" type="submit" disabled={agreementMutation.isPending}>{agreementMutation.isPending ? 'Uploading...' : 'Upload signed agreement'}</button>
          </form>
        </article>
      </section>

      <section className="tutor-uploaded-documents">
        <header><div><p>Submission history</p><h2>Uploaded documents</h2></div><span>{documents.length} file{documents.length === 1 ? '' : 's'}</span></header>
        {documentsQuery.isLoading ? (
          <div className="tutor-documents-loading"><span /><span /><span /></div>
        ) : documentsQuery.isError ? (
          <div className="tutor-documents-empty"><DashboardIcon name="documents" size={28} /><h3>Documents could not be loaded</h3><p>{getApiErrorMessage(documentsQuery.error)}</p><button className="secondary-button" type="button" onClick={() => documentsQuery.refetch()}>Try again</button></div>
        ) : documents.length === 0 ? (
          <div className="tutor-documents-empty"><DashboardIcon name="documents" size={28} /><h3>No documents uploaded yet</h3><p>Start with your national ID and qualification certificate.</p><button className="secondary-button" type="button" onClick={() => selectDocumentForUpload('ID')}>Upload first document</button></div>
        ) : (
          <div className="tutor-document-list">
            {documents.map((item) => (
              <article key={item.id}>
                <span className="tutor-document-list-icon"><DashboardIcon name="documents" size={20} /></span>
                <div className="tutor-document-list-copy"><h3>{item.doc_type_display || formatStatus(item.doc_type)}</h3><p>{item.review_message || 'Your document is waiting for an administrator review.'}</p>{item.review_reason_display ? <small>Review reason: {item.review_reason_display}</small> : <small>Updated {formatDate(item.updated_at || item.created_at)}</small>}</div>
                <span className={`tutor-document-status ${getDocumentTone(item.status)}`}>{item.status_display || formatStatus(item.status)}</span>
                <a href={item.file} target="_blank" rel="noreferrer">Open file</a>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
