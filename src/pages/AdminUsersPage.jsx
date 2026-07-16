import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { changeAdminUserStatus, getAdminUser, listAdminUsers } from '../api/services/adminUsers.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import './AdminUsersPage.css'


const PAGE_SIZE = 20
const EMPTY_FILTERS = {
  search: '',
  role: '',
  account_status: '',
  verification_status: '',
  registered_from: '',
  registered_to: '',
}

const ACTION_CONFIG = {
  ACTIVATE: {
    label: 'Activate account',
    verb: 'activate',
    description: 'Re-enable an administratively deactivated account and restore sign-in access.',
    className: 'is-positive',
  },
  DEACTIVATE: {
    label: 'Deactivate account',
    verb: 'deactivate',
    description: 'Pause account access without deleting the user or their learning history. This can be reversed with Activate.',
    className: 'is-warning',
  },
  SUSPEND: {
    label: 'Suspend account',
    verb: 'suspend',
    description: 'Restrict sign-in because of a trust, safety, or policy concern. Restoration requires a separate reviewed action.',
    className: 'is-danger',
  },
  RESTORE: {
    label: 'Restore account',
    verb: 'restore',
    description: 'End a suspension after review and restore sign-in access.',
    className: 'is-positive',
  },
}

function formatDate(value, includeTime = false) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat('en-RW', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date)
}

