import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors.js'
import { queryKeys } from '../api/queryKeys.js'
import {
  decidePayout,
  getAdminPayoutSummary,
  getPayoutHistory,
  listAdminPayouts,
} from '../api/services/payments.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import './AdminPayoutsPage.css'

const PAGE_SIZE = 20
const EMPTY_FILTERS = { status: 'REQUESTED', search: '', ordering: 'newest' }
const STATUS_TABS = [
  ['REQUESTED', 'Requested'],
  ['APPROVED', 'Approved'],
  ['PAID', 'Paid'],
  ['REJECTED', 'Rejected'],
  ['', 'All payouts'],
]
const ACTIONS = {
  APPROVED: {
    label: 'Approve request',
    description: 'Confirm that this withdrawal is valid and reserve it for payment processing.',
    className: 'is-positive',
  },
  PAID: {
    label: 'Mark as paid',
    description: 'Confirm that the approved amount has been sent to the tutor. This action is final.',
    className: 'is-positive',
  },
  REJECTED: {
    label: 'Reject request',
    description: 'Release the reserved balance and explain clearly why the request cannot be processed.',
    className: 'is-danger',
  },
}

function formatMoney(value) {
  return `${new Intl.NumberFormat('en-RW', { maximumFractionDigits: 2 }).format(Number(value || 0))} RWF`
}

function formatDate(value, includeTime = false) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat(
    'en-RW',
    includeTime
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium' },
  ).format(date)
}

