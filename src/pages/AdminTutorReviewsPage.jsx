import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import {
  decideTutorVerification,
  listTutorVerifications,
  reviewTutorDocument,
} from '../api/services/tutors.js'
import { AdminDocumentReview } from '../components/VerificationDocuments.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { queryKeys } from '../api/queryKeys'

export function AdminTutorReviewsPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [reasonById, setReasonById] = useState({})
  const [documentReviewById, setDocumentReviewById] = useState({})
  const [notice, setNotice] = useState('')

  const verificationsQuery = useQuery({
    queryKey: queryKeys.admin.tutorVerifications(),
    queryFn: async () => (await listTutorVerifications({ status: 'PENDING' })).data,
    enabled: isAuthenticated && user?.role === 'ADMIN',
  })

  const decisionMutation = useMutation({
    mutationFn: async ({ id, status, reason }) => (await decideTutorVerification(id, { status, reason })).data,
    onSuccess: async () => {
      setNotice('Tutor verification updated successfully.')
      toast.success('Tutor verification updated successfully.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.tutorVerifications() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.checklist })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const documentReviewMutation = useMutation({
    mutationFn: async ({ id, payload }) => (
      await reviewTutorDocument(id, payload)
    ).data,
    onSuccess: async () => {
      toast.success('Document review saved.')
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.tutorVerifications(),
      })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const verifications = Array.isArray(verificationsQuery.data) ? verificationsQuery.data : []

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

  return (
    <>
      <section className="page-card card">
        <p className="eyebrow">Admin reviews</p>
        <h1>Review tutor verification requests.</h1>
        <p className="supporting-text">Approve tutors only after documents, agreement, and subject coverage are complete.</p>
        {notice ? <p className="supporting-text">{notice}</p> : null}
      </section>

      <section className="card trust-section">
        <div className="section-heading section-heading-center">
          <div>
            <p className="eyebrow">Pending</p>
            <h2>{verificationsQuery.isLoading ? 'Loading tutor requests...' : `${verifications.length} pending request${verifications.length === 1 ? '' : 's'}`}</h2>
          </div>
          <p className="section-text section-text-center">Each review is document-backed and controlled by admin approval.</p>
        </div>
      </section>

      <section className="cards-grid">
        {verificationsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <article className="tutor-card tutor-card-skeleton" key={index} aria-busy="true">
              <div className="skeleton skeleton-line skeleton-title" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-button" />
            </article>
          ))
        ) : verifications.length === 0 ? (
          <article className="panel card">
            <p className="supporting-text">No pending tutor verifications right now.</p>
          </article>
        ) : (
          verifications.map((verification) => {
            const docs = Array.isArray(verification.documents) ? verification.documents : []
            const missing = Array.isArray(verification.missing_required_documents) ? verification.missing_required_documents : []
            const reason = reasonById[verification.id] || ''

            return (
              <article className="tutor-card" key={verification.id}>
                <div className="tutor-card-top">
                  <div>
                    <h3>{verification.tutor_name || verification.tutor_email}</h3>
                    <p>{verification.tutor_email}</p>
                  </div>
                  <span className="soft-chip">{verification.status}</span>
                </div>
                <div className="trust-marks" style={{ marginBottom: '1rem' }}>
                  {missing.length > 0 ? missing.map((item) => (
                    <span className="trust-mark" key={item}>{item}</span>
                  )) : <span className="trust-mark">All required docs uploaded</span>}
                </div>
                <div className="admin-document-list">
                  {docs.map((doc) => (
                    <AdminDocumentReview
                      document={doc}
                      reviewValue={documentReviewById[doc.id]}
                      busy={documentReviewMutation.isPending}
                      key={doc.id}
                      onChange={(value) => setDocumentReviewById((current) => ({
                        ...current,
                        [doc.id]: value,
                      }))}
                      onReview={(payload) => documentReviewMutation.mutate({
                        id: doc.id,
                        payload,
                      })}
                    />
                  ))}
                </div>
                <textarea
                  aria-label="Tutor verification decision note"
                  rows="3"
                  placeholder="Reason or review note"
                  value={reason}
                  onChange={(event) => setReasonById((current) => ({ ...current, [verification.id]: event.target.value }))}
                  style={{ marginTop: '1rem' }}
                />
                <div className="hero-actions" style={{ marginTop: '1rem' }}>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => decisionMutation.mutate({ id: verification.id, status: 'APPROVED', reason })}
                    disabled={
                      decisionMutation.isPending ||
                      !verification.document_summary?.all_required_uploaded ||
                      verification.document_summary?.has_blocking_issues
                    }
                  >
                    Approve
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => decisionMutation.mutate({ id: verification.id, status: 'REJECTED', reason })}
                    disabled={decisionMutation.isPending}
                  >
                    Reject
                  </button>
                </div>
              </article>
            )
          })
        )}
      </section>
    </>
  )
}
