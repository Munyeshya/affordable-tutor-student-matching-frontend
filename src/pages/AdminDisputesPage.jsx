import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { decideDispute, getDispute, listDisputes } from '../api/services/bookings.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './AdminDisputesPage.css'

const STATUS_TABS = [
  ['', 'All cases'],
  ['OPEN', 'Open'],
  ['UNDER_REVIEW', 'Under review'],
  ['RESOLVED', 'Resolved'],
  ['REJECTED', 'Rejected'],
]

const ACTIONS = {
  UNDER_REVIEW: {
    label: 'Move to review',
    shortLabel: 'Mark under review',
    className: 'is-neutral',
    description: 'Keep the case open while recording why more investigation or evidence is needed.',
  },
  RESOLVED: {
    label: 'Resolve dispute',
    shortLabel: 'Resolve',
    className: 'is-positive',
    description: 'Close the case as resolved after the available evidence supports intervention.',
  },
  REJECTED: {
    label: 'Reject dispute',
    shortLabel: 'Reject claim',
    className: 'is-danger',
    description: 'Close the case because the available evidence does not support the reported claim.',
  },
}

function formatLabel(value) {
  return String(value || 'Unknown').toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function formatDate(value, includeTime = false) {
  if (!value) return 'Not yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat('en-RW', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date)
}

function formatMoney(amount, currency = 'RWF') {
  if (amount === null || amount === undefined || amount === '') return 'Not recorded'
  const numericAmount = Number(amount)
  if (Number.isNaN(numericAmount)) return `${amount} ${currency}`
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'RWF' ? 0 : 2,
  }).format(numericAmount)
}

function DisputeStatus({ status }) {
  return <span className={`admin-dispute-status is-${String(status).toLowerCase()}`}>{formatLabel(status)}</span>
}