function formatStatus(value) {
  return String(value || 'Unknown')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function PayoutStatus({ status }) {
  return (
    <span className={`admin-payout-status is-${String(status).toLowerCase()}`}>
      {formatStatus(status)}
    </span>
  )
}

function validActions(status) {
  if (status === 'REQUESTED') return ['APPROVED', 'REJECTED']
  if (status === 'APPROVED') return ['PAID', 'REJECTED']
  return []
}

export function AdminPayoutsPage() {
  const queryClient = useQueryClient()
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')
  const params = { ...filters, page, page_size: PAGE_SIZE }

  const payoutsQuery = useQuery({
    queryKey: queryKeys.admin.payouts(params),
    queryFn: () => listAdminPayouts(params).then((response) => response.data),
    staleTime: 15_000,
  })
  const summaryQuery = useQuery({
    queryKey: queryKeys.admin.payoutSummary,
    queryFn: () => getAdminPayoutSummary().then((response) => response.data),
    staleTime: 15_000,
  })
  const historyQuery = useQuery({
    queryKey: queryKeys.admin.payoutHistory(selectedPayout?.id),
    queryFn: () => getPayoutHistory(selectedPayout.id).then((response) => response.data),
    enabled: Boolean(selectedPayout),
  })
  const decisionMutation = useMutation({
    mutationFn: ({ id, status, decisionReason }) => (
      decidePayout(id, { status, reason: decisionReason })
    ),
    onSuccess: async (_, variables) => {
      toast.success(`${ACTIONS[variables.status].label} completed.`)
      setSelectedPayout(null)
      setAction('')
      setReason('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] }),
        queryClient.invalidateQueries({ queryKey: ['payments', 'tutor-payouts'] }),
        queryClient.invalidateQueries({ queryKey: ['payments', 'tutor-earnings'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ])
    },
    onError: (error) => toast.error(
      getApiErrorMessage(error, 'The payout decision could not be saved.'),
    ),
  })

  const payoutPage = payoutsQuery.data || {
    count: 0,
    next: null,
    previous: null,
    results: [],
  }
  const payouts = Array.isArray(payoutPage.results) ? payoutPage.results : []
  const summary = summaryQuery.data || { statuses: {} }
  const history = Array.isArray(historyQuery.data)
    ? historyQuery.data
    : selectedPayout?.decisions || []
  const totalPages = Math.max(1, Math.ceil(Number(payoutPage.count || 0) / PAGE_SIZE))
  const actionConfig = ACTIONS[action]

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
    setDraftFilters({ ...EMPTY_FILTERS, status: '' })
    setFilters({ ...EMPTY_FILTERS, status: '' })
    setPage(1)
  }

  function openPayout(payout) {
    setSelectedPayout(payout)
    setAction('')
    setReason('')
  }

  function closeDialog() {
    if (decisionMutation.isPending) return
    setSelectedPayout(null)
    setAction('')
    setReason('')
  }

  function submitDecision(event) {
    event.preventDefault()
    const cleanReason = reason.trim()
    if (action === 'REJECTED' && cleanReason.length < 10) {
      toast.error('Provide a clear rejection reason of at least 10 characters.')
      return
    }
    decisionMutation.mutate({
      id: selectedPayout.id,
      status: action,
      decisionReason: cleanReason,
    })
  }

  const columns = [
    {
      key: 'tutor',
      header: 'Tutor',
      render: (row) => (
        <span className="admin-payout-person">
          <strong>{row.tutor_name || `Tutor #${row.tutor}`}</strong>
          <small>Account #{row.tutor}</small>
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => <strong className="admin-payout-amount">{formatMoney(row.amount)}</strong>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <PayoutStatus status={row.status} />,
    },
    {
      key: 'requested',
      header: 'Requested',
      render: (row) => <time dateTime={row.created_at}>{formatDate(row.created_at)}</time>,
    },
    {
      key: 'lastDecision',
      header: 'Latest decision',
      render: (row) => (
        <span className="admin-payout-decision">
          <strong>{row.decisions?.[0]?.admin_name || 'Not reviewed'}</strong>
          <small>{row.decisions?.[0] ? formatDate(row.decisions[0].created_at) : 'Awaiting action'}</small>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <button className="admin-payout-open" type="button" onClick={() => openPayout(row)}>
          Review payout
        </button>
      ),
    },
  ]

  return (
    <section className="admin-payout-page">
      <header className="admin-payout-header">
        <div>
          <p className="admin-overview-eyebrow">Administration</p>
          <h1>Tutor payouts</h1>
          <p>Process withdrawal requests in order, preserve every decision, and keep tutor balances protected from duplicate payouts.</p>
        </div>
        <div className="admin-payout-header-summary">
          <strong>{summary.active_count || 0}</strong>
          <span>Active requests</span>
          <small>{formatMoney(summary.active_amount)}</small>
        </div>
      </header>

      <aside className="admin-payout-policy">
        <DashboardIcon name="verification" size={22} />
        <p><strong>Review before changing status.</strong> Approve only valid requested payouts, mark only transferred funds as paid, and include a clear reason whenever rejecting a tutor&apos;s request.</p>
      </aside>

      <section className="admin-payout-metrics" aria-label="Payout totals">
        {['REQUESTED', 'APPROVED', 'PAID', 'REJECTED'].map((status) => (
          <article key={status}>
            <span>{formatStatus(status)}</span>
            <strong>{summary.statuses?.[status]?.count || 0}</strong>
            <small>{formatMoney(summary.statuses?.[status]?.amount)}</small>
          </article>
        ))}
      </section>

      <nav className="admin-payout-tabs" aria-label="Payout status">
        {STATUS_TABS.map(([value, label]) => (
          <button
            className={filters.status === value ? 'is-active' : ''}
            type="button"
            key={value || 'all'}
            onClick={() => selectStatus(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      <form className="admin-payout-filters" onSubmit={applyFilters}>
        <label>
          <span>Search tutor</span>
          <input
            type="search"
            value={draftFilters.search}
            onChange={(event) => setDraftFilters((current) => ({
              ...current,
              search: event.target.value,
            }))}
            placeholder="Name, email, or username"
          />
        </label>
        <label>
          <span>Order</span>
          <select
            value={draftFilters.ordering}
            onChange={(event) => setDraftFilters((current) => ({
              ...current,
              ordering: event.target.value,
            }))}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount_high">Highest amount</option>
            <option value="amount_low">Lowest amount</option>
          </select>
        </label>
        <div>
          <button className="primary-button" type="submit">Apply filters</button>
          <button className="secondary-button" type="button" onClick={clearFilters}>Clear</button>
        </div>
      </form>

      <section className="admin-payout-results" aria-busy={payoutsQuery.isLoading}>
        <header>
          <div><p>Operations queue</p><h2>{payoutPage.count || 0} matching payouts</h2></div>
          <span>Requested funds remain reserved during review.</span>
        </header>
        {payoutsQuery.isLoading ? (
          <SkeletonLoader rows={6} className="admin-payout-skeleton" />
        ) : payoutsQuery.isError ? (
          <ErrorState
            className="admin-payout-error"
            title="Payout requests could not be loaded."
            message={getApiErrorMessage(payoutsQuery.error)}
            onRetry={() => payoutsQuery.refetch()}
          />
        ) : payouts.length ? (
          <DataTable
            columns={columns}
            rows={payouts}
            caption="Tutor payout operations queue"
            className="admin-payout-table"
          />
        ) : (
          <EmptyState
            className="admin-payout-empty"
            icon={<DashboardIcon name="earnings" size={28} />}
            title="No matching payouts"
            description="This queue is clear. Choose another status or clear the filters."
          />
        )}
        {Number(payoutPage.count || 0) > PAGE_SIZE ? (
          <nav className="admin-payout-pagination" aria-label="Payout pages">
            <button type="button" disabled={!payoutPage.previous} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={!payoutPage.next} onClick={() => setPage((current) => current + 1)}>Next</button>
          </nav>
        ) : null}
      </section>

      <ConfirmationDialog
        open={Boolean(selectedPayout)}
        onClose={closeDialog}
        labelledBy="admin-payout-dialog-title"
        describedBy="admin-payout-dialog-description"
        dialogClassName="admin-payout-dialog"
      >
        <header>
          <div><span>Payout request #{selectedPayout?.id}</span><h2 id="admin-payout-dialog-title">{selectedPayout?.tutor_name || 'Tutor payout'}</h2></div>
          <button type="button" onClick={closeDialog} disabled={decisionMutation.isPending}>Close</button>
        </header>
        {selectedPayout ? (
          <>
            <div className="admin-payout-detail-grid" id="admin-payout-dialog-description">
              <div><span>Requested amount</span><strong>{formatMoney(selectedPayout.amount)}</strong></div>
              <div><span>Current status</span><PayoutStatus status={selectedPayout.status} /></div>
              <div><span>Requested</span><strong>{formatDate(selectedPayout.created_at, true)}</strong></div>
              <div><span>Tutor account</span><strong>#{selectedPayout.tutor}</strong></div>
              <div><span>Paid date</span><strong>{selectedPayout.paid_at ? formatDate(selectedPayout.paid_at, true) : 'Not paid'}</strong></div>
              <div><span>Decision records</span><strong>{history.length}</strong></div>
            </div>

            <section className="admin-payout-history">
              <h3>Decision history</h3>
              {historyQuery.isLoading ? (
                <SkeletonLoader rows={2} className="admin-payout-skeleton" />
              ) : historyQuery.isError ? (
                <ErrorState
                  className="admin-payout-error"
                  title="Decision history could not be loaded."
                  message={getApiErrorMessage(historyQuery.error)}
                  onRetry={() => historyQuery.refetch()}
                />
              ) : history.length ? history.map((decision) => (
                <article key={decision.id}>
                  <span>{formatStatus(decision.status)}</span>
                  <div>
                    <p>{decision.reason || 'No additional note was recorded.'}</p>
                    <small>{decision.admin_name} / {formatDate(decision.created_at, true)}</small>
                  </div>
                </article>
              )) : <p>No decision has been recorded yet.</p>}
            </section>

            {action ? (
              <form className="admin-payout-decision-form" onSubmit={submitDecision}>
                <button type="button" onClick={() => setAction('')} disabled={decisionMutation.isPending}>Back to decisions</button>
                <h3>{actionConfig.label}</h3>
                <p>{actionConfig.description}</p>
                <label>
                  <span>{action === 'REJECTED' ? 'Required rejection reason' : 'Decision note (optional)'}</span>
                  <textarea
                    rows="4"
                    maxLength="1000"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={action === 'REJECTED' ? 'Explain why this payout cannot be processed.' : 'Record any useful processing note.'}
                  />
                </label>
                {action === 'REJECTED' ? <small>{reason.trim().length}/10 minimum characters</small> : null}
                <div>
                  <button className="secondary-button" type="button" onClick={() => setAction('')} disabled={decisionMutation.isPending}>Cancel</button>
                  <button
                    className={`admin-payout-confirm ${actionConfig.className}`}
                    type="submit"
                    disabled={decisionMutation.isPending || (action === 'REJECTED' && reason.trim().length < 10)}
                  >
                    {decisionMutation.isPending ? 'Saving...' : actionConfig.label}
                  </button>
                </div>
              </form>
            ) : validActions(selectedPayout.status).length ? (
              <section className="admin-payout-actions">
                <h3>Available decisions</h3>
                <p>Only actions valid for the current payout status are available.</p>
                <div>
                  {validActions(selectedPayout.status).map((nextAction) => (
                    <button
                      className={ACTIONS[nextAction].className}
                      type="button"
                      key={nextAction}
                      onClick={() => {
                        setAction(nextAction)
                        setReason('')
                      }}
                    >
                      {ACTIONS[nextAction].label}
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <section className="admin-payout-terminal">
                <DashboardIcon name="verification" />
                <p>This payout is {selectedPayout.status.toLowerCase()} and cannot be changed.</p>
              </section>
            )}
          </>
        ) : null}
      </ConfirmationDialog>
    </section>
  )
}
