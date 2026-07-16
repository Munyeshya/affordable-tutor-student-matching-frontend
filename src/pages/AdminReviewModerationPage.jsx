import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { decideAdminReviewReport, getAdminReviewReport, listAdminReviewReports } from '../api/services/reviews.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import './AdminReviewModerationPage.css'


const PAGE_SIZE = 20
const EMPTY_FILTERS = { search: '', status: 'OPEN', review_type: '', category: '', ordering: 'newest' }
const STATUS_TABS = [['OPEN', 'Open reports'], ['RESOLVED', 'Resolved'], ['DISMISSED', 'Dismissed'], ['', 'All reports']]
const ACTIONS = {
  HIDE: { label: 'Hide review', shortLabel: 'Hide', className: 'is-danger', description: 'Remove this review from public profiles, rating counts, and averages while preserving its original evidence.' },
  RESTORE: { label: 'Restore review', shortLabel: 'Restore', className: 'is-positive', description: 'Return this hidden review to public profiles and rating calculations without changing its original content.' },
  DISMISS: { label: 'Dismiss report', shortLabel: 'Dismiss report', className: 'is-neutral', description: 'Close this report without changing the review visibility because no moderation violation was confirmed.' },
}

function formatLabel(value) {
  return String(value || 'Unknown').toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function formatDate(value, includeTime = false) {
  if (!value) return 'Not reviewed'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat('en-RW', includeTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date)
}

function ReportStatus({ status }) {
  return <span className={`admin-review-report-status is-${String(status).toLowerCase()}`}>{formatLabel(status)}</span>
}

export function AdminReviewModerationPage() {
  const queryClient = useQueryClient()
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')
  const params = { ...filters, page, page_size: PAGE_SIZE }

  const reportsQuery = useQuery({
    queryKey: queryKeys.admin.reviewReports(params),
    queryFn: () => listAdminReviewReports(params).then((response) => response.data),
    staleTime: 15_000,
  })
  const reportQuery = useQuery({
    queryKey: queryKeys.admin.reviewReport(selectedReportId),
    queryFn: () => getAdminReviewReport(selectedReportId).then((response) => response.data),
    enabled: Boolean(selectedReportId),
  })
  const decisionMutation = useMutation({
    mutationFn: ({ id, moderationAction, moderationReason }) => decideAdminReviewReport(id, { action: moderationAction, reason: moderationReason }),
    onSuccess: async (_, variables) => {
      toast.success(`${ACTIONS[variables.moderationAction].label} completed.`)
      setAction('')
      setReason('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'review-moderation'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'audit-events'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.all }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'The review moderation decision could not be saved.')),
  })

  const reportPage = reportsQuery.data || { count: 0, next: null, previous: null, results: [] }
  const reports = Array.isArray(reportPage.results) ? reportPage.results : []
  const selectedReport = reportQuery.data
  const totalPages = Math.max(1, Math.ceil(reportPage.count / PAGE_SIZE))
  const actionConfig = ACTIONS[action]

  function updateDraft(field, value) {
    setDraftFilters((current) => ({ ...current, [field]: value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setFilters(draftFilters)
    setPage(1)
  }

  function selectStatus(status) {
    setDraftFilters((current) => ({ ...current, status }))
    setFilters((current) => ({ ...current, status }))
    setPage(1)
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  function openReport(id) {
    setAction('')
    setReason('')
    setSelectedReportId(id)
  }

  function closeDialog() {
    if (decisionMutation.isPending) return
    setSelectedReportId(null)
    setAction('')
    setReason('')
  }

  function chooseAction(nextAction) {
    setAction(nextAction)
    setReason('')
  }

  function submitDecision(event) {
    event.preventDefault()
    if (reason.trim().length < 10) {
      toast.error('Provide a clear moderation reason of at least 10 characters.')
      return
    }
    decisionMutation.mutate({ id: selectedReport.id, moderationAction: action, moderationReason: reason.trim() })
  }

  const availableActions = selectedReport?.visibility_status === 'HIDDEN' ? ['RESTORE'] : ['HIDE', 'DISMISS']
  const columns = [
    { key: 'review', header: 'Review', render: (row) => <span className="admin-review-identity"><strong>{row.context_label}</strong><small>{formatLabel(row.review_type)} review / {row.rating} out of 5</small></span> },
    { key: 'reporter', header: 'Reported by', render: (row) => <span className="admin-review-person"><strong>{row.reporter_name}</strong><small>{row.reporter_email || 'Account unavailable'}</small></span> },
    { key: 'category', header: 'Concern', render: (row) => formatLabel(row.category_display) },
    { key: 'visibility', header: 'Visibility', render: (row) => <span className={`admin-review-visibility is-${row.visibility_status.toLowerCase()}`}>{formatLabel(row.visibility_status)}</span> },
    { key: 'status', header: 'Report status', render: (row) => <ReportStatus status={row.status} /> },
    { key: 'reported', header: 'Reported', render: (row) => <time dateTime={row.created_at}>{formatDate(row.created_at)}</time> },
    { key: 'actions', header: 'Actions', render: (row) => <button className="admin-review-open" type="button" onClick={() => openReport(row.id)}>Inspect report</button> },
  ]

  return (
    <section className="admin-review-page">
      <header className="admin-review-header">
        <div><p className="admin-overview-eyebrow">Administration</p><h1>Review moderation</h1><p>Investigate reported student feedback while preserving the original rating, comment, reporter evidence, and every moderation decision.</p></div>
        <div className="admin-review-summary"><strong>{reportPage.count}</strong><span>Matching reports</span></div>
      </header>

      <aside className="admin-review-policy"><DashboardIcon name="reviews" size={22} /><p><strong>Moderate visibility, never the student&apos;s words.</strong> Hidden reviews stop affecting public averages but remain available as evidence. Restore when safe, or dismiss reports that do not establish a violation.</p></aside>

      <nav className="admin-review-tabs" aria-label="Review report status">{STATUS_TABS.map(([value, label]) => <button className={filters.status === value ? 'is-active' : ''} type="button" key={value || 'all'} onClick={() => selectStatus(value)}>{label}</button>)}</nav>

      <form className="admin-review-filters" onSubmit={applyFilters}>
        <label className="admin-review-search"><span>Search</span><input type="search" placeholder="Review, report, user, lesson, or subject" value={draftFilters.search} onChange={(event) => updateDraft('search', event.target.value)} /></label>
        <label><span>Review type</span><select value={draftFilters.review_type} onChange={(event) => updateDraft('review_type', event.target.value)}><option value="">All types</option><option value="BOOKING">Tutoring sessions</option><option value="LESSON">Course lessons</option></select></label>
        <label><span>Category</span><select value={draftFilters.category} onChange={(event) => updateDraft('category', event.target.value)}><option value="">All concerns</option><option value="INAPPROPRIATE">Inappropriate content</option><option value="HARASSMENT">Harassment or abuse</option><option value="SPAM">Spam or advertising</option><option value="FALSE_INFORMATION">False information</option><option value="PRIVACY">Privacy concern</option><option value="OTHER">Other</option></select></label>
        <label><span>Order</span><select value={draftFilters.ordering} onChange={(event) => updateDraft('ordering', event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
        <div className="admin-review-filter-actions"><button className="primary-button" type="submit">Apply filters</button><button className="secondary-button" type="button" onClick={clearFilters}>Clear</button></div>
      </form>

      <section className="admin-review-results" aria-busy={reportsQuery.isLoading}>
        <header><div><p>Quality queue</p><h2>{reportsQuery.isLoading ? 'Loading reports...' : `${reportPage.count} report${reportPage.count === 1 ? '' : 's'}`}</h2></div><span>Open concerns appear first</span></header>
        {reportsQuery.isLoading ? <SkeletonLoader rows={6} className="admin-review-skeleton" /> : reportsQuery.isError ? <ErrorState className="admin-overview-error" title="Review reports could not be loaded." message={getApiErrorMessage(reportsQuery.error)} onRetry={reportsQuery.refetch} /> : reports.length ? <DataTable columns={columns} rows={reports} caption="Reported review moderation queue" className="admin-review-table" /> : <EmptyState className="admin-panel-empty" icon={<DashboardIcon name="reviews" size={28} />} title="No matching review reports" description="The selected moderation queue is clear. Choose another status or clear the filters." />}
        {reportPage.count > PAGE_SIZE ? <nav className="admin-review-pagination" aria-label="Review report pages"><button type="button" disabled={!reportPage.previous} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={!reportPage.next} onClick={() => setPage((current) => current + 1)}>Next</button></nav> : null}
      </section>

      <ConfirmationDialog open={Boolean(selectedReportId)} onClose={closeDialog} labelledBy="admin-review-dialog-title" describedBy="admin-review-dialog-description" dialogClassName="admin-review-dialog">
        <header><div><span>Reported review</span><h2 id="admin-review-dialog-title">{selectedReport?.context_label || 'Loading report...'}</h2></div><button type="button" onClick={closeDialog} disabled={decisionMutation.isPending}>Close</button></header>
        {reportQuery.isLoading ? <SkeletonLoader rows={6} className="admin-review-skeleton" /> : reportQuery.isError ? <ErrorState className="admin-overview-error" title="Review report details could not be loaded." message={getApiErrorMessage(reportQuery.error)} onRetry={reportQuery.refetch} /> : selectedReport ? <>
          <div className="admin-review-detail-grid"><div><span>Report status</span><ReportStatus status={selectedReport.status} /></div><div><span>Visibility</span><strong>{formatLabel(selectedReport.visibility_status)}</strong></div><div><span>Category</span><strong>{selectedReport.category_display}</strong></div><div><span>Reporter</span><strong>{selectedReport.reporter_name}</strong><small>{selectedReport.reporter_email}</small></div><div><span>Review author</span><strong>{selectedReport.author_name}</strong></div><div><span>Reviewed tutor</span><strong>{selectedReport.tutor_name}</strong></div></div>
          <section className="admin-review-original"><h3>Original review evidence</h3><div><strong>{selectedReport.rating} / 5</strong><blockquote>{selectedReport.comment || 'No written comment was added.'}</blockquote></div><small>The rating and comment are read-only and cannot be changed by moderation.</small></section>
          <section className="admin-review-report-copy"><h3>Reported concern</h3><p id="admin-review-dialog-description">{selectedReport.details}</p><small>Submitted {formatDate(selectedReport.created_at, true)} by {selectedReport.reporter_name}</small></section>
          {selectedReport.decisions.length ? <section className="admin-review-history"><h3>Decision history</h3>{selectedReport.decisions.map((decision) => <article key={decision.id}><span>{formatLabel(decision.action)}</span><div><p>{decision.reason}</p><small>{decision.admin_name} / {formatDate(decision.created_at, true)} / {formatLabel(decision.previous_visibility)} to {formatLabel(decision.new_visibility)}</small></div></article>)}</section> : null}
          {action ? <form className="admin-review-decision-form" onSubmit={submitDecision}><button type="button" onClick={() => setAction('')} disabled={decisionMutation.isPending}>Back to decisions</button><h3>{actionConfig.label}</h3><p>{actionConfig.description}</p><label><span>Required moderation reason</span><textarea rows="4" maxLength="1000" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Record the evidence and policy basis for this decision." /></label><small>{reason.trim().length}/10 minimum characters</small><div><button className="secondary-button" type="button" onClick={() => setAction('')} disabled={decisionMutation.isPending}>Cancel</button><button className={`admin-review-confirm ${actionConfig.className}`} type="submit" disabled={decisionMutation.isPending || reason.trim().length < 10}>{decisionMutation.isPending ? 'Saving...' : actionConfig.label}</button></div></form> : <section className="admin-review-actions"><h3>Moderation decision</h3><p>Choose an action based on the original review and the reported concern.</p><div>{availableActions.map((item) => <button className={ACTIONS[item].className} type="button" key={item} onClick={() => chooseAction(item)}>{ACTIONS[item].shortLabel}</button>)}</div></section>}
        </> : null}
      </ConfirmationDialog>
    </section>
  )
}
