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
import { useAuth } from '../context/AuthContext.jsx'
import { queryKeys } from '../api/queryKeys'
import './TutorDocumentsPage.css'

const WORKSPACE_SECTIONS = [
  { key: 'overview', label: 'Overview', helper: 'Requirements and progress', icon: 'verification' },
  { key: 'identity', label: 'National ID', helper: 'Identity evidence', icon: 'account' },
  { key: 'qualifications', label: 'Qualifications', helper: 'Teaching credentials', icon: 'documents' },
  { key: 'agreement', label: 'Integrity agreement', helper: 'Download, sign, return', icon: 'audit' },
  { key: 'history', label: 'Submission history', helper: 'Files and review feedback', icon: 'reports' },
]

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
  if (status === 'APPROVED' || status === 'SIGNED') return 'is-approved'
  if (status === 'REJECTED' || status === 'REPLACEMENT_REQUESTED') return 'is-action'
  return 'is-pending'
}

function getLatestDocument(documents, docType) {
  return documents
    .filter((item) => item.doc_type === docType)
    .sort((left, right) => new Date(right.updated_at || right.created_at || 0) - new Date(left.updated_at || left.created_at || 0))[0]
}

function RequirementStatus({ status, label, emptyLabel = 'Not uploaded' }) {
  return (
    <span className={`tutor-document-status ${status ? getDocumentTone(status) : 'is-missing'}`}>
      {status ? label || formatStatus(status) : emptyLabel}
    </span>
  )
}

function DocumentUploadPanel({
  action,
  currentDocument,
  description,
  documentForm,
  documentType,
  eyebrow,
  onBack,
  onContinue,
  onFileChange,
  onSubmit,
  pending,
  title,
}) {
  const hasReviewAction = currentDocument?.status === 'REJECTED' || currentDocument?.status === 'REPLACEMENT_REQUESTED'
  const canUpload = !currentDocument || hasReviewAction || action?.action === 'UPLOAD' || action?.action === 'REPLACE'

  return (
    <article className="tutor-verification-panel" id="document-upload">
      <header className="tutor-verification-panel-header">
        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
          <span>{description}</span>
        </div>
        <RequirementStatus status={currentDocument?.status} />
      </header>

      {action || hasReviewAction ? (
        <div className="tutor-review-feedback" role="alert">
          <DashboardIcon name="help" size={19} />
          <div>
            <strong>{action?.action === 'REPLACE' || hasReviewAction ? 'A new file is required' : 'Administrator feedback'}</strong>
            <p>{action?.message || currentDocument?.review_message || 'Replace this document with a clear and complete copy.'}</p>
            {action?.reason || currentDocument?.review_reason_display ? <small>Reason: {formatStatus(action?.reason || currentDocument.review_reason_display)}</small> : null}
          </div>
        </div>
      ) : currentDocument ? (
        <div className="tutor-current-file">
          <DashboardIcon name="documents" size={18} />
          <div>
            <strong>Current submission</strong>
            <span>Uploaded {formatDate(currentDocument.updated_at || currentDocument.created_at)}</span>
          </div>
          <a href={currentDocument.file} target="_blank" rel="noreferrer">View file</a>
        </div>
      ) : null}

      {canUpload ? <form className="tutor-verification-form" onSubmit={onSubmit}>
        <div className="tutor-upload-guidance">
          <strong>Before you upload</strong>
          <ul>
            <li>Use a clear PDF, PNG, or JPEG.</li>
            <li>Show the complete document with readable details.</li>
            <li>Do not upload blank or password-protected files.</li>
          </ul>
        </div>

        <label className="tutor-document-file">
          <DashboardIcon name="documents" size={25} />
          <span>{documentForm.file ? documentForm.file.name : `Choose ${documentType === 'ID' ? 'identity document' : 'qualification file'}`}</span>
          <small>{documentForm.file ? 'File selected and ready' : 'PDF, PNG, or JPEG'}</small>
          <input
            key={`${documentType}-${documentForm.file?.name || 'empty'}`}
            aria-label="Document file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={onFileChange}
          />
        </label>

        <div className="tutor-verification-form-actions">
          <button className="secondary-button" type="button" onClick={onBack}>Back to overview</button>
          <button className="primary-button" type="submit" disabled={pending || !documentForm.file}>
            {pending ? 'Uploading...' : currentDocument ? 'Upload new version' : 'Upload and continue'}
          </button>
        </div>
      </form> : (
        <div className="tutor-submission-locked">
          <DashboardIcon name={currentDocument?.status === 'APPROVED' ? 'verification' : 'audit'} size={23} />
          <div>
            <strong>{currentDocument?.status === 'APPROVED' ? 'This requirement is accepted' : 'Administrator review is in progress'}</strong>
            <p>{currentDocument?.status === 'APPROVED' ? 'You do not need to upload another copy.' : 'You can continue with the other requirements while this file is reviewed.'}</p>
          </div>
          <div className="tutor-submission-locked-actions">
            <button className="secondary-button" type="button" onClick={onBack}>Back to overview</button>
            <button className="primary-button" type="button" onClick={onContinue}>Continue</button>
          </div>
        </div>
      )}
    </article>
  )
}

