import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { updateBookingAction } from '../api/services/bookings'
import { useAuth } from '../context/AuthContext.jsx'
import { useBookingsQuery } from '../hooks/useCommonQueries'
import './BookingsPage.css'

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

const STATUS_COPY = {
  PENDING: { label: 'Pending', detail: 'Waiting for the tutor to respond.' },
  CONFIRMED: { label: 'Confirmed', detail: 'The lesson is scheduled.' },
  COMPLETED: { label: 'Completed', detail: 'The tutor marked this lesson complete.' },
  CANCELLED: { label: 'Cancelled', detail: 'This lesson will not take place.' },
}

const ACTION_COPY = {
  ACCEPT: { label: 'Accept request', title: 'Accept this lesson request?', tone: 'primary' },
  REJECT: { label: 'Reject request', title: 'Reject this lesson request?', tone: 'danger' },
  COMPLETE: { label: 'Mark complete', title: 'Mark this lesson as completed?', tone: 'primary' },
  CANCEL: { label: 'Cancel booking', title: 'Cancel this booking?', tone: 'danger' },
}

function formatDateTime(value) {
  if (!value) return 'Not scheduled'
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
  return currency + ' ' + new Intl.NumberFormat('en-US', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

function formatAction(value) {
  if (!value) return 'Updated'
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll('_', ' ')
}

function getBookingActions(booking, role) {
  if (role === 'TUTOR') {
    if (booking.status === 'PENDING') return ['ACCEPT', 'REJECT']
    if (booking.status === 'CONFIRMED') return ['COMPLETE', 'CANCEL']
  }
  if ((role === 'STUDENT' || role === 'PARENT') && ['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return ['CANCEL']
  }
  return []
}

function BookingTimeline({ booking }) {
  const events = Array.isArray(booking.events) ? booking.events : []

  return (
    <div className="booking-timeline">
      {events.length ? events.map((event) => (
        <div className="booking-timeline-item" key={event.id}>
          <span className="booking-timeline-dot" aria-hidden="true" />
          <div>
            <strong>{formatAction(event.action)}</strong>
            <span>{event.actor_name || 'System'} / {formatDateTime(event.created_at)}</span>
            {event.message ? <p>{event.message}</p> : null}
          </div>
        </div>
      )) : (
        <div className="booking-timeline-item">
          <span className="booking-timeline-dot" aria-hidden="true" />
          <div><strong>Created</strong><span>{formatDateTime(booking.created_at)}</span></div>
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking, user, onAction, busyAction }) {
  const role = user?.role
  const status = STATUS_COPY[booking.status] || { label: booking.status, detail: 'Booking status updated.' }
  const actions = getBookingActions(booking, role)
  const requesterId = booking.requested_by || booking.student
  const canMessage = role === 'TUTOR' || (
    ['STUDENT', 'PARENT'].includes(role) &&
    String(requesterId) === String(user?.id)
  )
  const canReview = role === 'STUDENT' && booking.status === 'COMPLETED'

  return (
    <article className="booking-lifecycle-card">
      <header className="booking-lifecycle-head">
        <div>
          <p className="eyebrow">Booking #{booking.id}</p>
          <h2>{booking.subject_name || 'Lesson request'}</h2>
          <p>{role === 'TUTOR' ? booking.student_name : booking.tutor_name}</p>
        </div>
        <span className={'booking-status booking-status-' + booking.status.toLowerCase()}>{status.label}</span>
      </header>

      <div className="booking-lifecycle-facts">
        <div><span>Starts</span><strong>{formatDateTime(booking.start_datetime)}</strong></div>
        <div><span>Mode</span><strong>{booking.mode === 'IN_PERSON' ? 'In person' : 'Online'}</strong></div>
        <div><span>Total</span><strong>{formatMoney(booking.total_amount, booking.currency)}</strong></div>
        {role === 'PARENT' ? <div><span>Student</span><strong>{booking.student_name}</strong></div> : null}
      </div>

      <p className="booking-status-detail">{status.detail}</p>
      {booking.notes ? <div className="booking-lifecycle-note"><span>Lesson note</span><p>{booking.notes}</p></div> : null}

      <details className="booking-history">
        <summary>View activity history</summary>
        <BookingTimeline booking={booking} />
      </details>

      <footer className="booking-lifecycle-actions">
        {actions.map((action) => (
          <button
            className={ACTION_COPY[action].tone === 'danger' ? 'booking-danger-button' : 'primary-button'}
            type="button"
            key={action}
            disabled={busyAction}
            onClick={() => onAction(booking, action)}
          >
            {ACTION_COPY[action].label}
          </button>
        ))}
        {canMessage ? <Link className="secondary-button" to={'/messages?booking=' + booking.id}>Message</Link> : null}
        {canReview ? <Link className="secondary-button" to={'/reviews?booking=' + booking.id}>Leave review</Link> : null}
      </footer>
    </article>
  )
}

function ActionDialog({ pendingAction, message, setMessage, onClose, onConfirm, busy }) {
  if (!pendingAction) return null
  const copy = ACTION_COPY[pendingAction.action]

  return (
    <ConfirmationDialog
      open={Boolean(pendingAction)}
      onClose={onClose}
      labelledBy="booking-action-title"
      backdropClassName="booking-dialog-backdrop"
      dialogClassName="booking-action-dialog"
    >
        <p className="eyebrow">Booking #{pendingAction.booking.id}</p>
        <h2 id="booking-action-title">{copy.title}</h2>
        <p>
          {pendingAction.booking.subject_name} with {pendingAction.booking.student_name} and {pendingAction.booking.tutor_name}.
        </p>
        <label className="booking-field">
          <span>Message <small>Optional</small></span>
          <textarea
            rows="3"
            maxLength="500"
            placeholder="Add a short explanation for the other person."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <div className="booking-review-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Go back</button>
          <button
            className={copy.tone === 'danger' ? 'booking-danger-button' : 'primary-button'}
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Updating...' : copy.label}
          </button>
        </div>
    </ConfirmationDialog>
  )
}

export function BookingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [pendingAction, setPendingAction] = useState(null)
  const [actionMessage, setActionMessage] = useState('')

  const bookingsQuery = useBookingsQuery()

  const actionMutation = useMutation({
    mutationFn: async ({ booking, action, message }) => (
      await updateBookingAction(booking.id, { action, message })
    ).data,
    onSuccess: async (_, variables) => {
      toast.success('Booking ' + formatAction(variables.action).toLowerCase() + ' successfully.')
      setPendingAction(null)
      setActionMessage('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.parents.dashboard }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update this booking.')),
  })

  const bookings = bookingsQuery.data || []
  const visibleBookings = activeStatus === 'ALL'
    ? bookings
    : bookings.filter((booking) => booking.status === activeStatus)
  const counts = STATUS_FILTERS.reduce((result, status) => {
    result[status] = status === 'ALL' ? bookings.length : bookings.filter((item) => item.status === status).length
    return result
  }, {})

  function openAction(booking, action) {
    setActionMessage('')
    setPendingAction({ booking, action })
  }

  return (
    <section className="bookings-lifecycle-page">
      <header className="bookings-lifecycle-hero">
        <div>
          <p className="eyebrow">Bookings</p>
          <h1>Keep every lesson request clear.</h1>
          <p className="supporting-text">Review schedules, respond to requests, and follow each booking from creation to completion.</p>
        </div>
        {user?.role === 'STUDENT' || user?.role === 'PARENT' ? (
          <Link className="primary-button" to="/tutors">Request another tutor</Link>
        ) : null}
      </header>

      <section className="booking-status-tabs" aria-label="Filter bookings by status">
        {STATUS_FILTERS.map((status) => (
          <button
            className={activeStatus === status ? 'booking-status-tab-active' : ''}
            type="button"
            key={status}
            onClick={() => setActiveStatus(status)}
          >
            <span>{status === 'ALL' ? 'All' : STATUS_COPY[status].label}</span>
            <strong>{counts[status]}</strong>
          </button>
        ))}
      </section>

      <section className="booking-lifecycle-list">
        {bookingsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <article className="booking-lifecycle-card" key={index} aria-busy="true">
              <div className="skeleton skeleton-line skeleton-title" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
            </article>
          ))
        ) : bookingsQuery.isError ? (
          <article className="booking-lifecycle-empty">
            <p className="eyebrow">Could not load bookings</p>
            <h2>Let us try that again.</h2>
            <p>{getApiErrorMessage(bookingsQuery.error)}</p>
            <button className="primary-button" type="button" onClick={() => bookingsQuery.refetch()}>Try again</button>
          </article>
        ) : visibleBookings.length ? (
          visibleBookings.map((booking) => (
            <BookingCard
              booking={booking}
              user={user}
              key={booking.id}
              onAction={openAction}
              busyAction={actionMutation.isPending && pendingAction?.booking.id === booking.id}
            />
          ))
        ) : (
          <article className="booking-lifecycle-empty">
            <p className="eyebrow">No {activeStatus === 'ALL' ? '' : STATUS_COPY[activeStatus].label.toLowerCase()} bookings</p>
            <h2>{bookings.length ? 'Nothing in this status yet.' : 'Your lesson requests will appear here.'}</h2>
            <p>Browse verified tutors and choose a lesson time that fits your budget.</p>
            {user?.role === 'STUDENT' || user?.role === 'PARENT' ? <Link className="primary-button" to="/tutors">Find a tutor</Link> : null}
          </article>
        )}
      </section>

      <ActionDialog
        pendingAction={pendingAction}
        message={actionMessage}
        setMessage={setActionMessage}
        onClose={() => {
          if (!actionMutation.isPending) setPendingAction(null)
        }}
        onConfirm={() => actionMutation.mutate({
          ...pendingAction,
          message: actionMessage.trim(),
        })}
        busy={actionMutation.isPending}
      />
    </section>
  )
}
