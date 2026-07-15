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
import { DocumentActionSummary } from '../components/VerificationDocuments.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { queryKeys } from '../api/queryKeys'

export function TutorDocumentsPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [documentForm, setDocumentForm] = useState({ doc_type: 'ID', file: null })
  const [agreementForm, setAgreementForm] = useState({ signed_name: '', signed_file: null, agreed_to_terms: false })
  const [notice, setNotice] = useState('')

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

  return (
    <>
      <section className="page-card card">
        <p className="eyebrow">Tutor verification</p>
        <h1>Upload your documents and sign the agreement.</h1>
        <p className="supporting-text">
          Tutors stay hidden until ID, certificate, subject choices, and agreement requirements are complete.
        </p>
        <div className="hero-actions">
          <button className="secondary-button" type="button" onClick={async () => {
            try {
              const response = await downloadTutorAgreement()
              const blob = new Blob([response.data], { type: 'text/plain;charset=utf-8' })
              const url = window.URL.createObjectURL(blob)
              const anchor = document.createElement('a')
              anchor.href = url
              anchor.download = 'tutor-agreement-template.txt'
              anchor.click()
              window.URL.revokeObjectURL(url)
            } catch {
              setNotice('Could not download the agreement template.')
              toast.error('Could not download the agreement template.')
            }
          }}>
            Download agreement
          </button>
          <Link className="primary-button" to="/tutor-dashboard">Back to dashboard</Link>
        </div>
        <div className="trust-marks" style={{ marginTop: '1rem' }}>
          <span className="trust-mark">Documents: {documentsQuery.isLoading ? 'Loading' : documents.length}</span>
          <span className="trust-mark">Agreement: {agreementQuery.isLoading ? 'Loading' : agreementQuery.data?.status || 'Pending'}</span>
          <span className="trust-mark">Signed: {agreementQuery.data?.signed_file ? 'Yes' : 'No'}</span>
        </div>
        {notice ? <p className="supporting-text" role="status" aria-live="polite">{notice}</p> : null}
      </section>

      <DocumentActionSummary
        summary={documentSummary}
        onSelectDocument={selectDocumentForUpload}
      />

      <section className="split-layout">
        <article className="panel card" id="document-upload">
          <p className="eyebrow">Upload document</p>
          <h2>Submit your ID or certificate.</h2>
          <p className="supporting-text">
            Accepted files include national ID and qualification certificates.
          </p>
          <form className="steps-list" onSubmit={(event) => {
            event.preventDefault()
            if (!documentForm.file) {
              setNotice('Please choose a file first.')
              toast.warn('Please choose a file first.')
              return
            }
            documentMutation.mutate()
          }}>
            <label className="form-field">
              <span>Document type</span>
              <select value={documentForm.doc_type} onChange={(event) => setDocumentForm((current) => ({ ...current, doc_type: event.target.value }))}>
                <option value="ID">National ID</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="form-field">
              <span>Document file</span>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setDocumentForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} />
            </label>
            <button className="primary-button" type="submit" disabled={documentMutation.isPending}>Upload document</button>
          </form>
        </article>

        <article className="panel card">
          <p className="eyebrow">Sign agreement</p>
          <h2>Upload the signed agreement form.</h2>
          <p className="supporting-text">
            Download the agreement, sign it, and upload the signed copy back here.
          </p>
          <form className="steps-list" onSubmit={(event) => {
            event.preventDefault()
            if (!agreementForm.signed_file || !agreementForm.agreed_to_terms) {
              setNotice('Please sign the agreement and confirm the terms.')
              toast.warn('Please sign the agreement and confirm the terms.')
              return
            }
            agreementMutation.mutate()
          }}>
            <label className="form-field">
              <span>Signed name</span>
              <input type="text" value={agreementForm.signed_name} onChange={(event) => setAgreementForm((current) => ({ ...current, signed_name: event.target.value }))} />
            </label>
            <label className="form-field">
              <span>Signed agreement file</span>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setAgreementForm((current) => ({ ...current, signed_file: event.target.files?.[0] || null }))} />
            </label>
            <label className="check-row">
              <input type="checkbox" checked={agreementForm.agreed_to_terms} onChange={(event) => setAgreementForm((current) => ({ ...current, agreed_to_terms: event.target.checked }))} />
              <span>I agree to the platform terms and integrity requirements.</span>
            </label>
            <button className="primary-button" type="submit" disabled={agreementMutation.isPending}>Upload agreement</button>
          </form>
        </article>
      </section>

      <section className="panel card">
        <p className="eyebrow">Uploaded documents</p>
        <h2>Recent verification files.</h2>
        {documentsQuery.isLoading ? (
          <p className="supporting-text">Loading documents...</p>
        ) : documents.length === 0 ? (
          <p className="supporting-text">No documents uploaded yet.</p>
        ) : (
          <div className="verification-document-list">
            {documents.map((item) => (
              <article className="verification-document-row" key={item.id}>
                <div>
                  <h3>{item.doc_type_display || item.doc_type}</h3>
                  <p>{item.review_message || 'No admin feedback yet.'}</p>
                  {item.review_reason_display ? (
                    <small>Reason: {item.review_reason_display}</small>
                  ) : null}
                </div>
                <div className="document-row-actions">
                  <span className="status-pill">
                    {item.status_display || item.status}
                  </span>
                  <a href={item.file} target="_blank" rel="noreferrer">
                    Open file
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
