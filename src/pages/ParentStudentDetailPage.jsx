import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { getParentStudent } from '../api/services/parents'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { UserAvatar } from '../components/ui/UserAvatar.jsx'
import './ParentStudentsPage.css'

function formatDateTime(value) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat('en-RW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMoney(value, currency = 'RWF') {
  const number = Number(value)
  return Number.isFinite(number)
    ? `${currency} ${new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 }).format(number)}`
    : 'Not set'
}

function ProgressSummary({ booking }) {
  const progress = booking.progress
  const percent = Number(progress?.progress_percent || 0)

  return (
    <article className="parent-student-progress-card">
      <header>
        <div><span>{booking.subject_name || 'Lesson'}</span><h3>{booking.tutor_name || 'Tutor'}</h3></div>
        <strong>{percent}%</strong>
      </header>
      <div className="parent-student-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}>
        <span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
      {progress ? (
        <>
          <p>{progress.summary || 'The tutor has started tracking this learner’s progress.'}</p>
          <dl>
            <div><dt>Topics covered</dt><dd>{progress.topics_covered || 'Not added yet'}</dd></div>
            <div><dt>Next steps</dt><dd>{progress.next_steps || 'Not added yet'}</dd></div>
          </dl>
          <small>Updated {formatDateTime(progress.updated_at)} by {progress.updated_by_name}</small>
        </>
      ) : <p>The tutor has not posted a learning progress update yet.</p>}
    </article>
  )
}

