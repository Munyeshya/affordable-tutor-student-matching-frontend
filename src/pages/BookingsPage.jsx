import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { listPayments } from '../api/services/payments'
import { PaymentCheckoutDialog } from '../components/payments/PaymentCheckoutDialog.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import {
  createDispute,
  listDisputes,
  updateBookingAction,
  updateBookingProgress,
  updateOnlineLessonSession,
} from '../api/services/bookings'
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

const DISPUTE_STATUS_COPY = {
  OPEN: { label: 'Awaiting review', detail: 'Your case is in the administration review queue.' },
  UNDER_REVIEW: { label: 'Under review', detail: 'An administrator is reviewing the booking context and your report.' },
  RESOLVED: { label: 'Resolved', detail: 'The administrator recorded a resolution for this case.' },
  REJECTED: { label: 'Closed', detail: 'The administrator closed this case without further action.' },
}

const DISPUTE_ELIGIBLE_STATUSES = ['CONFIRMED', 'COMPLETED', 'CANCELLED']

const ONLINE_SESSION_PROVIDERS = [
  ['GOOGLE_MEET', 'Google Meet'],
  ['ZOOM', 'Zoom'],
  ['MICROSOFT_TEAMS', 'Microsoft Teams'],
  ['JITSI', 'Jitsi Meet'],
  ['OTHER', 'Other secure platform'],
]

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

function OnlineLessonPanel({ booking, role, onManage }) {
  const session = booking.online_session
  const isTutor = role === 'TUTOR'

  return (
    <section className={'booking-online-session ' + (session ? 'is-ready' : 'is-waiting')}>
      <header>
        <div>
          <span className="booking-online-session-icon" aria-hidden="true">ON</span>
          <div>
            <small>Online lesson room</small>
            <strong>{session?.provider_label || 'Waiting for room setup'}</strong>
          </div>
        </div>
        {session ? <b>{session.can_join_now ? 'Open now' : 'Scheduled'}</b> : null}
      </header>

      {session ? (
        <>
          <p>{session.access_message}</p>
          {session.instructions ? (
            <div className="booking-online-instructions">
              <span>Before joining</span>
              <p>{session.instructions}</p>
            </div>
          ) : null}
          <footer>
            {!isTutor && !session.can_join_now ? (
              <small>Join access opens {formatDateTime(session.access_opens_at)}.</small>
            ) : null}
            {session.join_url && (isTutor || session.can_join_now) ? (
              <a
                className="primary-button"
                href={session.join_url}
                target="_blank"
                rel="noreferrer"
              >
                {isTutor && !session.can_join_now ? 'Open room link' : 'Join online lesson'}
              </a>
            ) : null}
            {isTutor ? (
              <button className="secondary-button" type="button" onClick={() => onManage(booking)}>
                Update room
              </button>
            ) : null}
          </footer>
        </>
      ) : (
        <div className="booking-online-empty">
          <p>
            {isTutor
              ? 'Add a secure meeting link so the learner knows where the online lesson will happen.'
              : 'The tutor has not added the meeting room yet. You will receive a notification when it is ready.'}
          </p>
          {isTutor ? (
            <button className="primary-button" type="button" onClick={() => onManage(booking)}>
              Set online room
            </button>
          ) : null}
        </div>
      )}
    </section>
  )
}

