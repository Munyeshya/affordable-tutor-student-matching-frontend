import React, { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link, useSearchParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors.js'
import { queryKeys } from '../api/queryKeys.js'
import { updateScheduleProposal } from '../api/services/bookings.js'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { InlineIcon } from '../components/ui/InlineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useScheduleProposalsQuery } from '../hooks/useCommonQueries.js'
import './ScheduleProposalsPage.css'

const STATUS_FILTERS = ['ALL', 'PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'CANCELLED']

const STATUS_COPY = {
  PENDING: 'Waiting for a response',
  COUNTERED: 'A revised schedule needs review',
  ACCEPTED: 'Lessons are confirmed',
  REJECTED: 'Proposal was declined',
  CANCELLED: 'Proposal was cancelled',
  EXPIRED: 'Proposal expired',
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function toDateTimeInput(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-RW', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMoney(value, currency = 'RWF') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'To be confirmed'
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)} ${currency}`
}

function getOtherParty(proposal, role) {
  return role === 'TUTOR' ? proposal.requester_name : proposal.tutor_name
}

function ProposalTimeline({ proposal }) {
  return (
    <div className="schedule-proposal-timeline">
      {proposal.revisions.map((revision) => (
        <article key={revision.id}>
          <span>{revision.revision_number}</span>
          <div>
            <strong>{revision.proposed_by_name} proposed revision {revision.revision_number}</strong>
            <small>{formatDateTime(revision.created_at)}</small>
            {revision.message ? <p>{revision.message}</p> : null}
          </div>
        </article>
      ))}
    </div>
  )
}

function ProposalCard({ proposal, user, onAction, onCounter, busy, highlighted }) {
  const revision = proposal.current_revision
  const open = ['PENDING', 'COUNTERED'].includes(proposal.status)
  const canRespond = proposal.can_respond && ['STUDENT', 'PARENT', 'TUTOR'].includes(user?.role)
  const canCancel = open && String(proposal.requested_by) === String(user?.id)

  return (
    <article
      className={`schedule-proposal-card${highlighted ? ' is-highlighted' : ''}`}
      id={`proposal-${proposal.id}`}
    >
      <header>
        <div>
          <p className="eyebrow">Proposal #{proposal.id} / Revision {proposal.current_revision_number}</p>
          <h2>{proposal.subject_name} with {getOtherParty(proposal, user?.role)}</h2>
          {user?.role === 'PARENT' ? <p>For {proposal.student_name}</p> : null}
        </div>
        <span className={`schedule-proposal-status is-${proposal.status.toLowerCase()}`}>
          {proposal.status}
        </span>
      </header>

      <p className="schedule-proposal-status-copy">{STATUS_COPY[proposal.status] || 'Schedule updated'}</p>

      <dl className="schedule-proposal-facts">
        <div><dt>Lessons</dt><dd>{revision.sessions.length}</dd></div>
        <div><dt>Mode</dt><dd>{revision.mode === 'IN_PERSON' ? 'In person' : 'Online'}</dd></div>
        <div><dt>Timezone</dt><dd>{revision.timezone}</dd></div>
        <div><dt>Estimated total</dt><dd>{formatMoney(revision.estimated_total, revision.currency)}</dd></div>
      </dl>

      {revision.location ? <p className="schedule-proposal-location"><strong>Location:</strong> {revision.location}</p> : null}
      {revision.message ? <blockquote>{revision.message}</blockquote> : null}

      <details className="schedule-proposal-sessions">
        <summary>View all {revision.sessions.length} proposed lesson times</summary>
        <ol>
          {revision.sessions.map((session) => (
            <li key={session.id}>
              <InlineIcon name="calendar" />
              <span>{formatDateTime(session.start_datetime)}</span>
              {session.booking_id ? <Link to="/bookings">Booking #{session.booking_id}</Link> : null}
            </li>
          ))}
        </ol>
      </details>

      <details className="schedule-proposal-history">
        <summary>Negotiation history</summary>
        <ProposalTimeline proposal={proposal} />
      </details>

      <footer>
        {canRespond ? (
          <>
            <button className="primary-button" type="button" disabled={busy} onClick={() => onAction(proposal, 'ACCEPT')}>Accept schedule</button>
            <button className="secondary-button" type="button" disabled={busy} onClick={() => onCounter(proposal)}>Counter-offer</button>
            <button className="schedule-proposal-danger" type="button" disabled={busy} onClick={() => onAction(proposal, 'REJECT')}>Reject</button>
          </>
        ) : null}
        {canCancel ? <button className="schedule-proposal-danger" type="button" disabled={busy} onClick={() => onAction(proposal, 'CANCEL')}>Cancel proposal</button> : null}
        {proposal.status === 'ACCEPTED' ? <Link className="secondary-button" to="/bookings">View confirmed lessons</Link> : null}
      </footer>
    </article>
  )
}

function ActionDialog({ pendingAction, message, setMessage, onClose, onConfirm, busy }) {
  if (!pendingAction) return null
  const requiresMessage = ['REJECT', 'CANCEL'].includes(pendingAction.action)
  const titles = {
    ACCEPT: 'Accept this complete schedule?',
    REJECT: 'Reject this schedule proposal?',
    CANCEL: 'Cancel your schedule proposal?',
  }

  return (
    <ConfirmationDialog open onClose={onClose} labelledBy="schedule-action-title" backdropClassName="booking-dialog-backdrop" dialogClassName="booking-action-dialog">
      <p className="eyebrow">Proposal #{pendingAction.proposal.id}</p>
      <h2 id="schedule-action-title">{titles[pendingAction.action]}</h2>
      <p>
        {pendingAction.action === 'ACCEPT'
          ? 'Every proposed lesson will be checked again. Existing booked times can never be overridden.'
          : 'The other party will receive your reason as an unread notification.'}
      </p>
      <label className="booking-field">
        <span>{requiresMessage ? 'Reason' : 'Message'} {!requiresMessage ? <small>Optional</small> : null}</span>
        <textarea rows="3" value={message} onChange={(event) => setMessage(event.target.value)} />
      </label>
      <div className="booking-review-actions">
        <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Go back</button>
        <button className={pendingAction.action === 'ACCEPT' ? 'primary-button' : 'schedule-proposal-danger'} type="button" onClick={onConfirm} disabled={busy || (requiresMessage && !message.trim())}>
          {busy ? 'Updating...' : pendingAction.action === 'ACCEPT' ? 'Accept schedule' : pendingAction.action === 'REJECT' ? 'Reject proposal' : 'Cancel proposal'}
        </button>
      </div>
    </ConfirmationDialog>
  )
}

function CounterDialog({ counter, setCounter, onClose, onSubmit, busy }) {
  if (!counter) return null

  function updateSession(index, field, value) {
    setCounter((current) => ({
      ...current,
      sessions: current.sessions.map((session, sessionIndex) => (
        sessionIndex === index ? { ...session, [field]: value } : session
      )),
    }))
  }

  function addSession() {
    const last = counter.sessions.at(-1)
    const start = new Date(last.start_datetime)
    start.setDate(start.getDate() + 7)
    const end = new Date(last.end_datetime)
    end.setDate(end.getDate() + 7)
    setCounter((current) => ({
      ...current,
      sessions: [
        ...current.sessions,
        { start_datetime: toDateTimeInput(start), end_datetime: toDateTimeInput(end) },
      ],
    }))
  }

  return (
    <ConfirmationDialog open onClose={onClose} labelledBy="counter-title" backdropClassName="booking-dialog-backdrop" dialogClassName="schedule-counter-dialog">
      <p className="eyebrow">Proposal #{counter.proposal.id}</p>
      <h2 id="counter-title">Send a revised schedule.</h2>
      <p>Change only what is needed. The complete revised schedule will replace the current offer for review.</p>
      <div className="booking-field-grid">
        <label className="booking-field">
          <span>Mode</span>
          <select value={counter.mode} onChange={(event) => setCounter((current) => ({ ...current, mode: event.target.value }))}>
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">In person</option>
          </select>
        </label>
        <label className="booking-field">
          <span>Timezone</span>
          <input value={counter.timezone} onChange={(event) => setCounter((current) => ({ ...current, timezone: event.target.value }))} />
        </label>
      </div>
      {counter.mode === 'IN_PERSON' ? (
        <label className="booking-field">
          <span>Location</span>
          <input value={counter.location} onChange={(event) => setCounter((current) => ({ ...current, location: event.target.value }))} />
        </label>
      ) : null}
      <div className="schedule-counter-sessions">
        {counter.sessions.map((session, index) => (
          <div key={`${index}-${session.start_datetime}`}>
            <label className="booking-field">
              <span>Starts</span>
              <input type="datetime-local" value={session.start_datetime} onChange={(event) => updateSession(index, 'start_datetime', event.target.value)} />
            </label>
            <label className="booking-field">
              <span>Ends</span>
              <input type="datetime-local" value={session.end_datetime} onChange={(event) => updateSession(index, 'end_datetime', event.target.value)} />
            </label>
            <button type="button" disabled={counter.sessions.length === 1} onClick={() => setCounter((current) => ({ ...current, sessions: current.sessions.filter((_, itemIndex) => itemIndex !== index) }))} aria-label={`Remove lesson ${index + 1}`}>
              <InlineIcon name="trash" />
            </button>
          </div>
        ))}
        <button className="secondary-button" type="button" onClick={addSession}>Add lesson date</button>
      </div>
      <label className="booking-field">
        <span>Explain the changes</span>
        <textarea rows="3" value={counter.message} onChange={(event) => setCounter((current) => ({ ...current, message: event.target.value }))} />
      </label>
      <label className="booking-field">
        <span>Learning notes <small>Optional</small></span>
        <textarea rows="3" value={counter.notes} onChange={(event) => setCounter((current) => ({ ...current, notes: event.target.value }))} />
      </label>
      <div className="booking-review-actions">
        <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Go back</button>
        <button className="primary-button" type="button" onClick={onSubmit} disabled={busy || !counter.message.trim()}>
          {busy ? 'Sending...' : 'Send counter-offer'}
        </button>
      </div>
    </ConfirmationDialog>
  )
}

export function ScheduleProposalsPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const proposalsQuery = useScheduleProposalsQuery()
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [pendingAction, setPendingAction] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [counter, setCounter] = useState(null)
  const highlightedId = searchParams.get('proposal')

  useEffect(() => {
    if (!highlightedId || proposalsQuery.isLoading) return
    document.getElementById(`proposal-${highlightedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightedId, proposalsQuery.isLoading])

  const actionMutation = useMutation({
    mutationFn: ({ proposalId, payload }) => updateScheduleProposal(proposalId, payload),
    onSuccess: async (_, variables) => {
      const labels = {
        ACCEPT: 'Schedule accepted. Confirmed lessons were created.',
        REJECT: 'Schedule proposal rejected.',
        CANCEL: 'Schedule proposal cancelled.',
        COUNTER: 'Counter-offer sent.',
      }
      toast.success(labels[variables.payload.action])
      setPendingAction(null)
      setActionMessage('')
      setCounter(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.proposals }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update this schedule proposal.')),
  })

  const proposals = proposalsQuery.data || []
  const visibleProposals = activeStatus === 'ALL'
    ? proposals
    : proposals.filter((proposal) => proposal.status === activeStatus)

  function openAction(proposal, action) {
    setActionMessage('')
    setPendingAction({ proposal, action })
  }

  function openCounter(proposal) {
    const revision = proposal.current_revision
    setCounter({
      proposal,
      mode: revision.mode,
      location: revision.location || '',
      timezone: revision.timezone,
      notes: revision.notes || '',
      message: '',
      sessions: revision.sessions.map((session) => ({
        start_datetime: toDateTimeInput(session.start_datetime),
        end_datetime: toDateTimeInput(session.end_datetime),
      })),
    })
  }

  function submitCounter() {
    const normalizedSessions = counter.sessions.map((session) => ({
      start: new Date(session.start_datetime),
      end: new Date(session.end_datetime),
    }))
    if (normalizedSessions.some((session) => (
      Number.isNaN(session.start.getTime())
      || Number.isNaN(session.end.getTime())
      || session.end <= session.start
    ))) {
      toast.error('Every counter-offer lesson needs a valid start and end time.')
      return
    }

    actionMutation.mutate({
      proposalId: counter.proposal.id,
      payload: {
        action: 'COUNTER',
        mode: counter.mode,
        location: counter.mode === 'IN_PERSON' ? counter.location.trim() : '',
        timezone: counter.timezone,
        notes: counter.notes.trim(),
        message: counter.message.trim(),
        sessions: normalizedSessions.map((session) => ({
          start_datetime: session.start.toISOString(),
          end_datetime: session.end.toISOString(),
        })),
      },
    })
  }

  return (
    <section className="schedule-proposals-page">
      <header className="schedule-proposals-hero">
        <div>
          <p className="eyebrow">Schedule proposals</p>
          <h1>Agree on long-term lesson times clearly.</h1>
          <p>Review recurring schedules, respond with changes, and keep every revision visible before lessons are confirmed.</p>
        </div>
        {['STUDENT', 'PARENT'].includes(user?.role) ? <Link className="primary-button" to="/tutors">Propose a schedule</Link> : null}
      </header>

      <nav className="schedule-proposal-tabs" aria-label="Filter schedule proposals">
        {STATUS_FILTERS.map((status) => {
          const count = status === 'ALL' ? proposals.length : proposals.filter((proposal) => proposal.status === status).length
          return (
            <button className={activeStatus === status ? 'is-active' : ''} type="button" key={status} onClick={() => setActiveStatus(status)}>
              {status === 'ALL' ? 'All' : status.toLowerCase()} <span>{count}</span>
            </button>
          )
        })}
      </nav>

      <div className="schedule-proposals-list">
        {proposalsQuery.isLoading ? (
          Array.from({ length: 2 }).map((_, index) => <div className="schedule-proposal-card" key={index} aria-busy="true"><div className="skeleton skeleton-line skeleton-title" /></div>)
        ) : proposalsQuery.isError ? (
          <article className="schedule-proposal-empty"><h2>We could not load schedule proposals.</h2><button className="primary-button" type="button" onClick={() => proposalsQuery.refetch()}>Try again</button></article>
        ) : visibleProposals.length ? (
          visibleProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              user={user}
              onAction={openAction}
              onCounter={openCounter}
              busy={actionMutation.isPending}
              highlighted={String(proposal.id) === String(highlightedId)}
            />
          ))
        ) : (
          <article className="schedule-proposal-empty">
            <p className="eyebrow">No proposals</p>
            <h2>{proposals.length ? 'No proposals match this status.' : 'Long-term schedule proposals will appear here.'}</h2>
            <p>Single lesson requests remain available from the normal booking workflow.</p>
          </article>
        )}
      </div>

      <ActionDialog
        pendingAction={pendingAction}
        message={actionMessage}
        setMessage={setActionMessage}
        onClose={() => !actionMutation.isPending && setPendingAction(null)}
        onConfirm={() => actionMutation.mutate({
          proposalId: pendingAction.proposal.id,
          payload: { action: pendingAction.action, message: actionMessage.trim() },
        })}
        busy={actionMutation.isPending}
      />
      <CounterDialog
        counter={counter}
        setCounter={setCounter}
        onClose={() => !actionMutation.isPending && setCounter(null)}
        onSubmit={submitCounter}
        busy={actionMutation.isPending}
      />
    </section>
  )
}