export function TutorDocumentsPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [documentForm, setDocumentForm] = useState({ doc_type: 'ID', file: null })
  const [agreementForm, setAgreementForm] = useState({ signed_name: '', signed_file: null, agreed_to_terms: false })
  const [activeSection, setActiveSection] = useState('overview')
  const [notice, setNotice] = useState('')
  const [downloadingAgreement, setDownloadingAgreement] = useState(false)

  const documentsQuery = useQuery({
    queryKey: queryKeys.tutors.documents,
    queryFn: async () => (await getTutorDocuments()).data,
    enabled: isAuthenticated && user?.role === 'TUTOR',
  })

  const checklistQuery = useQuery({
    queryKey: queryKeys.tutors.checklist,
    queryFn: async () => (await getTutorChecklist()).data,
    enabled: isAuthenticated && user?.role === 'TUTOR',
  })

  const agreementQuery = useQuery({
    queryKey: queryKeys.tutors.agreement,
    queryFn: async () => (await getTutorAgreementDetails()).data,
    enabled: isAuthenticated && user?.role === 'TUTOR',
  })

  const documentMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('doc_type', documentForm.doc_type)
      formData.append('file', documentForm.file)
      return (await uploadTutorDocument(formData)).data
    },
    onSuccess: async () => {
      const uploadedType = documentForm.doc_type
      setNotice(`${uploadedType === 'ID' ? 'National ID' : uploadedType === 'CERTIFICATE' ? 'Qualification certificate' : 'Supporting document'} uploaded successfully.`)
      toast.success('Document uploaded successfully.')
      setDocumentForm({ doc_type: 'ID', file: null })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.documents }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.checklist }),
      ])
      setActiveSection(uploadedType === 'ID' ? 'qualifications' : 'agreement')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const agreementMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('signed_name', agreementForm.signed_name)
      formData.append('signed_file', agreementForm.signed_file)
      formData.append('agreed_to_terms', agreementForm.agreed_to_terms ? 'true' : 'false')
      return (await uploadTutorAgreement(formData)).data
    },
    onSuccess: async () => {
      setNotice('Signed integrity agreement uploaded successfully.')
      toast.success('Agreement uploaded successfully.')
      setAgreementForm({ signed_name: '', signed_file: null, agreed_to_terms: false })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.agreement }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.checklist }),
      ])
      setActiveSection('overview')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
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
  const checklist = checklistQuery.data || {}
  const documentSummary = checklist.document_summary || {}
  const requiredActions = Array.isArray(documentSummary.action_required) ? documentSummary.action_required : []
  const idDocument = getLatestDocument(documents, 'ID')
  const certificateDocument = getLatestDocument(documents, 'CERTIFICATE')
  const agreement = agreementQuery.data || {}
  const agreementStatus = agreement.signed_file ? agreement.status || 'SIGNED' : ''
  const completion = checklist.completion_percentage || 0
  const verificationApproved = checklist.verification_status === 'APPROVED'

  const getAction = (docType) => requiredActions.find((item) => item.doc_type === docType)

  function openSection(section, docType) {
    if (docType) setDocumentForm({ doc_type: docType, file: null })
    setActiveSection(verificationApproved && section !== 'overview' && section !== 'history' ? 'history' : section)
    setNotice('')
  }

  function acceptNonEmptyFile(file, onAccept) {
    if (!file) {
      onAccept(null)
      return
    }
    if (file.size === 0) {
      toast.error('This file is empty. Choose a complete PDF or image.')
      onAccept(null)
      return
    }
    onAccept(file)
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
      anchor.download = filenameMatch?.[1] || 'yigareach-tutor-agreement.pdf'
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

  function submitDocument(event) {
    event.preventDefault()
    if (!documentForm.file) {
      toast.warn('Choose a file before continuing.')
      return
    }
    documentMutation.mutate()
  }

  const requirementCards = [
    {
      key: 'identity',
      number: '01',
      title: 'National ID',
      description: 'Confirms your legal identity and account ownership.',
      status: idDocument?.status,
      actionLabel: idDocument ? 'Review identity file' : 'Upload national ID',
    },
    {
      key: 'qualifications',
      number: '02',
      title: 'Qualification certificate',
      description: 'Supports the subjects and education levels you intend to teach.',
      status: certificateDocument?.status,
      actionLabel: certificateDocument ? 'Review qualification' : 'Upload qualification',
    },
    {
      key: 'agreement',
      number: '03',
      title: 'Integrity agreement',
      description: 'Records your commitment to professional and lawful tutoring.',
      status: agreementStatus,
      actionLabel: agreement.signed_file ? 'Review agreement' : 'Complete agreement',
    },
  ]

  return (
    <section className="tutor-documents-page">
      <header className="tutor-documents-header">
        <div>
          <p className="tutor-documents-eyebrow">Tutor verification</p>
          <h1>Verification centre</h1>
          <p>Complete each requirement in order. Your files remain private and are only used by administrators to verify your tutor profile.</p>
        </div>
        <Link className="secondary-button" to="/tutor-dashboard">Back to dashboard</Link>
      </header>

      {notice ? <div className="tutor-documents-notice" role="status" aria-live="polite"><DashboardIcon name="verification" size={18} /><span>{notice}</span></div> : null}

      <section className="tutor-verification-progress" aria-busy={checklistQuery.isLoading}>
        <div>
          <span className="tutor-progress-value">{checklistQuery.isLoading ? '...' : `${completion}%`}</span>
          <div><strong>Verification progress</strong><small>{verificationApproved ? 'Your tutor profile is approved.' : 'Finish the remaining requirements for administrator review.'}</small></div>
        </div>
        <div className="tutor-verification-progress-bar" role="progressbar" aria-label="Tutor setup completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion}><span style={{ width: `${completion}%` }} /></div>
        <span className={`tutor-verification-state ${checklist.marketplace_ready ? 'is-ready' : ''}`}>{checklist.marketplace_ready ? 'Marketplace ready' : formatStatus(checklist.verification_status)}</span>
      </section>

      <div className="tutor-verification-workspace">
        <aside className="tutor-verification-nav" aria-label="Verification sections">
          <div className="tutor-verification-nav-heading">
            <span>Verification steps</span>
            <strong>{verificationApproved ? 'Approved' : `${requirementCards.filter((item) => item.status === 'APPROVED' || item.status === 'SIGNED').length} of 3 accepted`}</strong>
          </div>
          {WORKSPACE_SECTIONS.map((section) => {
            const requirement = section.key === 'identity'
              ? idDocument
              : section.key === 'qualifications'
                ? certificateDocument
                : section.key === 'agreement'
                  ? { status: agreementStatus }
                  : null
            return (
              <button
                type="button"
                className={activeSection === section.key ? 'is-active' : ''}
                onClick={() => openSection(section.key, section.key === 'identity' ? 'ID' : section.key === 'qualifications' ? 'CERTIFICATE' : undefined)}
                aria-current={activeSection === section.key ? 'page' : undefined}
                key={section.key}
              >
                <span><DashboardIcon name={section.icon} size={18} /></span>
                <div><strong>{section.label}</strong><small>{section.helper}</small></div>
                {requirement ? <i className={`tutor-nav-state ${getDocumentTone(requirement.status)}`} aria-label={requirement.status ? formatStatus(requirement.status) : 'Not uploaded'} /> : <DashboardIcon name="arrowRight" size={15} />}
              </button>
            )
          })}
          <div className="tutor-verification-privacy">
            <DashboardIcon name="verification" size={19} />
            <p><strong>Private and protected</strong><span>Only authorized administrators can review these files.</span></p>
          </div>
        </aside>

        <main className="tutor-verification-content">
          {activeSection === 'overview' ? (
            <article className="tutor-verification-panel tutor-verification-overview">
              <header className="tutor-verification-panel-header">
                <div><p>Start here</p><h2>{verificationApproved ? 'Verification complete' : 'Complete your application'}</h2><span>{verificationApproved ? 'Your accepted files are available as a read-only record.' : 'Work through these requirements from top to bottom. Review starts automatically when all required items are submitted.'}</span></div>
              </header>

              {verificationApproved ? (
                <div className="tutor-approved-message">
                  <DashboardIcon name="verification" size={25} />
                  <div><strong>Your tutor profile is verified</strong><p>No further uploads are required unless an administrator asks you to replace a document.</p></div>
                  <button className="secondary-button" type="button" onClick={() => openSection('history')}>View submission record</button>
                </div>
              ) : null}

              <div className="tutor-requirement-list">
                {requirementCards.map((item) => (
                  <button type="button" onClick={() => openSection(item.key, item.key === 'identity' ? 'ID' : item.key === 'qualifications' ? 'CERTIFICATE' : undefined)} key={item.key}>
                    <span className="tutor-requirement-number">{item.status === 'APPROVED' || item.status === 'SIGNED' ? <DashboardIcon name="verification" size={17} /> : item.number}</span>
                    <div><strong>{item.title}</strong><p>{item.description}</p></div>
                    <RequirementStatus status={item.status} />
                    <span className="tutor-requirement-action">{verificationApproved ? 'View record' : item.actionLabel}<DashboardIcon name="arrowRight" size={15} /></span>
                  </button>
                ))}
              </div>

              {!verificationApproved && requiredActions.length ? (
                <div className="tutor-overview-attention" role="alert">
                  <DashboardIcon name="help" size={20} />
                  <div><strong>{requiredActions.length} item{requiredActions.length === 1 ? '' : 's'} need attention</strong><p>{requiredActions[0].message || 'Open the affected requirement to replace or correct your submission.'}</p></div>
                </div>
              ) : null}
            </article>
          ) : null}

          {activeSection === 'identity' && !verificationApproved ? (
            <DocumentUploadPanel
              action={getAction('ID')}
              currentDocument={idDocument}
              description="Upload the front of your national ID or another administrator-approved identity document."
              documentForm={documentForm}
              documentType="ID"
              eyebrow="Requirement 1 of 3"
              onBack={() => openSection('overview')}
              onContinue={() => openSection('qualifications', 'CERTIFICATE')}
              onFileChange={(event) => acceptNonEmptyFile(event.target.files?.[0], (file) => setDocumentForm({ doc_type: 'ID', file }))}
              onSubmit={submitDocument}
              pending={documentMutation.isPending}
              title="Upload national ID"
            />
          ) : null}

          {activeSection === 'qualifications' && !verificationApproved ? (
            <div className="tutor-evidence-switch" aria-label="Qualification evidence type">
              <button type="button" className={documentForm.doc_type === 'CERTIFICATE' ? 'is-active' : ''} onClick={() => setDocumentForm({ doc_type: 'CERTIFICATE', file: null })}><strong>Qualification certificate</strong><span>Required</span></button>
              <button type="button" className={documentForm.doc_type === 'OTHER' ? 'is-active' : ''} onClick={() => setDocumentForm({ doc_type: 'OTHER', file: null })}><strong>Supporting evidence</strong><span>Optional</span></button>
            </div>
          ) : null}

          {activeSection === 'qualifications' && !verificationApproved ? (
            <DocumentUploadPanel
              action={getAction(documentForm.doc_type)}
              currentDocument={getLatestDocument(documents, documentForm.doc_type)}
              description="Upload your main academic or professional teaching certificate. You may also add supporting evidence."
              documentForm={documentForm}
              documentType={documentForm.doc_type}
              eyebrow="Requirement 2 of 3"
              onBack={() => openSection('overview')}
              onContinue={() => openSection('agreement')}
              onFileChange={(event) => acceptNonEmptyFile(event.target.files?.[0], (file) => setDocumentForm((current) => ({ ...current, file })))}
              onSubmit={submitDocument}
              pending={documentMutation.isPending}
              title="Upload qualification evidence"
            />
          ) : null}

          {activeSection === 'agreement' && !verificationApproved ? (
            <article className="tutor-verification-panel">
              <header className="tutor-verification-panel-header">
                <div><p>Requirement 3 of 3</p><h2>Complete the integrity agreement</h2><span>Use your personalized YigaReach agreement. Download it, sign it, then return the completed copy.</span></div>
                <RequirementStatus status={agreementStatus} />
              </header>

              {agreementStatus === 'SIGNED' ? (
                <div className="tutor-submission-locked">
                  <DashboardIcon name="verification" size={23} />
                  <div><strong>Your signed agreement is submitted</strong><p>Continue with any remaining requirements while the administrator completes your verification.</p></div>
                  <div className="tutor-submission-locked-actions"><button className="secondary-button" type="button" onClick={() => openSection('overview')}>Back to overview</button><button className="primary-button" type="button" onClick={() => openSection('history')}>View submission</button></div>
                </div>
              ) : <>
              <div className="tutor-agreement-flow">
                <div><span>1</span><strong>Download</strong><small>Get your personalized PDF</small></div>
                <i><DashboardIcon name="arrowRight" size={16} /></i>
                <div><span>2</span><strong>Sign</strong><small>Read and sign every page</small></div>
                <i><DashboardIcon name="arrowRight" size={16} /></i>
                <div><span>3</span><strong>Upload</strong><small>Return the completed copy</small></div>
              </div>

              <button className="tutor-agreement-download" type="button" onClick={handleAgreementDownload} disabled={downloadingAgreement}><DashboardIcon name="documents" size={18} /><span><strong>{downloadingAgreement ? 'Preparing your PDF...' : 'Download personalized agreement'}</strong><small>PDF document ready for printing and signing</small></span><DashboardIcon name="arrowRight" size={16} /></button>

              <form className="tutor-verification-form" onSubmit={(event) => {
                event.preventDefault()
                if (!agreementForm.signed_name.trim() || !agreementForm.signed_file || !agreementForm.agreed_to_terms) {
                  toast.warn('Enter your legal name, attach the signed agreement, and confirm the terms.')
                  return
                }
                agreementMutation.mutate()
              }}>
                <label className="tutor-document-field"><span>Legal name used to sign</span><input type="text" value={agreementForm.signed_name} onChange={(event) => setAgreementForm((current) => ({ ...current, signed_name: event.target.value }))} placeholder="Enter your full legal name" /></label>
                <label className="tutor-document-file">
                  <DashboardIcon name="documents" size={25} />
                  <span>{agreementForm.signed_file ? agreementForm.signed_file.name : 'Choose signed agreement'}</span>
                  <small>{agreementForm.signed_file ? 'File selected and ready' : 'PDF, PNG, or JPEG'}</small>
                  <input key={agreementForm.signed_file?.name || 'empty'} aria-label="Signed agreement file" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => acceptNonEmptyFile(event.target.files?.[0], (file) => setAgreementForm((current) => ({ ...current, signed_file: file })))} />
                </label>
                <label className="tutor-agreement-check"><input type="checkbox" checked={agreementForm.agreed_to_terms} onChange={(event) => setAgreementForm((current) => ({ ...current, agreed_to_terms: event.target.checked }))} /><span><strong>I confirm this is my signed agreement</strong><small>I understand that false information may lead to account suspension or legal action.</small></span></label>
                <div className="tutor-verification-form-actions"><button className="secondary-button" type="button" onClick={() => openSection('overview')}>Back to overview</button><button className="primary-button" type="submit" disabled={agreementMutation.isPending || !agreementForm.signed_name.trim() || !agreementForm.signed_file || !agreementForm.agreed_to_terms}>{agreementMutation.isPending ? 'Uploading...' : 'Upload signed agreement'}</button></div>
              </form>
              </>}
            </article>
          ) : null}

          {(activeSection === 'history' || (verificationApproved && activeSection !== 'overview')) ? (
            <article className="tutor-verification-panel tutor-submission-history">
              <header className="tutor-verification-panel-header"><div><p>Submission record</p><h2>Files and review feedback</h2><span>Open a file or check the latest administrator status for each submission.</span></div><span className="tutor-history-count">{documents.length} file{documents.length === 1 ? '' : 's'}</span></header>
              {documentsQuery.isLoading ? (
                <div className="tutor-documents-loading"><span /><span /><span /></div>
              ) : documentsQuery.isError ? (
                <div className="tutor-documents-empty"><DashboardIcon name="documents" size={28} /><h3>Documents could not be loaded</h3><p>{getApiErrorMessage(documentsQuery.error)}</p><button className="secondary-button" type="button" onClick={() => documentsQuery.refetch()}>Try again</button></div>
              ) : documents.length === 0 ? (
                <div className="tutor-documents-empty"><DashboardIcon name="documents" size={28} /><h3>No documents uploaded yet</h3><p>Begin with your national ID.</p><button className="secondary-button" type="button" onClick={() => openSection('identity', 'ID')}>Upload first document</button></div>
              ) : (
                <div className="tutor-document-list">
                  {documents.map((item) => (
                    <article key={item.id}>
                      <span className="tutor-document-list-icon"><DashboardIcon name="documents" size={20} /></span>
                      <div className="tutor-document-list-copy"><h3>{item.doc_type_display || formatStatus(item.doc_type)}</h3><p>{item.review_message || 'Your document is waiting for administrator review.'}</p>{item.review_reason_display ? <small>Review reason: {item.review_reason_display}</small> : <small>Updated {formatDate(item.updated_at || item.created_at)}</small>}</div>
                      <RequirementStatus status={item.status} label={item.status_display} />
                      <a href={item.file} target="_blank" rel="noreferrer">Open file</a>
                    </article>
                  ))}
                </div>
              )}
              {agreement.signed_file ? <div className="tutor-agreement-record"><span><DashboardIcon name="audit" size={20} /></span><div><strong>Signed integrity agreement</strong><small>Submitted under the legal name {agreement.signed_name || user?.full_name || user?.email}</small></div><RequirementStatus status={agreementStatus} /><a href={agreement.signed_file} target="_blank" rel="noreferrer">Open file</a></div> : null}
            </article>
          ) : null}

        </main>
      </div>
    </section>
  )
}
