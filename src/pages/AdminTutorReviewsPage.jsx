import React, { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import {
  decideTutorVerification,
  listTutorVerifications,
  previewTutorDocument,
  reviewTutorDocument,
} from '../api/services/tutors.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { UserAvatar } from '../components/ui/UserAvatar.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { AdminDocumentReview } from '../components/VerificationDocuments.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { queryKeys } from '../api/queryKeys'
import './AdminTutorReviewsPage.css'

function formatDate(value) {
  if (!value) return 'Recently submitted'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently submitted'
  return new Intl.DateTimeFormat('en-RW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatLabel(value) {
  if (!value) return 'Unknown'
  const label = String(value).replaceAll('_', ' ').toLowerCase()
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function getReviewState(verification) {
  const summary = verification?.document_summary || {}
  if (summary.has_blocking_issues) {
    return { label: 'Action required', tone: 'warning' }
  }
  if (summary.all_required_uploaded) {
    return { label: 'Ready to decide', tone: 'ready' }
  }
  return { label: 'Incomplete', tone: 'neutral' }
}

function getDocumentContentType(document, response) {
  const responseType = response.headers?.['content-type']
  if (responseType) return responseType
  if (document.file?.toLowerCase().endsWith('.pdf')) return 'application/pdf'
  if (document.file?.toLowerCase().match(/\.(png|jpe?g)$/)) return 'image/*'
  return response.data?.type || 'application/octet-stream'
}

function getDocumentFilename(document) {
  if (!document) return 'verification-document'
  const path = String(document.file || '')
  return path.split('/').pop()?.split('?')[0] || `verification-document-${document.id}`
}

function ReviewQueueSkeleton() {
  return (
    <div className="admin-tutor-review-queue-skeleton" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <span key={index}><i /><i /><i /></span>
      ))}
    </div>
  )
}