function BookingCard({
  booking,
  payment,
  user,
  activeDispute,
  onAction,
  onPay,
  onProgress,
  onDispute,
  onOnlineSession,
  busyAction,
}) {
  const role = user?.role
  const status = STATUS_COPY[booking.status] || { label: booking.status, detail: 'Booking status updated.' }
  const actions = getBookingActions(booking, role)
  const requesterId = booking.requested_by || booking.student
  const canMessage = role === 'TUTOR' || (
    ['STUDENT', 'PARENT'].includes(role) &&
    String(requesterId) === String(user?.id)
  )
  const canReview = role === 'STUDENT' && booking.status === 'COMPLETED'
  const canPay = ['STUDENT', 'PARENT'].includes(role) &&
    ['CONFIRMED', 'COMPLETED'].includes(booking.status) &&
    !['PAID', 'REFUNDED'].includes(payment?.status)
  const canReportProblem = ['STUDENT', 'PARENT'].includes(role) &&
    DISPUTE_ELIGIBLE_STATUSES.includes(booking.status)

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
        {['STUDENT', 'PARENT'].includes(role) ? (
          <div><span>Payment</span><strong>{payment?.status || 'Not started'}</strong></div>
        ) : null}
        {role === 'PARENT' ? <div><span>Student</span><strong>{booking.student_name}</strong></div> : null}
      </div>

      <p className="booking-status-detail">{status.detail}</p>
      {booking.notes ? <div className="booking-lifecycle-note"><span>Lesson note</span><p>{booking.notes}</p></div> : null}
      {booking.mode === 'ONLINE' && booking.status === 'CONFIRMED' ? (
        <OnlineLessonPanel booking={booking} role={role} onManage={onOnlineSession} />
      ) : null}
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
        {['TUTOR', 'STUDENT'].includes(role) && ['CONFIRMED', 'COMPLETED'].includes(booking.status) ? (
          <Link className="secondary-button" to={`/assessments?booking=${booking.id}`}>
            {role === 'TUTOR' ? 'Set assessments' : 'View assessments'}
          </Link>
        ) : null}
        {canMessage ? <Link className="secondary-button" to={'/messages?booking=' + booking.id}>Message</Link> : null}
        {canReview ? <Link className="secondary-button" to={'/reviews?booking=' + booking.id}>Leave review</Link> : null}
        {canPay ? <button className="primary-button" type="button" onClick={() => onPay(booking)}>Pay securely</button> : null}
        {canReportProblem && activeDispute ? (
          <a className="booking-case-link" href={'#dispute-' + activeDispute.id}>
            Case #{activeDispute.id}: {DISPUTE_STATUS_COPY[activeDispute.status]?.label || activeDispute.status}
          </a>
        ) : null}
        {canReportProblem && !activeDispute ? (
          <button className="booking-report-button" type="button" onClick={() => onDispute(booking)}>
            Report a problem
          </button>
        ) : null}
      </footer>
    </article>
  )
}

function OnlineSessionDialog({ booking, form, setForm, onClose, onSave, busy }) {
  if (!booking) return null
  const secureUrl = form.join_url.trim().startsWith('https://')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <ConfirmationDialog
      open={Boolean(booking)}
      onClose={onClose}
      labelledBy="booking-online-session-title"
      describedBy="booking-online-session-description"
      backdropClassName="booking-dialog-backdrop"
      dialogClassName="booking-action-dialog booking-online-dialog"
    >
      <p className="eyebrow">Booking #{booking.id}</p>
      <h2 id="booking-online-session-title">
        {booking.online_session ? 'Update online lesson room' : 'Prepare online lesson room'}
      </h2>
      <p id="booking-online-session-description">
        Add the secure room for {booking.subject_name || 'this lesson'}. The learner receives access 30 minutes before the scheduled start.
      </p>

      <div className="booking-online-access-summary">
        <span><small>Lesson starts</small><strong>{formatDateTime(booking.start_datetime)}</strong></span>
        <span><small>Access window</small><strong>30 min before to 60 min after</strong></span>
      </div>

      <label className="booking-field">
        <span>Meeting provider</span>
        <select value={form.provider} onChange={(event) => updateField('provider', event.target.value)}>
          {ONLINE_SESSION_PROVIDERS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      <label className="booking-field">
        <span>Secure meeting link</span>
        <input
          type="url"
          value={form.join_url}
          onChange={(event) => updateField('join_url', event.target.value)}
          placeholder="https://meet.google.com/..."
          autoFocus
        />
        {form.join_url && !secureUrl ? <small>Enter a complete HTTPS meeting link.</small> : null}
      </label>
      <label className="booking-field">
        <span>Joining instructions <small>Optional</small></span>
        <textarea
          rows="4"
          maxLength="1000"
          value={form.instructions}
          onChange={(event) => updateField('instructions', event.target.value)}
          placeholder="For example: Join five minutes early and use the learner's full name."
        />
      </label>
      <aside className="booking-online-privacy">
        The meeting URL is never placed in notifications or activity history. Only this booking's tutor, learner, and linked parent can access it.
      </aside>
      <div className="booking-review-actions">
        <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="primary-button" type="button" onClick={onSave} disabled={busy || !secureUrl}>
          {busy ? 'Saving room...' : booking.online_session ? 'Save room changes' : 'Notify learner'}
        </button>
      </div>
    </ConfirmationDialog>
  )
}

