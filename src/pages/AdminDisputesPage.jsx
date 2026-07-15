import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import { decideDispute, listDisputes } from '../api/services/bookings.js'
import { useAuth } from '../context/AuthContext.jsx'
import { queryKeys } from '../api/queryKeys'

export function AdminDisputesPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [commentById, setCommentById] = useState({})
  const [notice, setNotice] = useState('')

  const disputesQuery = useQuery({
    queryKey: queryKeys.admin.disputes,
    queryFn: async () => (await listDisputes()).data,
    enabled: isAuthenticated && user?.role === 'ADMIN',
  })

  const decisionMutation = useMutation({
    mutationFn: async ({ id, status, comment }) => (await decideDispute(id, { status, comment })).data,
    onSuccess: async () => {
      setNotice('Dispute updated successfully.')
      toast.success('Dispute updated successfully.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.disputes })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const disputes = Array.isArray(disputesQuery.data) ? disputesQuery.data : []

  if (!isAuthenticated) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Admin disputes</p>
        <h1>Sign in to review disputes.</h1>
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
        <p className="eyebrow">Admin disputes</p>
        <h1>This area is for admins only.</h1>
        <div className="hero-actions">
          <Link className="primary-button" to="/bookings">View bookings</Link>
          <Link className="secondary-button" to="/contact">Contact support</Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="page-card card">
        <p className="eyebrow">Admin disputes</p>
        <h1>Review booking disputes.</h1>
        <p className="supporting-text">Handle reported bookings and keep the marketplace trusted.</p>
        {notice ? <p className="supporting-text">{notice}</p> : null}
      </section>

      <section className="card trust-section">
        <div className="section-heading section-heading-center">
          <div>
            <p className="eyebrow">Open cases</p>
            <h2>{disputesQuery.isLoading ? 'Loading disputes...' : `${disputes.length} dispute${disputes.length === 1 ? '' : 's'}`}</h2>
          </div>
          <p className="section-text section-text-center">Each case includes the report reason and current status.</p>
        </div>
      </section>

      <section className="cards-grid">
        {disputesQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <article className="tutor-card tutor-card-skeleton" key={index} aria-busy="true">
              <div className="skeleton skeleton-line skeleton-title" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-button" />
            </article>
          ))
        ) : disputes.length === 0 ? (
          <article className="panel card">
            <p className="supporting-text">No disputes found.</p>
          </article>
        ) : (
          disputes.map((dispute) => {
            const comment = commentById[dispute.id] || ''
            return (
              <article className="tutor-card" key={dispute.id}>
                <div className="tutor-card-top">
                  <div>
                    <h3>Booking #{dispute.booking_id}</h3>
                    <p>{dispute.reported_by_email} reported {dispute.reported_against_email}</p>
                  </div>
                  <span className="soft-chip">{dispute.status}</span>
                </div>
                <p className="tutor-price">{dispute.reason}</p>
                <div className="mini-list">
                  <div><span>Admin note: {dispute.admin_comment || 'None'}</span></div>
                  <div><span>Resolved: {dispute.resolved_at || 'No'}</span></div>
                </div>
                <textarea
                  aria-label="Admin dispute comment"
                  rows="3"
                  placeholder="Admin comment"
                  value={comment}
                  onChange={(event) => setCommentById((current) => ({ ...current, [dispute.id]: event.target.value }))}
                  style={{ marginTop: '1rem' }}
                />
                <div className="hero-actions" style={{ marginTop: '1rem' }}>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => decisionMutation.mutate({ id: dispute.id, status: 'RESOLVED', comment })}
                    disabled={decisionMutation.isPending}
                  >
                    Resolve
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => decisionMutation.mutate({ id: dispute.id, status: 'REJECTED', comment })}
                    disabled={decisionMutation.isPending}
                  >
                    Reject
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => decisionMutation.mutate({ id: dispute.id, status: 'UNDER_REVIEW', comment })}
                    disabled={decisionMutation.isPending}
                  >
                    Mark review
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