export function AdminTutorReviewsPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const previewRequestId = useRef(0)
  const [selectedVerificationId, setSelectedVerificationId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [reasonById, setReasonById] = useState({})
  const [documentReviewById, setDocumentReviewById] = useState({})
  const [documentPreview, setDocumentPreview] = useState({
    document: null,
    url: '',
    contentType: '',
    loading: false,
    error: '',
  })
  const [notice, setNotice] = useState('')

  const verificationsQuery = useQuery({
    queryKey: queryKeys.admin.tutorVerifications(),
    queryFn: async () => (await listTutorVerifications({ status: 'PENDING' })).data,
    enabled: isAuthenticated && user?.role === 'ADMIN',
  })

  const decisionMutation = useMutation({
    mutationFn: async ({ id, status, reason }) => (
      await decideTutorVerification(id, { status, reason })
    ).data,
    onSuccess: async (_, variables) => {
      const message = variables.status === 'APPROVED'
        ? 'Tutor approved for the marketplace.'
        : 'Tutor verification rejected.'
      setNotice(message)
      toast.success(message)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.tutorVerifications() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.checklist }),
      ])
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'The tutor decision could not be saved.'))
    },
  })

  const documentReviewMutation = useMutation({
    mutationFn: async ({ id, payload }) => (
      await reviewTutorDocument(id, payload)
    ).data,
    onSuccess: async () => {
      setNotice('Document review saved.')
      toast.success('Document review saved.')
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.tutorVerifications(),
      })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'The document review could not be saved.'))
    },
  })

  const verifications = Array.isArray(verificationsQuery.data) ? verificationsQuery.data : []

  useEffect(() => () => {
    if (documentPreview.url) {
      window.URL.revokeObjectURL(documentPreview.url)
    }
  }, [documentPreview.url])

  async function openDocumentPreview(document) {
    const requestId = previewRequestId.current + 1
    previewRequestId.current = requestId
    setDocumentPreview({
      document,
      url: '',
      contentType: '',
      loading: true,
      error: '',
    })
    try {
      const response = await previewTutorDocument(document.id)
      if (previewRequestId.current !== requestId) return
      const contentType = getDocumentContentType(document, response)
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: contentType })
      const url = window.URL.createObjectURL(blob)
      setDocumentPreview({
        document,
        url,
        contentType,
        loading: false,
        error: '',
      })
    } catch (error) {
      if (previewRequestId.current !== requestId) return
      const message = getApiErrorMessage(
        error,
        'This document could not be previewed.',
      )
      setDocumentPreview({
        document,
        url: '',
        contentType: '',
        loading: false,
        error: message,
      })
      toast.error(message)
    }
  }

  function closeDocumentPreview() {
    previewRequestId.current += 1
    setDocumentPreview({
      document: null,
      url: '',
      contentType: '',
      loading: false,
      error: '',
    })
  }

  if (!isAuthenticated) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Admin reviews</p>
        <h1>Sign in to review tutor applications.</h1>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create account</Link>
        </div>
      </section>
    )
  }

  if (user?.role !== 'ADMIN') {
    return (
      <section className="page-card card">
        <p className="eyebrow">Admin reviews</p>
        <h1>This area is for admins only.</h1>
        <div className="hero-actions">
          <Link className="primary-button" to="/tutors">Browse tutors</Link>
          <Link className="secondary-button" to="/contact">Contact support</Link>
        </div>
      </section>
    )
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const visibleVerifications = normalizedSearch
    ? verifications.filter((verification) => (
      [verification.tutor_name, verification.tutor_email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    ))
    : verifications
  const selectedVerification = verifications.find(
    (item) => item.id === selectedVerificationId,
  ) || verifications[0] || null
  const activeVerificationId = selectedVerification?.id || null
  const readyCount = verifications.filter(
    (item) => item.document_summary?.all_required_uploaded
      && !item.document_summary?.has_blocking_issues,
  ).length
  const actionRequiredCount = verifications.filter(
    (item) => item.document_summary?.has_blocking_issues
      || !item.document_summary?.all_required_uploaded,
  ).length

  return (
    <section className="admin-tutor-reviews-page">
      <header className="admin-tutor-reviews-header">
        <div>
          <p>Administration / Trust and safety</p>
          <h1>Tutor verification</h1>
          <span>Review identity and qualification evidence before enabling marketplace access.</span>
        </div>
        <Link to="/admin" className="admin-tutor-reviews-back">
          <DashboardIcon name="dashboard" size={17} />
          Admin overview
        </Link>
      </header>

      {notice ? <p className="admin-tutor-review-notice" role="status">{notice}</p> : null}

      <section className="admin-tutor-review-stats" aria-label="Verification queue summary">
        <article>
          <span><DashboardIcon name="verification" /></span>
          <div><strong>{verifications.length}</strong><small>Pending applications</small></div>
        </article>
        <article>
          <span><DashboardIcon name="documents" /></span>
          <div><strong>{readyCount}</strong><small>Ready to decide</small></div>
        </article>
        <article>
          <span><DashboardIcon name="audit" /></span>
          <div><strong>{actionRequiredCount}</strong><small>Need attention</small></div>
        </article>
      </section>

      {verificationsQuery.isError ? (
        <section className="admin-tutor-review-error" role="alert">
          <span><DashboardIcon name="verification" size={24} /></span>
          <div>
            <h2>Verification requests could not be loaded</h2>
            <p>{getApiErrorMessage(verificationsQuery.error)}</p>
          </div>
          <button type="button" onClick={() => verificationsQuery.refetch()}>Try again</button>
        </section>
      ) : (
        <div className="admin-tutor-review-workspace">
          <aside className="admin-tutor-review-queue" aria-label="Pending tutor applications">
            <div className="admin-tutor-review-queue-head">
              <div><strong>Review queue</strong><span>{visibleVerifications.length} shown</span></div>
              <label>
                <DashboardIcon name="search" size={17} />
                <span className="sr-only">Search tutor applications</span>
                <input
                  type="search"
                  placeholder="Search tutor"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
            </div>

            {verificationsQuery.isLoading ? (
              <ReviewQueueSkeleton />
            ) : visibleVerifications.length ? (
              <div className="admin-tutor-review-queue-list">
                {visibleVerifications.map((verification) => {
                  const reviewState = getReviewState(verification)
                  return (
                    <button
                      className={verification.id === activeVerificationId ? 'is-selected' : ''}
                      type="button"
                      key={verification.id}
                      onClick={() => {
                        setNotice('')
                        setSelectedVerificationId(verification.id)
                      }}
                    >
                      <UserAvatar
                        src={verification.profile_image_url}
                        name={verification.tutor_name || verification.tutor_email}
                        fallback="TU"
                        alt=""
                      />
                      <span>
                        <strong>{verification.tutor_name || 'Tutor applicant'}</strong>
                        <small>{verification.tutor_email}</small>
                        <em>{formatDate(verification.created_at)}</em>
                      </span>
                      <i className={`is-${reviewState.tone}`}>{reviewState.label}</i>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="admin-tutor-review-queue-empty">
                <DashboardIcon name={normalizedSearch ? 'search' : 'verification'} size={24} />
                <strong>{normalizedSearch ? 'No matching tutor' : 'Queue is clear'}</strong>
                <span>
                  {normalizedSearch
                    ? 'Try a different name or email.'
                    : 'New verification requests will appear here.'}
                </span>
                {normalizedSearch ? (
                  <button type="button" onClick={() => setSearchTerm('')}>Clear search</button>
                ) : null}
              </div>
            )}
          </aside>

          <main className="admin-tutor-review-detail">
            {verificationsQuery.isLoading ? (
              <div className="admin-tutor-review-detail-loading" aria-label="Loading tutor application">
                <span /><span /><span /><span />
              </div>
            ) : selectedVerification ? (
              <VerificationDetail
                verification={selectedVerification}
                reason={reasonById[selectedVerification.id] || ''}
                documentReviewById={documentReviewById}
                decisionBusy={decisionMutation.isPending}
                documentBusy={documentReviewMutation.isPending}
                onReasonChange={(value) => setReasonById((current) => ({
                  ...current,
                  [selectedVerification.id]: value,
                }))}
                onDocumentChange={(documentId, value) => setDocumentReviewById((current) => ({
                  ...current,
                  [documentId]: value,
                }))}
                onDocumentReview={(documentId, payload) => documentReviewMutation.mutate({
                  id: documentId,
                  payload,
                })}
                onDocumentPreview={openDocumentPreview}
                onDecision={(status) => decisionMutation.mutate({
                  id: selectedVerification.id,
                  status,
                  reason: (reasonById[selectedVerification.id] || '').trim(),
                })}
              />
            ) : (
              <div className="admin-tutor-review-detail-empty">
                <span><DashboardIcon name="verification" size={28} /></span>
                <h2>No application selected</h2>
                <p>Select a tutor from the review queue to inspect their evidence.</p>
              </div>
            )}
          </main>
        </div>
      )}

      <DocumentPreviewDialog
        preview={documentPreview}
        onClose={closeDocumentPreview}
        onRetry={() => openDocumentPreview(documentPreview.document)}
      />
    </section>
  )
}

function VerificationDetail({
  verification,
  reason,
  documentReviewById,
  decisionBusy,
  documentBusy,
  onReasonChange,
  onDocumentChange,
  onDocumentPreview,
  onDocumentReview,
  onDecision,
}) {
  const documents = Array.isArray(verification.documents) ? verification.documents : []
  const missing = Array.isArray(verification.missing_required_documents)
    ? verification.missing_required_documents
    : []
  const summary = verification.document_summary || {}
  const approvedDocuments = Number(summary.status_counts?.APPROVED) || 0
  const pendingDocuments = Number(summary.status_counts?.PENDING) || 0
  const reviewState = getReviewState(verification)
  const canApprove = summary.all_required_uploaded && !summary.has_blocking_issues

  return (
    <>
      <header className="admin-tutor-review-identity">
        <UserAvatar
          src={verification.profile_image_url}
          name={verification.tutor_name || verification.tutor_email}
          fallback="TU"
          loading="eager"
        />
        <div>
          <p>Application #{verification.id}</p>
          <h2>{verification.tutor_name || 'Tutor applicant'}</h2>
          <span>{verification.tutor_email}</span>
        </div>
        <i className={`is-${reviewState.tone}`}>{reviewState.label}</i>
      </header>

      <section className="admin-tutor-review-evidence-summary">
        <div><span>Uploaded</span><strong>{documents.length}</strong></div>
        <div><span>Approved</span><strong>{approvedDocuments}</strong></div>
        <div><span>Pending review</span><strong>{pendingDocuments}</strong></div>
        <div><span>Submitted</span><strong>{formatDate(verification.created_at)}</strong></div>
      </section>

      {missing.length ? (
        <section className="admin-tutor-review-missing">
          <DashboardIcon name="disputes" size={20} />
          <div>
            <strong>Required evidence is missing</strong>
            <p>{missing.map(formatLabel).join(', ')} must be uploaded before this tutor can be approved.</p>
          </div>
        </section>
      ) : null}

      <section className="admin-tutor-review-documents">
        <div className="admin-tutor-review-section-head">
          <div>
            <p>Evidence review</p>
            <h2>Submitted documents</h2>
          </div>
          <span>{documents.length} file{documents.length === 1 ? '' : 's'}</span>
        </div>

        {documents.length ? (
          <div className="admin-document-list">
            {documents.map((document) => (
              <AdminDocumentReview
                document={document}
                reviewValue={documentReviewById[document.id]}
                busy={documentBusy}
                key={document.id}
                onChange={(value) => onDocumentChange(document.id, value)}
                onPreview={() => onDocumentPreview(document)}
                onReview={(payload) => onDocumentReview(document.id, payload)}
              />
            ))}
          </div>
        ) : (
          <div className="admin-tutor-review-no-documents">
            <DashboardIcon name="documents" size={24} />
            <strong>No documents uploaded</strong>
            <span>The tutor must upload an ID and qualification certificate.</span>
          </div>
        )}
      </section>

      <section className="admin-tutor-review-decision">
        <div className="admin-tutor-review-section-head">
          <div>
            <p>Final decision</p>
            <h2>Record the verification outcome</h2>
          </div>
        </div>
        <label>
          <span>Decision note</span>
          <textarea
            aria-label="Tutor verification decision note"
            rows="4"
            placeholder="Record the reason, evidence reviewed, or changes the tutor needs to make."
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
          <small>Use a clear note for rejection or when further action may be required.</small>
        </label>
        {!canApprove ? (
          <p className="admin-tutor-review-approval-note">
            Approval remains unavailable until required documents are uploaded and blocking issues are resolved.
          </p>
        ) : null}
        <div>
          <button
            className="is-approve"
            type="button"
            onClick={() => onDecision('APPROVED')}
            disabled={decisionBusy || !canApprove}
          >
            <DashboardIcon name="verification" size={17} />
            {decisionBusy ? 'Saving...' : 'Approve tutor'}
          </button>
          <button
            className="is-reject"
            type="button"
            onClick={() => onDecision('REJECTED')}
            disabled={decisionBusy}
          >
            Reject application
          </button>
        </div>
      </section>
    </>
  )
}

function DocumentPreviewDialog({ preview, onClose, onRetry }) {
  const document = preview.document
  const title = document?.doc_type_display || formatLabel(document?.doc_type)
  const isPdf = preview.contentType.includes('pdf')
  const isImage = preview.contentType.startsWith('image/')

  return (
    <ConfirmationDialog
      open={Boolean(document)}
      onClose={onClose}
      labelledBy="verification-preview-title"
      describedBy="verification-preview-description"
      backdropClassName="admin-document-preview-backdrop"
      dialogClassName="admin-document-preview-dialog"
    >
      <header className="admin-document-preview-header">
        <div>
          <span>Verification evidence</span>
          <h2 id="verification-preview-title">{title}</h2>
          <p id="verification-preview-description">
            Inspect the complete document before recording a review decision.
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close document preview">
          <DashboardIcon name="close" size={18} />
          Close
        </button>
      </header>

      <div className="admin-document-preview-stage">
        {preview.loading ? (
          <div className="admin-document-preview-loading" role="status">
            <span />
            <strong>Preparing secure preview...</strong>
            <small>The document is being loaded from protected storage.</small>
          </div>
        ) : preview.error ? (
          <div className="admin-document-preview-error" role="alert">
            <DashboardIcon name="documents" size={28} />
            <strong>Preview unavailable</strong>
            <p>{preview.error}</p>
            <button type="button" onClick={onRetry}>Try again</button>
          </div>
        ) : isPdf ? (
          <iframe
            src={preview.url}
            title={`${title} preview`}
          />
        ) : isImage ? (
          <img src={preview.url} alt={`${title} submitted by the tutor`} />
        ) : (
          <div className="admin-document-preview-error">
            <DashboardIcon name="documents" size={28} />
            <strong>Preview is not supported for this file</strong>
            <p>Download the document to inspect it with a compatible application.</p>
          </div>
        )}
      </div>

      <footer className="admin-document-preview-footer">
        <div>
          <strong>{getDocumentFilename(document)}</strong>
          <span>{document?.status_display || formatLabel(document?.status)}</span>
        </div>
        {preview.url ? (
          <a href={preview.url} download={getDocumentFilename(document)}>
            Download copy
          </a>
        ) : null}
      </footer>
    </ConfirmationDialog>
  )
}