function formatLabel(value) {
  return String(value || 'Unknown').toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function availableActions(user) {
  if (!user?.can_manage) return []
  if (user.account_status === 'DEACTIVATED') return ['ACTIVATE']
  if (user.account_status === 'SUSPENDED') return ['RESTORE']
  return ['DEACTIVATE', 'SUSPEND']
}

function profileRows(user) {
  const data = user?.profile?.data || {}
  const preferredFields = [
    'full_name',
    'phone_number',
    'location',
    'level',
    'school_name',
    'headline',
    'education_level',
    'hourly_rate',
    'currency',
  ]
  return preferredFields
    .filter((field) => data[field] !== null && data[field] !== undefined && data[field] !== '')
    .map((field) => ({ label: formatLabel(field), value: String(data[field]) }))
}

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [pendingAction, setPendingAction] = useState('')
  const [reason, setReason] = useState('')
  const queryParams = { ...filters, page, page_size: PAGE_SIZE }

  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users(queryParams),
    queryFn: () => listAdminUsers(queryParams).then((response) => response.data),
    staleTime: 15_000,
  })
  const userQuery = useQuery({
    queryKey: queryKeys.admin.user(selectedUserId),
    queryFn: () => getAdminUser(selectedUserId).then((response) => response.data),
    enabled: Boolean(selectedUserId),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, action, actionReason }) => changeAdminUserStatus(id, { action, reason: actionReason }),
    onSuccess: async (_, variables) => {
      toast.success(`${ACTION_CONFIG[variables.action].label} completed.`)
      closeDialog()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'audit-events'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'The account could not be updated.')),
  })

  const userPage = usersQuery.data || { count: 0, next: null, previous: null, results: [] }
  const users = userPage.results
  const selectedUser = userQuery.data
  const totalPages = Math.max(1, Math.ceil(userPage.count / PAGE_SIZE))
  const actionConfig = ACTION_CONFIG[pendingAction]

  function updateDraft(field, value) {
    setDraftFilters((current) => ({ ...current, [field]: value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setFilters(draftFilters)
    setPage(1)
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  function openUser(userId) {
    setPendingAction('')
    setReason('')
    setSelectedUserId(userId)
  }

  function closeDialog() {
    if (statusMutation.isPending) return
    setSelectedUserId(null)
    setPendingAction('')
    setReason('')
  }

  function chooseAction(action) {
    setPendingAction(action)
    setReason('')
  }

  function submitAction(event) {
    event.preventDefault()
    if (!pendingAction || reason.trim().length < 10) {
      toast.error('Provide a clear reason of at least 10 characters.')
      return
    }
    statusMutation.mutate({
      id: selectedUser.id,
      action: pendingAction,
      actionReason: reason.trim(),
    })
  }

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <span className="admin-user-identity">
          <strong>{row.full_name}</strong>
          <small>{row.email}</small>
        </span>
      ),
    },
    { key: 'role', header: 'Role', render: (row) => <span className="admin-user-role">{formatLabel(row.role)}</span> },
    {
      key: 'status',
      header: 'Account status',
      render: (row) => <span className={`admin-user-status is-${row.account_status.toLowerCase()}`}>{formatLabel(row.account_status)}</span>,
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (row) => row.role === 'TUTOR' ? formatLabel(row.verification_status) : <span className="admin-user-muted">Not applicable</span>,
    },
    { key: 'joined', header: 'Registered', render: (row) => <time dateTime={row.date_joined}>{formatDate(row.date_joined)}</time> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => <button className="admin-user-manage" type="button" onClick={() => openUser(row.id)}>View and manage</button>,
    },
  ]

  return (
    <section className="admin-users-page">
      <header className="admin-users-header">
        <div>
          <p className="admin-overview-eyebrow">Administration</p>
          <h1>User management</h1>
          <p>Find platform members, review their account details, and control access without deleting learning or audit history.</p>
        </div>
        <div className="admin-users-summary">
          <strong>{userPage.count}</strong>
          <span>Matching accounts</span>
        </div>
      </header>

      <aside className="admin-users-policy" aria-label="Account action definitions">
        <DashboardIcon name="verification" size={22} />
        <p><strong>Deactivation is reversible administration.</strong> Suspension is a trust or policy restriction. Deletion is not available from this workspace, so historical bookings, learning records, and audits remain intact.</p>
      </aside>

      <form className="admin-users-filters" onSubmit={applyFilters}>
        <label className="admin-users-search">
          <span>Search</span>
          <input type="search" placeholder="Name, email, or username" value={draftFilters.search} onChange={(event) => updateDraft('search', event.target.value)} />
        </label>
        <label>
          <span>Role</span>
          <select value={draftFilters.role} onChange={(event) => updateDraft('role', event.target.value)}>
            <option value="">All roles</option>
            <option value="STUDENT">Students</option>
            <option value="TUTOR">Tutors</option>
            <option value="PARENT">Parents</option>
            <option value="ADMIN">Administrators</option>
          </select>
        </label>
        <label>
          <span>Account status</span>
          <select value={draftFilters.account_status} onChange={(event) => updateDraft('account_status', event.target.value)}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DEACTIVATED">Deactivated</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </label>
        <label>
          <span>Tutor verification</span>
          <select value={draftFilters.verification_status} onChange={(event) => updateDraft('verification_status', event.target.value)}>
            <option value="">All verification states</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="NOT_APPLICABLE">Not applicable</option>
          </select>
        </label>
        <label>
          <span>Registered from</span>
          <input type="date" value={draftFilters.registered_from} onChange={(event) => updateDraft('registered_from', event.target.value)} />
        </label>
        <label>
          <span>Registered to</span>
          <input type="date" value={draftFilters.registered_to} onChange={(event) => updateDraft('registered_to', event.target.value)} />
        </label>
        <div className="admin-users-filter-actions">
          <button className="primary-button" type="submit">Apply filters</button>
          <button className="secondary-button" type="button" onClick={clearFilters}>Clear</button>
        </div>
      </form>

      <section className="admin-users-results" aria-busy={usersQuery.isLoading}>
        <header><div><p>Account directory</p><h2>{usersQuery.isLoading ? 'Loading users...' : `${userPage.count} user${userPage.count === 1 ? '' : 's'}`}</h2></div><span>Newest registrations first</span></header>
        {usersQuery.isLoading ? (
          <SkeletonLoader rows={6} className="admin-users-skeleton" />
        ) : usersQuery.isError ? (
          <ErrorState className="admin-overview-error" title="Users could not be loaded." message={getApiErrorMessage(usersQuery.error)} onRetry={usersQuery.refetch} />
        ) : users.length ? (
          <DataTable columns={columns} rows={users} caption="Platform user accounts" className="admin-users-table" />
        ) : (
          <EmptyState className="admin-panel-empty" icon={<DashboardIcon name="students" size={28} />} title="No matching users" description="Clear one or more filters to broaden the directory." />
        )}

        {userPage.count > PAGE_SIZE ? (
          <nav className="admin-users-pagination" aria-label="User directory pages">
            <button type="button" disabled={!userPage.previous} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={!userPage.next} onClick={() => setPage((current) => current + 1)}>Next</button>
          </nav>
        ) : null}
      </section>

      <ConfirmationDialog open={Boolean(selectedUserId)} onClose={closeDialog} labelledBy="admin-user-dialog-title" describedBy="admin-user-dialog-description" dialogClassName="admin-user-dialog">
        <header className="admin-user-dialog-header">
          <div><span>User account</span><h2 id="admin-user-dialog-title">{selectedUser?.full_name || 'Loading account...'}</h2></div>
          <button type="button" onClick={closeDialog} disabled={statusMutation.isPending} aria-label="Close user details">Close</button>
        </header>

        {userQuery.isLoading ? (
          <SkeletonLoader rows={5} className="admin-users-skeleton" />
        ) : userQuery.isError ? (
          <ErrorState className="admin-overview-error" title="Account details could not be loaded." message={getApiErrorMessage(userQuery.error)} onRetry={userQuery.refetch} />
        ) : selectedUser ? (
          <>
            <p id="admin-user-dialog-description" className="admin-user-dialog-email">{selectedUser.email}</p>
            <div className="admin-user-detail-grid">
              <div><span>Role</span><strong>{formatLabel(selectedUser.role)}</strong></div>
              <div><span>Status</span><strong>{formatLabel(selectedUser.account_status)}</strong></div>
              <div><span>Registered</span><strong>{formatDate(selectedUser.date_joined)}</strong></div>
              <div><span>Last sign-in</span><strong>{formatDate(selectedUser.last_login, true)}</strong></div>
              <div><span>Verification</span><strong>{formatLabel(selectedUser.verification_status)}</strong></div>
              <div><span>Username</span><strong>{selectedUser.username}</strong></div>
            </div>

            {profileRows(selectedUser).length ? (
              <section className="admin-user-profile-summary"><h3>Profile details</h3><dl>{profileRows(selectedUser).map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></section>
            ) : null}

            {selectedUser.account_status_reason ? (
              <section className="admin-user-status-history"><h3>Latest status reason</h3><p>{selectedUser.account_status_reason}</p><small>Changed {formatDate(selectedUser.account_status_changed_at, true)} by {selectedUser.status_changed_by_email || 'System'}</small></section>
            ) : null}

            {!selectedUser.can_manage ? (
              <p className="admin-user-protected"><DashboardIcon name="verification" size={18} /> {selectedUser.protected_reason}</p>
            ) : pendingAction ? (
              <form className="admin-user-action-form" onSubmit={submitAction}>
                <button className="admin-user-action-back" type="button" onClick={() => setPendingAction('')} disabled={statusMutation.isPending}>Back to account details</button>
                <h3>{actionConfig.label}</h3>
                <p>{actionConfig.description}</p>
                <label><span>Required reason</span><textarea rows="4" maxLength="500" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this access change is necessary." /></label>
                <small>{reason.trim().length}/10 minimum characters</small>
                <div><button className="secondary-button" type="button" onClick={() => setPendingAction('')} disabled={statusMutation.isPending}>Cancel</button><button className={`admin-user-confirm ${actionConfig.className}`} type="submit" disabled={statusMutation.isPending || reason.trim().length < 10}>{statusMutation.isPending ? 'Updating...' : actionConfig.label}</button></div>
              </form>
            ) : (
              <section className="admin-user-actions"><h3>Account access</h3><p>Choose an action. This workspace never permanently deletes users.</p><div>{availableActions(selectedUser).map((action) => <button className={ACTION_CONFIG[action].className} type="button" key={action} onClick={() => chooseAction(action)}>{ACTION_CONFIG[action].label}</button>)}</div></section>
            )}
          </>
        ) : null}
      </ConfirmationDialog>
    </section>
  )
}