export function ParentStudentDetailPage() {
  const { studentId } = useParams()
  const studentQuery = useQuery({
    queryKey: queryKeys.parents.student(studentId),
    queryFn: () => getParentStudent(studentId).then((response) => response.data),
    enabled: Boolean(studentId),
    staleTime: 30_000,
  })

  if (studentQuery.isLoading) {
    return <section className="parent-student-detail-page"><SkeletonLoader rows={8} className="parent-directory-skeleton" /></section>
  }

  if (studentQuery.isError) {
    return (
      <section className="parent-student-detail-page">
        <ErrorState
          title="This student profile could not be opened."
          message={getApiErrorMessage(studentQuery.error)}
          onRetry={studentQuery.refetch}
        />
        <Link className="secondary-button" to="/parent-students">Back to students</Link>
      </section>
    )
  }

  const data = studentQuery.data || {}
  const student = data.student || {}
  const link = data.link || {}
  const bookingStats = data.booking_stats || {}
  const learningStats = data.learning_stats || {}
  const bookings = data.bookings || []
  const outcomes = data.learning_outcomes || []
  const activeBookings = bookings.filter((booking) => booking.status === 'CONFIRMED')
  const subjects = student.subjects_needing_help_names || []
  const preferences = [
    student.prefers_online ? 'Online lessons' : null,
    student.prefers_in_person ? 'In-person lessons' : null,
  ].filter(Boolean)

  return (
    <section className="parent-student-detail-page">
      <Link className="parent-student-back" to="/parent-students">← Back to all students</Link>

      <header className="parent-student-profile-header">
        <UserAvatar
          className="parent-student-profile-avatar"
          src={student.profile_image_url}
          name={student.full_name || student.email}
          fallback="ST"
          loading="eager"
        />
        <div>
          <p className="eyebrow">{link.label || 'Linked learner'}</p>
          <h1>{student.full_name || student.email}</h1>
          <p>{student.level || 'Level not added'} / {student.school_name || 'School not added'} / {student.location || 'Location not added'}</p>
        </div>
        <div className="parent-student-profile-actions">
          <Link className="secondary-button" to="/bookings">View bookings</Link>
          <Link className="primary-button" to="/tutors">Find a tutor</Link>
        </div>
      </header>

      <section className="parent-student-detail-stats">
        <article><span>Total bookings</span><strong>{bookingStats.total_bookings || 0}</strong></article>
        <article><span>Active lessons</span><strong>{bookingStats.confirmed_bookings || 0}</strong></article>
        <article><span>Completed lessons</span><strong>{bookingStats.completed_bookings || 0}</strong></article>
        <article><span>Average improvement</span><strong>{Number(learningStats.average_improvement || 0).toFixed(1)}%</strong></article>
      </section>

      <div className="parent-student-detail-grid">
        <main>
          <section className="parent-student-detail-panel">
            <header><div><p className="eyebrow">Current learning</p><h2>Active booking progress</h2></div><span>{activeBookings.length} active</span></header>
            {activeBookings.length ? (
              <div className="parent-student-progress-list">
                {activeBookings.map((booking) => <ProgressSummary booking={booking} key={booking.id} />)}
              </div>
            ) : (
              <EmptyState
                icon={<DashboardIcon name="bookings" size={28} />}
                title="No active bookings"
                description="Confirmed lessons and tutor progress updates will appear here."
                actionTo="/tutors"
                actionLabel="Find a tutor"
              />
            )}
          </section>

          <section className="parent-student-detail-panel">
            <header><div><p className="eyebrow">Learning evidence</p><h2>Confirmed outcomes</h2></div><span>{outcomes.length} records</span></header>
            {outcomes.length ? (
              <div className="parent-outcome-list">
                {outcomes.map((outcome) => (
                  <article key={outcome.id}>
                    <div><span>{outcome.course_title}</span><h3>{outcome.lesson_title}</h3></div>
                    <dl>
                      <div><dt>Initial</dt><dd>{Number(outcome.pre_test_score).toFixed(0)}%</dd></div>
                      <div><dt>Final</dt><dd>{Number(outcome.post_test_score).toFixed(0)}%</dd></div>
                      <div><dt>Change</dt><dd className={Number(outcome.improvement_percentage) >= 0 ? 'is-positive' : ''}>{Number(outcome.improvement_percentage).toFixed(1)}%</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : <p className="parent-detail-muted">Confirmed pre- and post-assessment outcomes will appear here.</p>}
          </section>

          <section className="parent-student-detail-panel">
            <header><div><p className="eyebrow">History</p><h2>Recent bookings</h2></div><Link to="/bookings">View all</Link></header>
            {bookings.length ? (
              <div className="parent-student-booking-list">
                {bookings.slice(0, 6).map((booking) => (
                  <article key={booking.id}>
                    <span className={`is-${booking.status.toLowerCase()}`}>{booking.status.toLowerCase()}</span>
                    <div><h3>{booking.subject_name || 'Tutoring lesson'}</h3><p>{booking.tutor_name} / {formatDateTime(booking.start_datetime)}</p></div>
                    <strong>{formatMoney(booking.total_amount, booking.currency)}</strong>
                  </article>
                ))}
              </div>
            ) : <p className="parent-detail-muted">This student has no booking history yet.</p>}
          </section>
        </main>

        <aside>
          <section className="parent-student-detail-panel parent-student-learning-profile">
            <header><div><p className="eyebrow">Learning profile</p><h2>Needs and preferences</h2></div></header>
            <dl>
              <div><dt>Learning goals</dt><dd>{student.learning_goals || 'Not added yet'}</dd></div>
              <div><dt>Subjects needing support</dt><dd>{subjects.length ? subjects.join(', ') : 'Not added yet'}</dd></div>
              <div><dt>Preferred format</dt><dd>{preferences.length ? preferences.join(' and ') : 'Not added yet'}</dd></div>
              <div><dt>Budget</dt><dd>{formatMoney(student.budget_min)} to {formatMoney(student.budget_max)}</dd></div>
            </dl>
          </section>

          <section className="parent-student-support-card">
            <DashboardIcon name="reports" size={24} />
            <p className="eyebrow">Parent view</p>
            <h2>Use evidence, not guesswork.</h2>
            <p>Compare tutor updates with confirmed assessment outcomes to understand where this learner is improving and where more support is needed.</p>
            <Link to="/reports">Open family reports</Link>
          </section>
        </aside>
      </div>
    </section>
  )
}
