import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { listPayments } from '../api/services/payments'
import { PaymentCheckoutDialog } from '../components/payments/PaymentCheckoutDialog.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { updateBookingAction, updateBookingProgress } from '../api/services/bookings'
import { useAuth } from '../context/AuthContext.jsx'
import { useBookingsQuery } from '../hooks/useCommonQueries'
import './BookingsPage.css'

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED']

const STATUS_COPY = {
  PENDING: { label: 'Pending', detail: 'Waiting for the tutor to respond.' },
  CONFIRMED: { label: 'Confirmed', detail: 'The lesson is scheduled.' },
  COMPLETED: { label: 'Completed', detail: 'The tutor marked this lesson complete.' },
  REJECTED: { label: 'Rejected', detail: 'The tutor declined this lesson request.' },
  CANCELLED: { label: 'Cancelled', detail: 'This lesson will not take place.' },
}

const ACTION_COPY = {
  ACCEPT: { label: 'Accept request', title: 'Accept this lesson request?', tone: 'primary' },
  REJECT: { label: 'Reject request', title: 'Reject this lesson request?', tone: 'danger' },
  COMPLETE: { label: 'Mark complete', title: 'Mark this lesson as completed?', tone: 'primary' },
  CANCEL: { label: 'Cancel booking', title: 'Cancel this booking?', tone: 'danger' },
}

const ACTION_RESULT_COPY = {
  ACCEPT: 'accepted',
  REJECT: 'rejected',
  COMPLETE: 'completed',
  CANCEL: 'cancelled',
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

function BookingProgressPanel({ booking }) {
  const progress = booking.progress
  const percent = Number(progress?.progress_percent || 0)

  return (
    <section className="booking-progress-panel">
      <header>
        <div>
          <span>Learning progress</span>
          <strong>{progress?.summary || 'No tutor update yet'}</strong>
        </div>
        <b>{percent}%</b>
      </header>
      <div className="booking-progress-track" role="progressbar" aria-label="Booking learning progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}>
        <span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
      {progress ? (
        <div className="booking-progress-details">
          <div><span>Topics covered</span><p>{progress.topics_covered || 'Not added yet'}</p></div>
          <div><span>Next steps</span><p>{progress.next_steps || 'Not added yet'}</p></div>
          <small>Updated by {progress.updated_by_name} / {formatDateTime(progress.updated_at)}</small>
        </div>
      ) : (
        <p className="booking-progress-empty">The tutor will add progress notes as this lesson moves forward.</p>
      )}
    </section>
  )
}

function BookingCard({ booking, payment, user, onAction, onPay, onProgress, busyAction }) {
  const role = user?.role
  const status = STATUS_COPY[booking.status] || { label: booking.status, detail: 'Booking status updated.' }
  const actions = getBookingActions(booking, role)
  const requesterId = booking.requested_by || booking.student
  const canMessage = role === 'TUTOR' || (
    ['STUDENT', 'PARENT'].includes(role) &&
    String(requesterId) === String(user?.id)
  )
  const canReview = role === 'STUDENT' && booking.status === 'COMPLETED'
  const canPay = role === 'STUDENT' &&
    ['CONFIRMED', 'COMPLETED'].includes(booking.status) &&
    !['PAID', 'REFUNDED'].includes(payment?.status)

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
        {booking.mode === 'IN_PERSON' ? <div><span>Location</span><strong>{booking.location || 'Not provided'}</strong></div> : null}
        <div><span>Total</span><strong>{formatMoney(booking.total_amount, booking.currency)}</strong></div>
        {role === 'STUDENT' ? (
          <div><span>Payment</span><strong>{payment?.status || 'Not started'}</strong></div>
        ) : null}
        {role === 'PARENT' ? <div><span>Student</span><strong>{booking.student_name}</strong></div> : null}
      </div>

      <p className="booking-status-detail">{status.detail}</p>
      {booking.notes ? <div className="booking-lifecycle-note"><span>Lesson note</span><p>{booking.notes}</p></div> : null}
      {['CONFIRMED', 'COMPLETED'].includes(booking.status) ? <BookingProgressPanel booking={booking} /> : null}

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
        {role === 'TUTOR' && ['CONFIRMED', 'COMPLETED'].includes(booking.status) ? (
          <button className="secondary-button" type="button" onClick={() => onProgress(booking)}>
            {booking.progress ? 'Update progress' : 'Add progress'}
          </button>
        ) : null}
        {canMessage ? <Link className="secondary-button" to={'/messages?booking=' + booking.id}>Message</Link> : null}
        {canReview ? <Link className="secondary-button" to={'/reviews?booking=' + booking.id}>Leave review</Link> : null}
        {canPay ? <button className="primary-button" type="button" onClick={() => onPay(booking)}>Pay securely</button> : null}
      </footer>
    </article>
  )
}

function ActionDialog({ pendingAction, message, setMessage, onClose, onConfirm, busy }) {
  if (!pendingAction) return null
  const copy = ACTION_COPY[pendingAction.action]
  const requiresReason = ['REJECT', 'CANCEL'].includes(pendingAction.action)

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
          <span>{requiresReason ? 'Reason' : 'Message'} {!requiresReason ? <small>Optional</small> : null}</span>
          <textarea
            rows="3"
            maxLength="500"
            placeholder={requiresReason ? 'Explain why this booking cannot proceed.' : 'Add a short message for the other person.'}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          {requiresReason && !message.trim() ? <small>A reason is required to continue.</small> : null}
        </label>
        <div className="booking-review-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Go back</button>
          <button
            className={copy.tone === 'danger' ? 'booking-danger-button' : 'primary-button'}
            type="button"
            onClick={onConfirm}
            disabled={busy || (requiresReason && !message.trim())}
          >
            {busy ? 'Updating...' : copy.label}
          </button>
        </div>
    </ConfirmationDialog>
  )
}

