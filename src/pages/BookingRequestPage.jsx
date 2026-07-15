import React, { useState } from 'react'
import { queryKeys } from '../api/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/errors'
import { createBooking } from '../api/services/bookings'
import { listParentLinks } from '../api/services/parents'
import { getTutor } from '../api/services/tutors'
import { useAuth } from '../context/AuthContext.jsx'
import { usePublicTutorsQuery, useSubjectsQuery } from '../hooks/useCommonQueries'

const BOOKING_STAGES = ['Details', 'Review', 'Submitted']

function formatMoney(value, currency = 'RWF') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'Price confirmed by tutor'

  return currency + ' ' + new Intl.NumberFormat('en-US', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

function formatDateTime(value) {
  if (!value) return 'Not selected'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not selected'

  return new Intl.DateTimeFormat('en-RW', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatMode(value) {
  return value === 'IN_PERSON' ? 'In person' : 'Online'
}

function getInitialForm(searchParams) {
  return {
    tutor_profile_id: searchParams.get('profile') || '',
    tutor_id: searchParams.get('tutor') || '',
    student_id: '',
    subject_id: searchParams.get('subject') || '',
    availability_slot_id: searchParams.get('slot') || '',
    start_datetime: '',
    end_datetime: '',
    mode: searchParams.get('mode') || 'ONLINE',
    notes: '',
  }
}

function getSessionRange(form, selectedSlot) {
  if (form.availability_slot_id && selectedSlot) {
    return { start: selectedSlot.start_datetime, end: selectedSlot.end_datetime }
  }
  return { start: form.start_datetime, end: form.end_datetime }
}

function BookingSteps({ stage }) {
  return (
    <ol className="booking-progress" aria-label="Booking progress">
      {BOOKING_STAGES.map((label, index) => (
        <li
          className={index <= stage ? 'booking-progress-active' : ''}
          key={label}
          aria-current={index === stage ? 'step' : undefined}
        >
          <span>{index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  )
}

function BookingSummary({ form, selectedTutor, selectedSubject, selectedStudent, selectedSlot }) {
  const session = getSessionRange(form, selectedSlot)
  const start = new Date(session.start)
  const end = new Date(session.end)
  const durationHours = Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
    ? null
    : Math.max((end.getTime() - start.getTime()) / 3600000, 0)
  const rate = Number(selectedTutor?.hourly_rate)
  const estimatedTotal = durationHours !== null && Number.isFinite(rate)
    ? durationHours * rate
    : null

  return (
    <div className="booking-summary-list">
      {selectedStudent ? (
        <div><span>Learner</span><strong>{selectedStudent.student_name || selectedStudent.student_email}</strong></div>
      ) : null}
      <div><span>Tutor</span><strong>{selectedTutor?.full_name || 'Not selected'}</strong></div>
      <div><span>Subject</span><strong>{selectedSubject?.name || 'Not selected'}</strong></div>
      <div><span>Starts</span><strong>{formatDateTime(session.start)}</strong></div>
      <div><span>Ends</span><strong>{formatDateTime(session.end)}</strong></div>
      <div><span>Teaching mode</span><strong>{formatMode(form.mode)}</strong></div>
      <div><span>Estimated lesson cost</span><strong>{formatMoney(estimatedTotal, selectedTutor?.currency)}</strong></div>
    </div>
  )
}

export function BookingRequestPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => getInitialForm(searchParams))
  const [stage, setStage] = useState(0)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [createdBooking, setCreatedBooking] = useState(null)

  const tutorsQuery = usePublicTutorsQuery({ page_size: 50 })

  const selectedTutorQuery = useQuery({
    queryKey: queryKeys.tutors.detail(form.tutor_profile_id),
    queryFn: async () => (await getTutor(form.tutor_profile_id)).data,
    enabled: Boolean(form.tutor_profile_id),
  })

  const subjectsQuery = useSubjectsQuery()

  const parentLinksQuery = useQuery({
    queryKey: queryKeys.parents.links,
    queryFn: async () => (await listParentLinks()).data,
    enabled: user?.role === 'PARENT',
  })

  const selectedTutor = selectedTutorQuery.data || null
  const listedTutors = tutorsQuery.data?.results || []
  const tutorOptions = selectedTutor && !listedTutors.some((item) => item.id === selectedTutor.id)
    ? [selectedTutor, ...listedTutors]
    : listedTutors
  const allSubjects = subjectsQuery.data || []
  const taughtSubjectNames = new Set(
    (selectedTutor?.subjects || []).map((name) => String(name).toLowerCase()),
  )
  const subjectOptions = taughtSubjectNames.size
    ? allSubjects.filter((subject) => taughtSubjectNames.has(subject.name.toLowerCase()))
    : allSubjects
  const parentLinks = parentLinksQuery.data || []
  const primaryParentLink = parentLinks.find((item) => item.is_primary) || parentLinks[0]
  const effectiveStudentId = form.student_id || primaryParentLink?.student || ''
  const effectiveTutorUserId = selectedTutor?.user_id || form.tutor_id
  const selectedSubject = allSubjects.find((item) => String(item.id) === String(form.subject_id))
  const selectedStudent = parentLinks.find((item) => String(item.student) === String(effectiveStudentId))
  const selectedSlot = (selectedTutor?.upcoming_availability || []).find(
    (item) => String(item.id) === String(form.availability_slot_id),
  )


  const bookingMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        tutor_id: Number(effectiveTutorUserId),
        subject_id: Number(form.subject_id),
        mode: form.mode,
        notes: form.notes.trim(),
      }
      if (user?.role === 'PARENT') payload.student_id = Number(effectiveStudentId)

      if (form.availability_slot_id) {
        payload.availability_slot_id = Number(form.availability_slot_id)
      } else {
        payload.start_datetime = form.start_datetime
        payload.end_datetime = form.end_datetime
      }
      return (await createBooking(payload)).data
    },
    onSuccess: async (booking) => {
      setCreatedBooking(booking)
      setSubmitError('')
      setStage(2)
      toast.success('Booking request submitted successfully.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.parents.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.detail(form.tutor_profile_id) }),
      ])
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'Could not submit this booking request.')
      setSubmitError(message)
      toast.error(message)
    },
  })

  function updateForm(field, value) {
    setErrors((current) => ({ ...current, [field]: '' }))
    setForm((current) => ({ ...current, [field]: value }))
  }

  function selectTutor(profileId) {
    const tutor = tutorOptions.find((item) => String(item.id) === String(profileId))
    setErrors({})
    setForm((current) => ({
      ...current,
      tutor_profile_id: profileId,
      tutor_id: tutor?.user_id ? String(tutor.user_id) : '',
      subject_id: '',
      availability_slot_id: '',
      start_datetime: '',
      end_datetime: '',
      mode: tutor?.teaches_online ? 'ONLINE' : 'IN_PERSON',
    }))
  }

  function selectSlot(slot) {
    setErrors((current) => ({ ...current, availability_slot_id: '', start_datetime: '', end_datetime: '' }))
    setForm((current) => ({
      ...current,
      availability_slot_id: String(slot.id),
      start_datetime: '',
      end_datetime: '',
      mode: slot.mode,
    }))
  }

  function validateDetails() {
    const nextErrors = {}
    if (!form.tutor_profile_id || !selectedTutor) nextErrors.tutor_profile_id = 'Choose an available tutor.'
    if (user?.role === 'PARENT' && !effectiveStudentId) nextErrors.student_id = 'Choose the linked student who will attend.'
    if (!form.subject_id) nextErrors.subject_id = 'Choose a subject taught by this tutor.'
    if (form.mode === 'ONLINE' && selectedTutor && !selectedTutor.teaches_online) nextErrors.mode = 'This tutor does not teach online.'
    if (form.mode === 'IN_PERSON' && selectedTutor && !selectedTutor.teaches_in_person) nextErrors.mode = 'This tutor does not teach in person.'

    if (form.availability_slot_id) {
      if (!selectedSlot) nextErrors.availability_slot_id = 'This time is no longer available. Choose another slot.'
    } else {
      const start = new Date(form.start_datetime)
      const end = new Date(form.end_datetime)
      if (!form.start_datetime || Number.isNaN(start.getTime())) nextErrors.start_datetime = 'Choose a valid start time.'
      if (!form.end_datetime || Number.isNaN(end.getTime())) nextErrors.end_datetime = 'Choose a valid end time.'
      if (!nextErrors.start_datetime && start <= new Date()) nextErrors.start_datetime = 'The lesson must start in the future.'
      if (!nextErrors.start_datetime && !nextErrors.end_datetime && end <= start) nextErrors.end_datetime = 'End time must be after the start time.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast.error('Please check the highlighted booking details.')
      return false
    }
    return true
  }

  function handleDetailsSubmit(event) {
    event.preventDefault()
    setSubmitError('')
    if (validateDetails()) {
      setStage(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (user?.role === 'TUTOR' || user?.role === 'ADMIN') {
    return (
      <section className="tutor-detail-state card">
        <p className="eyebrow">Request a tutor</p>
        <h1>Booking requests are for students and parents.</h1>
        <p className="supporting-text">Use your dashboard to manage the teaching or administration side of lessons.</p>
        <div className="hero-actions">
          <Link className="primary-button" to={user.role === 'TUTOR' ? '/tutor-dashboard' : '/admin/tutor-reviews'}>Open dashboard</Link>
          <Link className="secondary-button" to="/tutors">Browse tutors</Link>
        </div>
      </section>
    )
  }

  if (stage === 2) {
    return (
      <section className="booking-page booking-success-page">
        <BookingSteps stage={stage} />
        <article className="booking-success-card">
          <span className="booking-success-mark" aria-hidden="true">OK</span>
          <p className="eyebrow">Request submitted</p>
          <h1>Your tutor request is on its way.</h1>
          <p className="supporting-text">{selectedTutor?.full_name} can now review the lesson time and respond. No payment has been taken.</p>
          <div className="booking-reference"><span>Booking reference</span><strong>#{createdBooking?.id}</strong></div>
          <div className="hero-actions">
            <Link className="primary-button" to="/bookings">Track booking</Link>
            <Link className="secondary-button" to="/tutors">Find another tutor</Link>
          </div>
        </article>
      </section>
    )
  }

  if (stage === 1) {
    return (
      <section className="booking-page">
        <BookingSteps stage={stage} />
        <div className="booking-review-layout">
          <article className="booking-form-card">
            <p className="eyebrow">Review request</p>
            <h1>Confirm the lesson details.</h1>
            <p className="supporting-text">The tutor will receive this request and can accept or reject it.</p>
            <BookingSummary form={form} selectedTutor={selectedTutor} selectedSubject={selectedSubject} selectedStudent={selectedStudent} selectedSlot={selectedSlot} />
            {form.notes ? <div className="booking-notes-preview"><span>Your note</span><p>{form.notes}</p></div> : null}
            {submitError ? <p className="booking-submit-error" role="alert">{submitError}</p> : null}
            <div className="booking-review-actions">
              <button className="secondary-button" type="button" onClick={() => setStage(0)} disabled={bookingMutation.isPending}>Edit details</button>
              <button className="primary-button" type="button" onClick={() => bookingMutation.mutate()} disabled={bookingMutation.isPending}>
                {bookingMutation.isPending ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </article>
          <aside className="booking-policy-card">
            <p className="eyebrow">Before you submit</p>
            <h2>Simple and commitment-free.</h2>
            <ul>
              <li>The tutor must confirm your request.</li>
              <li>The estimated price uses the tutor's current hourly rate.</li>
              <li>No payment is charged at this stage.</li>
            </ul>
          </aside>
        </div>
      </section>
    )
  }

  const noLinkedStudents = user?.role === 'PARENT' && !parentLinksQuery.isLoading && parentLinks.length === 0
  const tutorLoading = Boolean(form.tutor_profile_id) && selectedTutorQuery.isLoading
  const tutorError = selectedTutorQuery.isError ? getApiErrorMessage(selectedTutorQuery.error) : ''

  return (
    <section className="booking-page">
      <BookingSteps stage={stage} />
      <header className="booking-page-heading">
        <p className="eyebrow">Request a tutor</p>
        <h1>Plan the lesson in a few clear steps.</h1>
        <p className="supporting-text">Choose who is learning, what they need, and a time the tutor offers.</p>
      </header>

      {noLinkedStudents ? (
        <article className="booking-parent-blocker">
          <div><p className="eyebrow">Linked student required</p><h2>Add a student before booking.</h2><p>Parent accounts create lessons for students linked to their account.</p></div>
          <Link className="primary-button" to="/parent-students">Link a student</Link>
        </article>
      ) : null}

      <form className="booking-form-layout" onSubmit={handleDetailsSubmit} noValidate>
        <div className="booking-form-sections">
          {user?.role === 'PARENT' ? (
            <fieldset className="booking-form-card" disabled={parentLinksQuery.isLoading}>
              <legend><span>1</span> Who is learning?</legend>
              <label className="booking-field">
                <span>Linked student</span>
                <select value={effectiveStudentId} onChange={(event) => updateForm('student_id', event.target.value)}>
                  <option value="">Choose student</option>
                  {parentLinks.map((link) => (
                    <option key={link.id} value={link.student}>{link.student_name || link.student_email}{link.is_primary ? ' (Primary)' : ''}</option>
                  ))}
                </select>
                {errors.student_id ? <small className="booking-field-error">{errors.student_id}</small> : null}
              </label>
            </fieldset>
          ) : null}

          <fieldset className="booking-form-card">
            <legend><span>{user?.role === 'PARENT' ? 2 : 1}</span> Choose the tutor and subject</legend>
            <div className="booking-field-grid">
              <label className="booking-field">
                <span>Tutor</span>
                <select value={form.tutor_profile_id} onChange={(event) => selectTutor(event.target.value)} disabled={tutorsQuery.isLoading}>
                  <option value="">Choose tutor</option>
                  {tutorOptions.map((tutor) => <option key={tutor.id} value={tutor.id}>{tutor.full_name}</option>)}
                </select>
                {errors.tutor_profile_id ? <small className="booking-field-error">{errors.tutor_profile_id}</small> : null}
                {tutorError ? <small className="booking-field-error">{tutorError}</small> : null}
              </label>
              <label className="booking-field">
                <span>Subject</span>
                <select value={form.subject_id} onChange={(event) => updateForm('subject_id', event.target.value)} disabled={!selectedTutor || subjectsQuery.isLoading}>
                  <option value="">Choose subject</option>
                  {subjectOptions.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
                {errors.subject_id ? <small className="booking-field-error">{errors.subject_id}</small> : null}
              </label>
            </div>
          </fieldset>

          <fieldset className="booking-form-card" disabled={!selectedTutor || tutorLoading}>
            <legend><span>{user?.role === 'PARENT' ? 3 : 2}</span> Choose when to learn</legend>
            {tutorLoading ? (
              <div className="booking-slot-skeleton" aria-busy="true"><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line" /></div>
            ) : (
              <>
                <div className="booking-slot-grid">
                  {(selectedTutor?.upcoming_availability || []).map((slot) => (
                    <label className={'booking-slot-option ' + (String(slot.id) === String(form.availability_slot_id) ? 'booking-slot-selected' : '')} key={slot.id}>
                      <input type="radio" name="lesson-time" checked={String(slot.id) === String(form.availability_slot_id)} onChange={() => selectSlot(slot)} />
                      <strong>{formatDateTime(slot.start_datetime)}</strong>
                      <span>{formatMode(slot.mode)}</span>
                    </label>
                  ))}
                  <label className={'booking-slot-option ' + (!form.availability_slot_id ? 'booking-slot-selected' : '')}>
                    <input type="radio" name="lesson-time" checked={!form.availability_slot_id} onChange={() => updateForm('availability_slot_id', '')} />
                    <strong>Request another time</strong>
                    <span>Must fit the tutor's availability</span>
                  </label>
                </div>
                {errors.availability_slot_id ? <small className="booking-field-error">{errors.availability_slot_id}</small> : null}

                {!form.availability_slot_id ? (
                  <div className="booking-custom-time">
                    <label className="booking-field">
                      <span>Teaching mode</span>
                      <select value={form.mode} onChange={(event) => updateForm('mode', event.target.value)}>
                        {selectedTutor?.teaches_online ? <option value="ONLINE">Online</option> : null}
                        {selectedTutor?.teaches_in_person ? <option value="IN_PERSON">In person</option> : null}
                      </select>
                      {errors.mode ? <small className="booking-field-error">{errors.mode}</small> : null}
                    </label>
                    <label className="booking-field">
                      <span>Start time</span>
                      <input type="datetime-local" value={form.start_datetime} onChange={(event) => updateForm('start_datetime', event.target.value)} />
                      {errors.start_datetime ? <small className="booking-field-error">{errors.start_datetime}</small> : null}
                    </label>
                    <label className="booking-field">
                      <span>End time</span>
                      <input type="datetime-local" value={form.end_datetime} onChange={(event) => updateForm('end_datetime', event.target.value)} />
                      {errors.end_datetime ? <small className="booking-field-error">{errors.end_datetime}</small> : null}
                    </label>
                  </div>
                ) : null}
              </>
            )}
          </fieldset>

          <fieldset className="booking-form-card">
            <legend><span>{user?.role === 'PARENT' ? 4 : 3}</span> Add a note</legend>
            <label className="booking-field">
              <span>What should the tutor know? <small>Optional</small></span>
              <textarea rows="4" maxLength="1000" placeholder="For example: topics to review, learning goals, or accessibility needs." value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} />
              <small className="booking-character-count">{form.notes.length}/1000</small>
            </label>
          </fieldset>
        </div>

        <aside className="booking-sidebar">
          <p className="eyebrow">Request summary</p>
          <h2>{selectedTutor?.full_name || 'Choose a tutor'}</h2>
          {selectedTutor ? (
            <>
              <p>{selectedTutor.headline || 'Verified Isomo tutor'}</p>
              <BookingSummary form={form} selectedTutor={selectedTutor} selectedSubject={selectedSubject} selectedStudent={selectedStudent} selectedSlot={selectedSlot} />
            </>
          ) : <p>Select a tutor to see pricing, subjects, and available times.</p>}
          <button className="primary-button booking-continue-button" type="submit" disabled={noLinkedStudents || tutorLoading || selectedTutorQuery.isError}>Review request</button>
          <small>No payment is taken when you send a request.</small>
        </aside>
      </form>
    </section>
  )
}
