import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { downloadAuditEvents, listAuditEvents } from '../api/services/audit.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import './AdminAuditPage.css'


const PAGE_SIZE = 20
const EMPTY_FILTERS = {
  search: '',
  action: '',
  outcome: '',
  target_type: '',
  date_from: '',
  date_to: '',
}

const ACTION_OPTIONS = [
  ['auth.login', 'Sign in'],
  ['auth.register', 'Registration'],
  ['account.activate', 'Account activation'],
  ['account.deactivate', 'Account deactivation'],
  ['account.suspend', 'Account suspension'],
  ['account.restore', 'Account restoration'],
  ['profile.update', 'Profile update'],
  ['tutor.document.submit', 'Tutor document submission'],
  ['tutor.document.review', 'Tutor document review'],
  ['tutor.verification.decide', 'Tutor verification decision'],
  ['booking.create', 'Booking creation'],
  ['booking.status.change', 'Booking status change'],
  ['dispute.create', 'Dispute creation'],
  ['dispute.decide', 'Dispute decision'],
  ['course.moderate', 'Course moderation'],
  ['payment.payout.decide', 'Payout decision'],
  ['audit.view', 'Audit trail access'],
  ['audit.export', 'Audit export'],
]

function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown time'
  return new Intl.DateTimeFormat('en-RW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatTarget(value) {
  return String(value || 'System').replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

export function AdminAuditPage() {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const queryParams = { ...filters, page, page_size: PAGE_SIZE }

  const eventsQuery = useQuery({
    queryKey: queryKeys.admin.auditEvents(queryParams),
    queryFn: () => listAuditEvents(queryParams).then((response) => response.data),
    staleTime: 15_000,
  })

  const auditPage = eventsQuery.data || { count: 0, next: null, previous: null, results: [] }
  const events = auditPage.results
  const totalPages = Math.max(1, Math.ceil(auditPage.count / PAGE_SIZE))

  function updateDraft(field, value) {
    setDraftFilters((current) => ({ ...current, [field]: value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setPage(1)
    setFilters(draftFilters)
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await downloadAuditEvents(filters)
      toast.success('Audit CSV downloaded.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not export the audit trail.'))
    } finally {
      setExporting(false)
    }
  }

  const columns = [
    {
      key: 'created_at',
      header: 'Time',
      render: (row) => <time dateTime={row.created_at}>{formatDateTime(row.created_at)}</time>,
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) => (
        <span className="audit-actor">
          <strong>{row.actor_name}</strong>
          <small>{row.actor_email || 'No authenticated account'}</small>
        </span>
      ),
    },
    {
      key: 'event',
      header: 'Event',
      render: (row) => (
        <span className="audit-event-copy">
          <strong>{row.action_label}</strong>
          <small>{row.description}</small>
        </span>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      render: (row) => (
        <span className="audit-target">
          {formatTarget(row.target_type)}
          {row.target_id ? <small>#{row.target_id}</small> : null}
        </span>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      render: (row) => <span className={`audit-outcome is-${row.outcome.toLowerCase()}`}>{row.outcome_label}</span>,
    },
  ]

  return (
    <section className="admin-audit-page">
      <header className="admin-audit-header">
        <div>
          <p className="admin-overview-eyebrow">Security and accountability</p>
          <h1>System audit trail</h1>
          <p>Review important account, moderation, booking, payment, and security events across Isomo.</p>
        </div>
        <div className="admin-audit-actions">
          <button className="secondary-button" type="button" onClick={() => window.print()}>
            <DashboardIcon name="reports" size={18} /> Print
          </button>
          <button className="primary-button" type="button" onClick={handleExport} disabled={exporting}>
            <DashboardIcon name="audit" size={18} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </header>

      <form className="admin-audit-filters" onSubmit={applyFilters}>
        <label className="admin-audit-search">
          <span>Search</span>
          <input
            type="search"
            placeholder="Actor, event, target, or description"
            value={draftFilters.search}
            onChange={(event) => updateDraft('search', event.target.value)}
          />
        </label>
        <label>
          <span>Action</span>
          <select value={draftFilters.action} onChange={(event) => updateDraft('action', event.target.value)}>
            <option value="">All actions</option>
            {ACTION_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>Outcome</span>
          <select value={draftFilters.outcome} onChange={(event) => updateDraft('outcome', event.target.value)}>
            <option value="">All outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="DENIED">Denied</option>
            <option value="FAILURE">Failure</option>
          </select>
        </label>
        <label>
          <span>Target type</span>
          <input
            type="text"
            placeholder="e.g. booking"
            value={draftFilters.target_type}
            onChange={(event) => updateDraft('target_type', event.target.value)}
          />
        </label>
        <label>
          <span>From</span>
          <input type="date" value={draftFilters.date_from} onChange={(event) => updateDraft('date_from', event.target.value)} />
        </label>
        <label>
          <span>To</span>
          <input type="date" value={draftFilters.date_to} onChange={(event) => updateDraft('date_to', event.target.value)} />
        </label>
        <div className="admin-audit-filter-actions">
          <button className="primary-button" type="submit">Apply filters</button>
          <button className="secondary-button" type="button" onClick={clearFilters}>Clear</button>
        </div>
      </form>

      <section className="admin-audit-results" aria-busy={eventsQuery.isLoading}>
        <header>
          <div>
            <p>Recorded events</p>
            <h2>{eventsQuery.isLoading ? 'Loading audit trail...' : `${auditPage.count} event${auditPage.count === 1 ? '' : 's'}`}</h2>
          </div>
          <span>Newest activity first</span>
        </header>

        {eventsQuery.isLoading ? (
          <SkeletonLoader rows={6} className="admin-audit-skeleton" />
        ) : eventsQuery.isError ? (
          <ErrorState
            className="admin-overview-error"
            title="The audit trail could not be loaded."
            message={getApiErrorMessage(eventsQuery.error)}
            onRetry={eventsQuery.refetch}
          />
        ) : events.length ? (
          <DataTable columns={columns} rows={events} caption="System audit events" className="admin-audit-table" />
        ) : (
          <EmptyState
            className="admin-panel-empty"
            icon={<DashboardIcon name="audit" size={28} />}
            title="No matching audit events"
            description="Try clearing one or more filters to broaden the activity shown."
          />
        )}

        {auditPage.count > PAGE_SIZE ? (
          <nav className="admin-audit-pagination" aria-label="Audit trail pages">
            <button type="button" disabled={!auditPage.previous} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={!auditPage.next} onClick={() => setPage((current) => current + 1)}>Next</button>
          </nav>
        ) : null}
      </section>
    </section>
  )
}