function ProgressDialog({ booking, form, setForm, onClose, onSave, busy }) {
  if (!booking) return null

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <ConfirmationDialog
      open={Boolean(booking)}
      onClose={onClose}
      labelledBy="booking-progress-title"
      backdropClassName="booking-dialog-backdrop"
      dialogClassName="booking-action-dialog booking-progress-dialog"
    >
      <p className="eyebrow">Booking #{booking.id}</p>
      <h2 id="booking-progress-title">Update learning progress</h2>
      <p>Give the learner and parent a clear, evidence-based update for {booking.subject_name || 'this lesson'}.</p>

      <label className="booking-progress-range">
        <span><strong>Overall progress</strong><b>{form.progress_percent}%</b></span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={form.progress_percent}
          onChange={(event) => updateField('progress_percent', event.target.value)}
        />
      </label>
      <label className="booking-field">
        <span>Progress summary</span>
        <textarea
          rows="3"
          maxLength="1000"
          value={form.summary}
          onChange={(event) => updateField('summary', event.target.value)}
          placeholder="What can the learner now understand or do?"
        />
      </label>
      <div className="booking-progress-field-grid">
        <label className="booking-field">
          <span>Topics covered</span>
          <textarea
            rows="4"
            maxLength="1500"
            value={form.topics_covered}
            onChange={(event) => updateField('topics_covered', event.target.value)}
            placeholder={'One topic per line\nEquivalent fractions\nComparing fractions'}
          />
        </label>
        <label className="booking-field">
          <span>Next steps</span>
          <textarea
            rows="4"
            maxLength="1500"
            value={form.next_steps}
            onChange={(event) => updateField('next_steps', event.target.value)}
            placeholder="What should happen before or during the next lesson?"
          />
        </label>
      </div>
      <div className="booking-review-actions">
        <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="primary-button" type="button" onClick={onSave} disabled={busy || !form.summary.trim()}>
          {busy ? 'Saving update...' : 'Share progress update'}
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
  const [paymentBooking, setPaymentBooking] = useState(null)
  const [progressBooking, setProgressBooking] = useState(null)
  const [progressForm, setProgressForm] = useState({
    progress_percent: 0,
    summary: '',
    topics_covered: '',
    next_steps: '',
  })

  const bookingsQuery = useBookingsQuery()
  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments.bookings,
    queryFn: () => listPayments().then((response) => response.data),
    enabled: user?.role === 'STUDENT',
  })

  const actionMutation = useMutation({
    mutationFn: async ({ booking, action, message }) => (
      await updateBookingAction(booking.id, { action, message })
    ).data,
    onSuccess: async (_, variables) => {
      toast.success(`Booking ${ACTION_RESULT_COPY[variables.action] || 'updated'} successfully.`)
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

  const progressMutation = useMutation({
    mutationFn: async ({ bookingId, payload }) => (
      await updateBookingProgress(bookingId, payload)
    ).data,
    onSuccess: async () => {
      toast.success('Learning progress shared successfully.')
      setProgressBooking(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.parents.all }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not save this progress update.')),
  })

  const bookings = bookingsQuery.data || []
  const paymentsByBooking = new Map(
    (paymentsQuery.data || []).map((payment) => [String(payment.booking_id), payment]),
  )
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

  function openProgress(booking) {
    const progress = booking.progress || {}
    setProgressBooking(booking)
    setProgressForm({
      progress_percent: Number(progress.progress_percent || 0),
      summary: progress.summary || '',
      topics_covered: progress.topics_covered || '',
      next_steps: progress.next_steps || '',
    })
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
              payment={paymentsByBooking.get(String(booking.id))}
              user={user}
              key={booking.id}
              onAction={openAction}
              onPay={setPaymentBooking}
              onProgress={openProgress}
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
      <PaymentCheckoutDialog
        key={paymentBooking?.id || 'booking-payment'}
        open={Boolean(paymentBooking)}
        kind="booking"
        itemId={paymentBooking?.id}
        title={`${paymentBooking?.subject_name || 'Lesson'} booking #${paymentBooking?.id || ''}`}
        amount={paymentBooking?.total_amount}
        currency={paymentBooking?.currency || 'RWF'}
        initialPhone={user?.profile?.data?.phone_number || ''}
        onClose={() => setPaymentBooking(null)}
        onSettled={async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.payments.bookings }),
            queryClient.invalidateQueries({ queryKey: queryKeys.payments.tutorEarnings }),
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
          ])
        }}
      />
      <ProgressDialog
        booking={progressBooking}
        form={progressForm}
        setForm={setProgressForm}
        onClose={() => {
          if (!progressMutation.isPending) setProgressBooking(null)
        }}
        onSave={() => progressMutation.mutate({
          bookingId: progressBooking.id,
          payload: {
            ...progressForm,
            progress_percent: Number(progressForm.progress_percent),
            summary: progressForm.summary.trim(),
            topics_covered: progressForm.topics_covered.trim(),
            next_steps: progressForm.next_steps.trim(),
          },
        })}
        busy={progressMutation.isPending}
      />
    </section>
  )
}