function DisputeTracker({ disputes, loading, error, onRetry, user }) {
  if (!['STUDENT', 'PARENT'].includes(user?.role)) return null
  const activeCount = disputes.filter((item) => ['OPEN', 'UNDER_REVIEW'].includes(item.status)).length

  return (
    <section className="booking-disputes-panel" aria-labelledby="booking-disputes-title">
      <header>
        <div>
          <p className="eyebrow">Support cases</p>
          <h2 id="booking-disputes-title">My dispute cases</h2>
          <p>Track concerns reported from your bookings and read the administrator's recorded outcome.</p>
        </div>
        <span><strong>{activeCount}</strong> active</span>
      </header>

      {loading ? (
        <div className="booking-disputes-loading" aria-busy="true">
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line" />
        </div>
      ) : error ? (
        <div className="booking-disputes-error">
          <p>Dispute cases could not be loaded.</p>
          <button type="button" onClick={onRetry}>Try again</button>
        </div>
      ) : disputes.length ? (
        <div className="booking-disputes-list">
          {disputes.map((dispute) => {
            const status = DISPUTE_STATUS_COPY[dispute.status] || {
              label: dispute.status,
              detail: 'This case has been updated.',
            }
            const latestDecision = dispute.decisions?.at(-1)

            return (
              <article id={'dispute-' + dispute.id} key={dispute.id}>
                <div className="booking-dispute-case-head">
                  <div>
                    <span>Case #{dispute.id} / Booking #{dispute.booking_id}</span>
                    <strong>{dispute.booking_context?.subject || 'Lesson booking'}</strong>
                  </div>
                  <b className={'booking-dispute-status booking-dispute-status-' + dispute.status.toLowerCase()}>
                    {status.label}
                  </b>
                </div>
                <p>{status.detail}</p>
                <details>
                  <summary>View case details</summary>
                  <div className="booking-dispute-detail">
                    <span><small>Reported concern</small><p>{dispute.reason}</p></span>
                    <span>
                      <small>Administrative outcome</small>
                      <p>{latestDecision?.comment || dispute.admin_comment || 'No decision has been recorded yet.'}</p>
                    </span>
                    <time dateTime={dispute.created_at}>Submitted {formatDateTime(dispute.created_at)}</time>
                  </div>
                </details>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="booking-disputes-empty">You have no dispute cases. If a confirmed lesson has a serious problem, report it directly from that booking.</p>
      )}
    </section>
  )
}

function DisputeDialog({ booking, reason, setReason, onClose, onSubmit, busy }) {
  if (!booking) return null
  const cleanReason = reason.trim()

  return (
    <ConfirmationDialog
      open={Boolean(booking)}
      onClose={onClose}
      labelledBy="booking-dispute-title"
      describedBy="booking-dispute-description"
      backdropClassName="booking-dialog-backdrop"
      dialogClassName="booking-action-dialog booking-dispute-dialog"
    >
      <p className="eyebrow">Booking #{booking.id}</p>
      <h2 id="booking-dispute-title">Report a lesson problem</h2>
      <p id="booking-dispute-description">
        Explain what happened during {booking.subject_name || 'this lesson'} so an administrator can review the case fairly.
      </p>
      <aside className="booking-dispute-guidance">
        <strong>Include useful facts</strong>
        <ul>
          <li>What was agreed and what happened instead.</li>
          <li>Any communication or action already taken to solve it.</li>
          <li>The fair outcome you would like the administrator to consider.</li>
        </ul>
      </aside>
      <label className="booking-field">
        <span>Describe the concern</span>
        <textarea
          rows="6"
          maxLength="2000"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="For example: The lesson was confirmed for this time, but..."
          autoFocus
        />
        <small>{cleanReason.length}/20 minimum characters</small>
      </label>
      <p className="booking-dispute-notice">
        Your report is shared with the person involved and the administrator. It becomes part of the case record.
      </p>
      <div className="booking-review-actions">
        <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="primary-button" type="button" onClick={onSubmit} disabled={busy || cleanReason.length < 20}>
          {busy ? 'Submitting case...' : 'Submit dispute'}
        </button>
      </div>
    </ConfirmationDialog>
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
  const [disputeBooking, setDisputeBooking] = useState(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [onlineSessionBooking, setOnlineSessionBooking] = useState(null)
  const [onlineSessionForm, setOnlineSessionForm] = useState({
    provider: 'GOOGLE_MEET',
    join_url: '',
    instructions: '',
  })
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
    enabled: ['STUDENT', 'PARENT'].includes(user?.role),
  })
  const disputesQuery = useQuery({
    queryKey: queryKeys.bookings.disputes,
    queryFn: () => listDisputes().then((response) => response.data),
    enabled: ['STUDENT', 'PARENT'].includes(user?.role),
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

  const disputeMutation = useMutation({
    mutationFn: async ({ bookingId, reason }) => (
      await createDispute({ booking_id: bookingId, reason })
    ).data,
    onSuccess: async (dispute) => {
      toast.success(`Dispute case #${dispute.id} submitted for review.`)
      setDisputeBooking(null)
      setDisputeReason('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.disputes }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not submit this dispute.')),
  })

  const onlineSessionMutation = useMutation({
    mutationFn: async ({ bookingId, payload }) => (
      await updateOnlineLessonSession(bookingId, payload)
    ).data,
    onSuccess: async () => {
      toast.success('Online lesson room saved and participants notified.')
      setOnlineSessionBooking(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not save the online lesson room.')),
  })

  const bookings = bookingsQuery.data || []
  const paymentsByBooking = new Map(
    (paymentsQuery.data || []).map((payment) => [String(payment.booking_id), payment]),
  )
  const disputes = disputesQuery.data || []
  const activeDisputesByBooking = new Map(
    disputes
      .filter((dispute) => (
        String(dispute.reported_by) === String(user?.id) &&
        ['OPEN', 'UNDER_REVIEW'].includes(dispute.status)
      ))
      .map((dispute) => [String(dispute.booking_id), dispute]),
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

  function openDispute(booking) {
    setDisputeReason('')
    setDisputeBooking(booking)
  }

  function openOnlineSession(booking) {
    const session = booking.online_session || {}
    setOnlineSessionBooking(booking)
    setOnlineSessionForm({
      provider: session.provider || 'GOOGLE_MEET',
      join_url: session.join_url || '',
      instructions: session.instructions || '',
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

      <DisputeTracker
        disputes={disputes}
        loading={disputesQuery.isLoading}
        error={disputesQuery.isError}
        onRetry={disputesQuery.refetch}
        user={user}
      />

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
              activeDispute={activeDisputesByBooking.get(String(booking.id))}
              key={booking.id}
              onAction={openAction}
              onPay={setPaymentBooking}
              onProgress={openProgress}
              onDispute={openDispute}
              onOnlineSession={openOnlineSession}
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
        learnerName={paymentBooking?.student_name}
        onClose={() => setPaymentBooking(null)}
        onSettled={async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.payments.bookings }),
            queryClient.invalidateQueries({ queryKey: queryKeys.payments.tutorEarnings }),
            queryClient.invalidateQueries({ queryKey: queryKeys.parents.dashboard }),
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
      <DisputeDialog
        booking={disputeBooking}
        reason={disputeReason}
        setReason={setDisputeReason}
        onClose={() => {
          if (!disputeMutation.isPending) {
            setDisputeBooking(null)
            setDisputeReason('')
          }
        }}
        onSubmit={() => disputeMutation.mutate({
          bookingId: disputeBooking.id,
          reason: disputeReason.trim(),
        })}
        busy={disputeMutation.isPending}
      />
      <OnlineSessionDialog
        booking={onlineSessionBooking}
        form={onlineSessionForm}
        setForm={setOnlineSessionForm}
        onClose={() => {
          if (!onlineSessionMutation.isPending) setOnlineSessionBooking(null)
        }}
        onSave={() => onlineSessionMutation.mutate({
          bookingId: onlineSessionBooking.id,
          payload: {
            provider: onlineSessionForm.provider,
            join_url: onlineSessionForm.join_url.trim(),
            instructions: onlineSessionForm.instructions.trim(),
          },
        })}
        busy={onlineSessionMutation.isPending}
      />
    </section>
  )
}
