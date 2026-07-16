import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors.js'
import { queryKeys } from '../api/queryKeys.js'
import { createScheduleProposal } from '../api/services/bookings.js'
import { listParentLinks } from '../api/services/parents.js'
import { getTutor } from '../api/services/tutors.js'
import { InlineIcon } from '../components/ui/InlineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSubjectsQuery } from '../hooks/useCommonQueries.js'
import './ScheduleProposalBuilderPage.css'
import { buildRecurringSessions } from './scheduleProposalUtils.js'

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

const DRAFT_PREFIX = 'isomo_schedule_proposal_'

function pad(value) {
  return String(value).padStart(2, '0')
}

function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toDateTimeInput(date) {
  return `${toDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function createDefaultForm(tutorId) {
  const firstDate = new Date()
  firstDate.setDate(firstDate.getDate() + 1)
  firstDate.setHours(16, 0, 0, 0)
  const lastDate = new Date(firstDate)
  lastDate.setDate(lastDate.getDate() + 28)
  const customEnd = new Date(firstDate)
  customEnd.setHours(customEnd.getHours() + 1)

  return {
    tutorId,
    subjectId: '',
    studentId: '',
    scheduleType: 'RECURRING',
    mode: 'ONLINE',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    notes: '',
    message: '',
    recurring: {
      startDate: toDateInput(firstDate),
      endDate: toDateInput(lastDate),
      weekdays: [firstDate.getDay()],
      startTime: '16:00',
      durationMinutes: 60,
    },
    customSessions: [
      {
        start_datetime: toDateTimeInput(firstDate),
        end_datetime: toDateTimeInput(customEnd),
      },
    ],
  }
}

function loadDraft(tutorId) {
  const fallback = createDefaultForm(tutorId)
  try {
    const stored = JSON.parse(localStorage.getItem(`${DRAFT_PREFIX}${tutorId}`))
    return stored?.tutorId === tutorId ? { ...fallback, ...stored } : fallback
  } catch {
    return fallback
  }
}

function normalizeCustomSessions(sessions) {
  return sessions
    .filter((session) => session.start_datetime && session.end_datetime)
    .map((session) => ({
      start_datetime: new Date(session.start_datetime).toISOString(),
      end_datetime: new Date(session.end_datetime).toISOString(),
    }))
    .sort((left, right) => left.start_datetime.localeCompare(right.start_datetime))
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
  if (!Number.isFinite(amount)) return 'Price confirmed during negotiation'
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)} ${currency}`
}

export function ScheduleProposalBuilderPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()
  const [form, setForm] = useState(() => loadDraft(id))
  const [validationError, setValidationError] = useState('')

  const tutorQuery = useQuery({
    queryKey: queryKeys.tutors.detail(id),
    queryFn: async () => (await getTutor(id)).data,
    enabled: Boolean(id),
  })
  const subjectsQuery = useSubjectsQuery()
  const parentLinksQuery = useQuery({
    queryKey: queryKeys.parents.links,
    queryFn: async () => (await listParentLinks()).data,
    enabled: user?.role === 'PARENT',
  })

  const tutor = tutorQuery.data
  const taughtSubjectNames = new Set((tutor?.subjects || []).map((name) => name.toLowerCase()))
  const subjectOptions = (subjectsQuery.data || []).filter(
    (subject) => taughtSubjectNames.has(subject.name.toLowerCase()),
  )
  const selectedMode = (
    (form.mode === 'ONLINE' && tutor?.teaches_online)
    || (form.mode === 'IN_PERSON' && tutor?.teaches_in_person)
  )
    ? form.mode
    : tutor?.teaches_online ? 'ONLINE' : 'IN_PERSON'
  const sessions = useMemo(
    () => (
      form.scheduleType === 'RECURRING'
        ? buildRecurringSessions(form.recurring)
        : normalizeCustomSessions(form.customSessions)
    ),
    [form],
  )
  const totalHours = sessions.reduce((total, session) => (
    total + ((new Date(session.end_datetime) - new Date(session.start_datetime)) / 3600000)
  ), 0)
  const estimatedTotal = Number(tutor?.hourly_rate) * totalHours

  const proposalMutation = useMutation({
    mutationFn: createScheduleProposal,
    onSuccess: async (response) => {
      localStorage.removeItem(`${DRAFT_PREFIX}${id}`)
      toast.success(`Schedule proposal #${response.data.id} sent to ${tutor.full_name}.`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.proposals }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
      ])
      navigate(`/schedule-proposals?proposal=${response.data.id}`)
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'Could not send this schedule proposal.')
      setValidationError(message)
      toast.error(message)
    },
  })

  function updateField(field, value) {
    setValidationError('')
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateRecurring(field, value) {
    setValidationError('')
    setForm((current) => ({
      ...current,
      recurring: { ...current.recurring, [field]: value },
    }))
  }

  function toggleWeekday(value) {
    const weekdays = form.recurring.weekdays.includes(value)
      ? form.recurring.weekdays.filter((item) => item !== value)
      : [...form.recurring.weekdays, value]
    updateRecurring('weekdays', weekdays)
  }

  function updateCustomSession(index, field, value) {
    setForm((current) => ({
      ...current,
      customSessions: current.customSessions.map((session, sessionIndex) => (
        sessionIndex === index ? { ...session, [field]: value } : session
      )),
    }))
  }

  function addCustomSession() {
    const previous = form.customSessions.at(-1)
    const start = previous?.start_datetime ? new Date(previous.start_datetime) : new Date()
    start.setDate(start.getDate() + 7)
    const end = new Date(start)
    end.setHours(end.getHours() + 1)
    updateField('customSessions', [
      ...form.customSessions,
      { start_datetime: toDateTimeInput(start), end_datetime: toDateTimeInput(end) },
    ])
  }

  function validateProposal() {
    if (!form.subjectId) return 'Choose the subject for this schedule.'
    if (!sessions.length) return 'Add at least one valid lesson date.'
    if (sessions.length > 60) return 'A schedule proposal can contain at most 60 lessons.'
    if (selectedMode === 'IN_PERSON' && !form.location.trim()) return 'Enter the in-person lesson location.'
    if (user?.role === 'PARENT' && !form.studentId) return 'Choose the linked student who will attend.'
    if (sessions.some((session) => new Date(session.end_datetime) <= new Date(session.start_datetime))) {
      return 'Every lesson must end after it starts.'
    }
    if (sessions.some((session) => new Date(session.start_datetime) <= new Date())) {
      return 'Every lesson must be scheduled in the future.'
    }
    return ''
  }

  function submitProposal(event) {
    event.preventDefault()
    const error = validateProposal()
    if (error) {
      setValidationError(error)
      toast.error(error)
      return
    }

    if (!isAuthenticated) {
      localStorage.setItem(`${DRAFT_PREFIX}${id}`, JSON.stringify(form))
      toast.info('Sign in to send this schedule. Your draft has been kept.')
      navigate('/sign-in', { state: { from: location } })
      return
    }
    if (!['STUDENT', 'PARENT'].includes(user?.role)) {
      setValidationError('Only students and parents can send schedule proposals.')
      return
    }

    proposalMutation.mutate({
      tutor_id: tutor.user_id,
      subject_id: Number(form.subjectId),
      ...(user.role === 'PARENT' ? { student_id: Number(form.studentId) } : {}),
      schedule_type: form.scheduleType,
      mode: selectedMode,
      location: selectedMode === 'IN_PERSON' ? form.location.trim() : '',
      timezone: form.timezone,
      notes: form.notes.trim(),
      message: form.message.trim(),
      sessions,
    })
  }

  if (tutorQuery.isLoading) {
    return <section className="schedule-builder-page" aria-busy="true"><div className="skeleton skeleton-line skeleton-title" /></section>
  }

  if (tutorQuery.isError || !tutor) {
    return (
      <section className="schedule-builder-page">
        <article className="schedule-builder-state">
          <h1>We could not open this tutor schedule.</h1>
          <p>{getApiErrorMessage(tutorQuery.error)}</p>
          <Link className="primary-button" to="/tutors">Back to tutors</Link>
        </article>
      </section>
    )
  }

  return (
    <section className="schedule-builder-page">
      <header className="schedule-builder-hero">
        <div>
          <p className="eyebrow">Custom schedule proposal</p>
          <h1>Plan consistent lessons with {tutor.full_name}.</h1>
          <p>
            Choose recurring or individual dates. Times outside published availability can be proposed,
            but the tutor must accept them before any lesson is confirmed.
          </p>
        </div>
        <Link className="secondary-button" to={`/tutors/${id}`}>
          <InlineIcon name="arrow" className="is-reversed" /> Back to profile
        </Link>
      </header>

      <form className="schedule-builder-layout" onSubmit={submitProposal}>
        <div className="schedule-builder-main">
          <fieldset className="schedule-builder-card">
            <legend>Learning details</legend>
            {user?.role === 'PARENT' ? (
              <label className="booking-field">
                <span>Linked student</span>
                <select
                  value={form.studentId}
                  onChange={(event) => updateField('studentId', event.target.value)}
                  disabled={parentLinksQuery.isLoading}
                >
                  <option value="">Choose student</option>
                  {(parentLinksQuery.data || []).map((link) => (
                    <option key={link.id} value={link.student}>
                      {link.student_name || link.student_email}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="booking-field-grid">
              <label className="booking-field">
                <span>Subject</span>
                <select value={form.subjectId} onChange={(event) => updateField('subjectId', event.target.value)}>
                  <option value="">Choose subject</option>
                  {subjectOptions.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </label>
              <label className="booking-field">
                <span>Teaching mode</span>
                <select value={selectedMode} onChange={(event) => updateField('mode', event.target.value)}>
                  {tutor.teaches_online ? <option value="ONLINE">Online</option> : null}
                  {tutor.teaches_in_person ? <option value="IN_PERSON">In person</option> : null}
                </select>
              </label>
            </div>
            {selectedMode === 'IN_PERSON' ? (
              <label className="booking-field">
                <span>Lesson location</span>
                <input value={form.location} onChange={(event) => updateField('location', event.target.value)} placeholder="Where should the lessons take place?" />
              </label>
            ) : null}
          </fieldset>

          <fieldset className="schedule-builder-card">
            <legend>Schedule format</legend>
            <div className="schedule-type-options">
              <button className={form.scheduleType === 'RECURRING' ? 'is-active' : ''} type="button" onClick={() => updateField('scheduleType', 'RECURRING')}>
                <strong>Recurring schedule</strong>
                <span>Repeat on selected weekdays over a date range.</span>
              </button>
              <button className={form.scheduleType === 'CUSTOM' ? 'is-active' : ''} type="button" onClick={() => updateField('scheduleType', 'CUSTOM')}>
                <strong>Multiple custom dates</strong>
                <span>Choose unrelated dates and times individually.</span>
              </button>
            </div>

            {form.scheduleType === 'RECURRING' ? (
              <div className="schedule-recurring-fields">
                <div className="booking-field-grid">
                  <label className="booking-field">
                    <span>Start date</span>
                    <input type="date" value={form.recurring.startDate} onChange={(event) => updateRecurring('startDate', event.target.value)} />
                  </label>
                  <label className="booking-field">
                    <span>End date</span>
                    <input type="date" value={form.recurring.endDate} onChange={(event) => updateRecurring('endDate', event.target.value)} />
                  </label>
                  <label className="booking-field">
                    <span>Lesson starts</span>
                    <input type="time" value={form.recurring.startTime} onChange={(event) => updateRecurring('startTime', event.target.value)} />
                  </label>
                  <label className="booking-field">
                    <span>Duration</span>
                    <select value={form.recurring.durationMinutes} onChange={(event) => updateRecurring('durationMinutes', Number(event.target.value))}>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1 hour 30 minutes</option>
                      <option value="120">2 hours</option>
                    </select>
                  </label>
                </div>
                <div className="schedule-weekdays" aria-label="Recurring weekdays">
                  {WEEKDAYS.map((day) => (
                    <button
                      className={form.recurring.weekdays.includes(day.value) ? 'is-selected' : ''}
                      type="button"
                      key={day.value}
                      onClick={() => toggleWeekday(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="schedule-custom-sessions">
                {form.customSessions.map((session, index) => (
                  <div className="schedule-custom-row" key={`${index}-${session.start_datetime}`}>
                    <label className="booking-field">
                      <span>Starts</span>
                      <input type="datetime-local" value={session.start_datetime} onChange={(event) => updateCustomSession(index, 'start_datetime', event.target.value)} />
                    </label>
                    <label className="booking-field">
                      <span>Ends</span>
                      <input type="datetime-local" value={session.end_datetime} onChange={(event) => updateCustomSession(index, 'end_datetime', event.target.value)} />
                    </label>
                    <button
                      className="schedule-remove-session"
                      type="button"
                      disabled={form.customSessions.length === 1}
                      onClick={() => updateField('customSessions', form.customSessions.filter((_, itemIndex) => itemIndex !== index))}
                      aria-label={`Remove lesson ${index + 1}`}
                    >
                      <InlineIcon name="trash" />
                    </button>
                  </div>
                ))}
                <button className="secondary-button" type="button" onClick={addCustomSession}>Add another date</button>
              </div>
            )}
          </fieldset>

          <fieldset className="schedule-builder-card">
            <legend>Proposal message</legend>
            <label className="booking-field">
              <span>Why does this schedule work for you?</span>
              <textarea rows="3" value={form.message} onChange={(event) => updateField('message', event.target.value)} placeholder="Explain your preferred routine or flexibility." />
            </label>
            <label className="booking-field">
              <span>Learning notes <small>Optional</small></span>
              <textarea rows="4" value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Topics, goals, accessibility needs, or preparation details." />
            </label>
          </fieldset>
        </div>

        <aside className="schedule-builder-summary">
          <p className="eyebrow">Proposal summary</p>
          <h2>{sessions.length} lesson{sessions.length === 1 ? '' : 's'}</h2>
          <dl>
            <div><dt>Tutor</dt><dd>{tutor.full_name}</dd></div>
            <div><dt>Timezone</dt><dd>{form.timezone}</dd></div>
            <div><dt>Total learning time</dt><dd>{totalHours.toFixed(1)} hours</dd></div>
            <div><dt>Estimated total</dt><dd>{formatMoney(estimatedTotal, tutor.currency)}</dd></div>
          </dl>
          <div className="schedule-preview-list">
            {sessions.slice(0, 6).map((session) => (
              <time key={session.start_datetime} dateTime={session.start_datetime}>
                <InlineIcon name="calendar" />
                <span>{formatDateTime(session.start_datetime)}</span>
              </time>
            ))}
            {sessions.length > 6 ? <small>+ {sessions.length - 6} more lessons</small> : null}
          </div>
          {validationError ? <p className="booking-submit-error" role="alert">{validationError}</p> : null}
          <button className="primary-button" type="submit" disabled={proposalMutation.isPending}>
            {proposalMutation.isPending ? 'Sending proposal...' : isAuthenticated ? 'Send schedule proposal' : 'Sign in to send proposal'}
          </button>
          <small>No payment is taken. Both sides must agree before lessons are confirmed.</small>
        </aside>
      </form>
    </section>
  )
}