export function AdminDisputesPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedDisputeId, setSelectedDisputeId] = useState(null)
  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')

  const disputesQuery = useQuery({
    queryKey: queryKeys.admin.disputes,
    queryFn: async () => (await listDisputes()).data,
    enabled: isAuthenticated && user?.role === 'ADMIN',
    staleTime: 15_000,
  })
  const disputeQuery = useQuery({
    queryKey: queryKeys.admin.dispute(selectedDisputeId),
    queryFn: async () => (await getDispute(selectedDisputeId)).data,
    enabled: Boolean(selectedDisputeId) && isAuthenticated && user?.role === 'ADMIN',
  })
  const decisionMutation = useMutation({
    mutationFn: ({ id, status, comment }) => decideDispute(id, { status, comment }),
    onSuccess: async (response, variables) => {
      queryClient.setQueryData(queryKeys.admin.dispute(variables.id), response.data)
      toast.success(`${ACTIONS[variables.status].label} completed.`)
      setAction('')
      setReason('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.disputes }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'audit-events'] }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'The dispute decision could not be saved.')),
  })

  const disputes = Array.isArray(disputesQuery.data) ? disputesQuery.data : []
  const normalizedSearch = search.trim().toLowerCase()
  const filteredDisputes = disputes.filter((dispute) => {
    if (statusFilter && dispute.status !== statusFilter) return false
    if (!normalizedSearch) return true
    return [
      dispute.id,
      dispute.booking_id,
      dispute.reported_by_name,
      dispute.reported_by_email,
      dispute.reported_against_name,
      dispute.reported_against_email,
      dispute.reason,
      dispute.booking_context?.subject,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
  })
  const selectedDispute = disputeQuery.data
  const stats = {
    open: disputes.filter((item) => item.status === 'OPEN').length,
    review: disputes.filter((item) => item.status === 'UNDER_REVIEW').length,
    closed: disputes.filter((item) => ['RESOLVED', 'REJECTED'].includes(item.status)).length,
  }
  const availableActions = selectedDispute?.status === 'OPEN'
    ? ['UNDER_REVIEW', 'RESOLVED', 'REJECTED']
    : selectedDispute?.status === 'UNDER_REVIEW'
      ? ['RESOLVED', 'REJECTED']
      : []
  const actionConfig = ACTIONS[action]

  function openDispute(id) {
    setAction('')
    setReason('')
    setSelectedDisputeId(id)
  }

  function closeDialog() {
    if (decisionMutation.isPending) return
    setSelectedDisputeId(null)
    setAction('')
    setReason('')
  }

  function submitDecision(event) {
    event.preventDefault()
    const cleanReason = reason.trim()
    if (cleanReason.length < 10) {
      toast.error('Provide a clear decision reason of at least 10 characters.')
      return
    }
    decisionMutation.mutate({ id: selectedDispute.id, status: action, comment: cleanReason })
  }

  if (!isAuthenticated) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Admin disputes</p>
        <h1>Sign in to review disputes.</h1>
        <Link className="primary-button" to="/sign-in">Sign in</Link>
      </section>
    )
  }

  if (user?.role !== 'ADMIN') {
    return (
      <section className="page-card card">
        <p className="eyebrow">Admin disputes</p>
        <h1>This area is for admins only.</h1>
        <Link className="primary-button" to="/dashboard">Return to dashboard</Link>
      </section>
    )
  }

  const columns = [
    {
      key: 'case',
      header: 'Case',
      render: (row) => (
        <span className="admin-dispute-identity">
          <strong>Dispute #{row.id}</strong>
          <small>Booking #{row.booking_id} / {row.booking_context?.subject || 'Subject unavailable'}</small>
        </span>
      ),
    },
    {
      key: 'reporter',
      header: 'Reported by',
      render: (row) => (
        <span className="admin-dispute-person">
          <strong>{row.reported_by_name}</strong>
          <small>{row.reported_by_email}</small>
        </span>
      ),
    },
    {
      key: 'against',
      header: 'Reported against',
      render: (row) => (
        <span className="admin-dispute-person">
          <strong>{row.reported_against_name}</strong>
          <small>{row.reported_against_email}</small>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <DisputeStatus status={row.status} /> },
    { key: 'submitted', header: 'Submitted', render: (row) => <time dateTime={row.created_at}>{formatDate(row.created_at)}</time> },
    { key: 'actions', header: 'Actions', render: (row) => <button className="admin-dispute-open" type="button" onClick={() => openDispute(row.id)}>Inspect case</button> },
  ]

  return (
    <section className="admin-disputes-page">
      <header className="admin-disputes-header">
        <div>
          <p className="admin-overview-eyebrow">Trust and safety</p>
          <h1>Dispute resolution</h1>
          <p>Review the report, participant details, relevant booking context, and decision history before closing a case.</p>
        </div>
        <div className="admin-disputes-total"><strong>{disputes.length}</strong><span>Total cases</span></div>
      </header>

      <aside className="admin-disputes-policy">
        <DashboardIcon name="disputes" size={22} />
        <p><strong>Evidence comes before action.</strong> Resolution controls are available only after opening a case. Lesson dates, schedules, locations, and private booking notes remain hidden from administration.</p>
      </aside>

      <section className="admin-disputes-metrics" aria-label="Dispute summary">
        <article><span>Awaiting review</span><strong>{stats.open}</strong><small>New cases needing inspection</small></article>
        <article><span>Under review</span><strong>{stats.review}</strong><small>Cases being investigated</small></article>
        <article><span>Closed</span><strong>{stats.closed}</strong><small>Resolved or rejected cases</small></article>
      </section>

      <nav className="admin-disputes-tabs" aria-label="Dispute status">
        {STATUS_TABS.map(([value, label]) => (
          <button className={statusFilter === value ? 'is-active' : ''} type="button" key={value || 'all'} onClick={() => setStatusFilter(value)}>{label}</button>
        ))}
      </nav>

      <section className="admin-disputes-results" aria-busy={disputesQuery.isLoading}>
        <header>
          <div><p>Case queue</p><h2>{disputesQuery.isLoading ? 'Loading cases...' : `${filteredDisputes.length} matching case${filteredDisputes.length === 1 ? '' : 's'}`}</h2></div>
          <label><DashboardIcon name="search" size={17} /><span className="sr-only">Search disputes</span><input type="search" placeholder="Search case, person, booking, or subject" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </header>
        {disputesQuery.isLoading ? (
          <SkeletonLoader rows={6} className="admin-disputes-skeleton" />
        ) : disputesQuery.isError ? (
          <ErrorState title="Disputes could not be loaded." message={getApiErrorMessage(disputesQuery.error)} onRetry={disputesQuery.refetch} />
        ) : filteredDisputes.length ? (
          <DataTable columns={columns} rows={filteredDisputes} caption="Dispute resolution queue" className="admin-disputes-table" />
        ) : (
          <EmptyState icon={<DashboardIcon name="disputes" size={28} />} title="No matching disputes" description="The selected queue is clear. Choose another status or change the search." />
        )}
      </section>

      <ConfirmationDialog open={Boolean(selectedDisputeId)} onClose={closeDialog} labelledBy="admin-dispute-dialog-title" describedBy="admin-dispute-dialog-description" dialogClassName="admin-dispute-dialog">
        <header>
          <div><span>Case evidence</span><h2 id="admin-dispute-dialog-title">{selectedDispute ? `Dispute #${selectedDispute.id}` : 'Loading case...'}</h2></div>
          <button type="button" onClick={closeDialog} disabled={decisionMutation.isPending}>Close</button>
        </header>

        {disputeQuery.isLoading ? (
          <SkeletonLoader rows={6} className="admin-disputes-skeleton" />
        ) : disputeQuery.isError ? (
          <ErrorState title="Case details could not be loaded." message={getApiErrorMessage(disputeQuery.error)} onRetry={disputeQuery.refetch} />
        ) : selectedDispute ? (
          <>
            <div className="admin-dispute-detail-grid">
              <div><span>Case status</span><DisputeStatus status={selectedDispute.status} /></div>
              <div><span>Booking</span><strong>#{selectedDispute.booking_id}</strong></div>
              <div><span>Submitted</span><strong>{formatDate(selectedDispute.created_at, true)}</strong></div>
              <div><span>Reported by</span><strong>{selectedDispute.reported_by_name}</strong><small>{selectedDispute.reported_by_email}</small></div>
              <div><span>Reported against</span><strong>{selectedDispute.reported_against_name}</strong><small>{selectedDispute.reported_against_email}</small></div>
              <div><span>Reviewed by</span><strong>{selectedDispute.reviewed_by_name || 'Not reviewed'}</strong><small>{formatDate(selectedDispute.reviewed_at, true)}</small></div>
            </div>

            <section className="admin-dispute-booking-context">
              <h3>Relevant booking context</h3>
              <div>
                <span><small>Subject</small><strong>{selectedDispute.booking_context?.subject}</strong></span>
                <span><small>Mode</small><strong>{formatLabel(selectedDispute.booking_context?.mode)}</strong></span>
                <span><small>Booking status</small><strong>{formatLabel(selectedDispute.booking_context?.status)}</strong></span>
                <span><small>Amount</small><strong>{formatMoney(selectedDispute.booking_context?.total_amount, selectedDispute.booking_context?.currency)}</strong></span>
              </div>
              <p>Scheduling, location, and private lesson notes are intentionally excluded.</p>
            </section>

            <section className="admin-dispute-evidence">
              <h3>Reported concern</h3>
              <p id="admin-dispute-dialog-description">{selectedDispute.reason}</p>
              <small>This statement is read-only evidence submitted by {selectedDispute.reported_by_name}.</small>
            </section>

            {selectedDispute.decisions?.length ? (
              <section className="admin-dispute-history">
                <h3>Decision history</h3>
                {selectedDispute.decisions.map((decision) => (
                  <article key={decision.id}>
                    <span>{formatLabel(decision.status)}</span>
                    <div><p>{decision.comment}</p><small>{decision.admin_name} / {formatDate(decision.created_at, true)}</small></div>
                  </article>
                ))}
              </section>
            ) : null}

            {action ? (
              <form className="admin-dispute-decision-form" onSubmit={submitDecision}>
                <button type="button" onClick={() => setAction('')} disabled={decisionMutation.isPending}>Back to decisions</button>
                <h3>{actionConfig.label}</h3>
                <p>{actionConfig.description}</p>
                <label><span>Required decision reason</span><textarea rows="4" maxLength="2000" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Record the evidence considered and explain this decision." /></label>
                <small>{reason.trim().length}/10 minimum characters</small>
                <div><button className="secondary-button" type="button" onClick={() => setAction('')} disabled={decisionMutation.isPending}>Cancel</button><button className={`admin-dispute-confirm ${actionConfig.className}`} type="submit" disabled={decisionMutation.isPending || reason.trim().length < 10}>{decisionMutation.isPending ? 'Saving decision...' : actionConfig.label}</button></div>
              </form>
            ) : availableActions.length ? (
              <section className="admin-dispute-actions">
                <h3>Case decision</h3>
                <p>The case is now recorded as reviewed. Choose an action only after considering all evidence shown above.</p>
                <div>{availableActions.map((item) => <button className={ACTIONS[item].className} type="button" key={item} onClick={() => setAction(item)}>{ACTIONS[item].shortLabel}</button>)}</div>
              </section>
            ) : (
              <section className="admin-dispute-closed"><DashboardIcon name="verification" size={20} /><p><strong>This case is closed.</strong> The final decision is preserved in the history and cannot be changed.</p></section>
            )}
          </>
        ) : null}
      </ConfirmationDialog>
    </section>
  )
}
