import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import { getParentDashboard } from '../api/services/parents'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { queryKeys } from '../api/queryKeys'
import { DashboardPanelHeading, DashboardStatCard, EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { UserAvatar } from '../components/ui/UserAvatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useBookingsQuery } from '../hooks/useCommonQueries'
import './ParentDashboardPage.css'

function formatStatus(value) {
  if (!value) return 'Not started'
  return String(value).toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function formatDateTime(value) {
  if (!value) return { day: '--', month: 'TBD', detail: 'Schedule pending' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { day: '--', month: 'TBD', detail: 'Schedule pending' }
  return {
    day: new Intl.DateTimeFormat('en-RW', { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat('en-RW', { month: 'short' }).format(date),
    detail: new Intl.DateTimeFormat('en-RW', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date),
  }
}

function formatBudget(minimum, maximum) {
  const hasMinimum = minimum !== null && minimum !== undefined && minimum !== ''
  const hasMaximum = maximum !== null && maximum !== undefined && maximum !== ''
  const min = hasMinimum ? Number(minimum) : Number.NaN
  const max = hasMaximum ? Number(maximum) : Number.NaN
  if (!Number.isFinite(min) && !Number.isFinite(max)) return 'Budget not set'
  const number = new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 })
  if (!Number.isFinite(max)) return 'From RWF ' + number.format(min)
  if (!Number.isFinite(min)) return 'Up to RWF ' + number.format(max)
  return 'RWF ' + number.format(min) + ' - ' + number.format(max)
}

function ParentSkeleton({ rows = 3 }) {
  return <SkeletonLoader rows={rows} className="parent-dashboard-skeleton" />
}
function SectionHeading(props) {
  return <DashboardPanelHeading className="parent-panel-heading" {...props} />
}
function StudentCard({ item, bookings }) {
  const { student, booking_stats: bookingStats, learning_stats: learningStats, link } = item
  const studentBookings = bookings.filter((booking) => String(booking.student) === String(link.student))
  const nextBooking = studentBookings
    .filter((booking) => ['PENDING', 'CONFIRMED'].includes(booking.status))
    .sort((left, right) => String(left.start_datetime || '').localeCompare(String(right.start_datetime || '')))[0]
  const improvement = Number(learningStats.average_improvement || 0)
  const progress = Math.max(0, Math.min(100, improvement))
  const preferences = [
    student.prefers_online ? 'Online' : null,
    student.prefers_in_person ? 'In person' : null,
  ].filter(Boolean).join(' and ') || 'Learning mode not set'

  return (
    <article className="parent-student-overview-card">
      <header>
        <UserAvatar
          className="parent-student-avatar"
          src={student.profile_image_url}
          name={student.full_name || student.email}
          fallback="ST"
          alt=""
        />
        <div>
          <small>{link.label || (link.is_primary ? 'Primary student' : 'Linked student')}</small>
          <h3>{student.full_name || student.email}</h3>
          <p>{student.level || 'Level not set'} / {student.location || 'Location not set'}</p>
        </div>
        <span className={link.is_primary ? 'parent-link-status is-primary' : 'parent-link-status'}>
          {link.is_primary ? 'Primary' : 'Linked'}
        </span>
      </header>

      <dl className="parent-student-metrics">
        <div><dt>Bookings</dt><dd>{bookingStats.total_bookings || 0}</dd></div>
        <div><dt>Completed</dt><dd>{bookingStats.completed_bookings || 0}</dd></div>
        <div><dt>Outcomes</dt><dd>{learningStats.confirmed_results || 0}</dd></div>
        <div><dt>Improvement</dt><dd>{improvement.toFixed(1)}%</dd></div>
      </dl>

      <div className="parent-student-progress">
        <div><span>Confirmed learning improvement</span><strong>{improvement.toFixed(1)}%</strong></div>
        <div
          role="progressbar"
          aria-label={(student.full_name || 'Student') + ' learning improvement'}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={progress}
        >
          <span style={{ width: progress + '%' }} />
        </div>
      </div>

      <div className="parent-student-details">
        <div><span>Preferred learning</span><strong>{preferences}</strong></div>
        <div><span>Budget range</span><strong>{formatBudget(student.budget_min, student.budget_max)}</strong></div>
      </div>

      <div className="parent-student-next">
        <span><DashboardIcon name="bookings" /></span>
        <div>
          <small>{nextBooking ? 'Next lesson' : 'Schedule'}</small>
          <strong>
            {nextBooking
              ? (nextBooking.subject_name || 'Tutoring session') + ' with ' + (nextBooking.tutor_name || 'a tutor')
              : 'No upcoming lesson'}
          </strong>
        </div>
        <Link to={nextBooking ? '/bookings' : '/book?student=' + link.student}>{nextBooking ? 'View' : 'Book'}</Link>
      </div>
    </article>
  )
}

export function ParentDashboardPage() {
  const { user } = useAuth()
  const dashboardQuery = useQuery({
    queryKey: queryKeys.parents.dashboard,
    queryFn: () => getParentDashboard().then((response) => response.data),
    staleTime: 30_000,
  })
  const bookingsQuery = useBookingsQuery({ staleTime: 30_000 })

  const dashboard = dashboardQuery.data || {}
  const linkedStudents = Array.isArray(dashboard.linked_students) ? dashboard.linked_students : []
  const bookings = Array.isArray(bookingsQuery.data) ? bookingsQuery.data : []
  const summary = dashboard.summary || {}
  const upcomingBookings = bookings
    .filter((booking) => ['PENDING', 'CONFIRMED'].includes(booking.status))
    .sort((left, right) => String(left.start_datetime || '').localeCompare(String(right.start_datetime || '')))
  const completedBookings = linkedStudents.reduce(
    (total, item) => total + Number(item.booking_stats?.completed_bookings || 0),
    0,
  )
  const confirmedOutcomes = Number(summary.confirmed_learning_outcomes || 0)
  const averageImprovement = linkedStudents.length
    ? linkedStudents.reduce(
      (total, item) => total + Number(item.learning_stats?.average_improvement || 0),
      0,
    ) / linkedStudents.length
    : 0
  const profileName = dashboard.profile?.full_name || user?.first_name || user?.username || user?.email || 'Parent'
  const firstName = profileName.split(/\s|@/)[0]
  const failedQuery = [dashboardQuery, bookingsQuery].find((query) => query.isError)

  function refreshDashboard() {
    dashboardQuery.refetch()
    bookingsQuery.refetch()
  }

  return (
    <section className="parent-overview">
      <header className="parent-overview-header">
        <div>
          <p className="parent-overview-eyebrow">Parent workspace</p>
          <h1>Welcome back, {firstName}</h1>
          <p>Follow every linked student's lessons and outcomes from one clear family overview.</p>
        </div>
        <div className="parent-overview-actions">
          <Link className="secondary-button" to="/parent-students">Manage students</Link>
          <Link className="primary-button" to="/tutors">Find a tutor</Link>
        </div>
      </header>

      {failedQuery ? (
        <ErrorState
          className="parent-overview-error"
          title="Some family information could not be loaded."
          message={getApiErrorMessage(failedQuery.error)}
          onRetry={refreshDashboard}
          retryLabel="Refresh overview"
        />
      ) : null}

      <section className="parent-overview-stats" aria-label="Family learning summary">
        <DashboardStatCard icon={<DashboardIcon name="students" />} label="Linked students" value={dashboardQuery.isLoading ? '--' : summary.linked_students || 0} />
        <DashboardStatCard icon={<DashboardIcon name="bookings" />} label="Upcoming lessons" value={bookingsQuery.isLoading ? '--' : upcomingBookings.length} />
        <DashboardStatCard icon={<DashboardIcon name="verification" />} label="Completed bookings" value={dashboardQuery.isLoading ? '--' : completedBookings} />
        <DashboardStatCard icon={<DashboardIcon name="assessments" />} label="Confirmed outcomes" value={dashboardQuery.isLoading ? '--' : confirmedOutcomes} />
      </section>

      <div className="parent-overview-grid">
        <div className="parent-overview-main">
          <section className="parent-overview-panel">
            <SectionHeading eyebrow="Family schedule" title="Upcoming lessons" to="/bookings" action="View all" />
            {bookingsQuery.isLoading ? <ParentSkeleton /> : upcomingBookings.length ? (
              <div className="parent-booking-list">
                {upcomingBookings.slice(0, 4).map((booking) => {
                  const schedule = formatDateTime(booking.start_datetime)
                  return (
                    <article key={booking.id}>
                      <time dateTime={booking.start_datetime || undefined}><strong>{schedule.day}</strong><span>{schedule.month}</span></time>
                      <div>
                        <h3>{booking.subject_name || 'Tutoring session'}</h3>
                        <p>{booking.student_name || 'Student'} with {booking.tutor_name || 'Tutor'}</p>
                        <small>{schedule.detail} / {booking.mode === 'IN_PERSON' ? 'In person' : 'Online'}</small>
                      </div>
                      <span className={'parent-booking-status is-' + String(booking.status).toLowerCase()}>{formatStatus(booking.status)}</span>
                      <Link to={'/messages?booking=' + booking.id}>Message</Link>
                    </article>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                className="parent-panel-empty"
                icon={<DashboardIcon name="bookings" size={26} />}
                title="No upcoming family lessons"
                description="Find a verified tutor and request a lesson for a linked student."
                actionTo="/tutors"
                actionLabel="Find a tutor"
              />
            )}
          </section>

          <section className="parent-overview-panel">
            <SectionHeading eyebrow="Student progress" title="Linked students" to="/parent-students" action="Manage" />
            {dashboardQuery.isLoading ? <ParentSkeleton rows={4} /> : linkedStudents.length ? (
              <div className="parent-student-grid">
                {linkedStudents.map((item) => <StudentCard key={item.link.id} item={item} bookings={bookings} />)}
              </div>
            ) : (
              <div className="parent-panel-empty">
                <DashboardIcon name="students" size={26} />
                <h3>No students linked yet</h3>
                <p>Link an existing student account before requesting tutors or tracking outcomes.</p>
                <Link to="/parent-students">Link a student</Link>
              </div>
            )}
          </section>
        </div>

        <aside className="parent-overview-side" aria-label="Family learning actions">
          <section className="parent-overview-panel parent-outcomes-panel">
            <SectionHeading eyebrow="Learning impact" title="Family outcomes" to="/reports" action="Reports" />
            {dashboardQuery.isLoading ? <ParentSkeleton rows={2} /> : (
              <>
                <div className="parent-outcome-total"><strong>{averageImprovement.toFixed(1)}%</strong><span>average confirmed improvement</span></div>
                <dl>
                  <div><dt>Confirmed outcomes</dt><dd>{confirmedOutcomes}</dd></div>
                  <div><dt>Completed bookings</dt><dd>{completedBookings}</dd></div>
                  <div><dt>Students supported</dt><dd>{linkedStudents.length}</dd></div>
                </dl>
              </>
            )}
          </section>

          <section className="parent-overview-panel">
            <SectionHeading eyebrow="Quick access" title="Support your learners" />
            <nav className="parent-quick-links" aria-label="Parent shortcuts">
              <Link to="/tutors"><DashboardIcon name="search" /><span><strong>Find tutors</strong><small>Compare subjects, levels, and prices</small></span></Link>
              <Link to="/book"><DashboardIcon name="bookings" /><span><strong>Request a lesson</strong><small>Choose one of your linked students</small></span></Link>
              <Link to="/reports"><DashboardIcon name="reports" /><span><strong>Learning reports</strong><small>Review family learning outcomes</small></span></Link>
              <Link to="/messages"><DashboardIcon name="messages" /><span><strong>Messages</strong><small>Talk with your students' tutors</small></span></Link>
            </nav>
          </section>

          <section className="parent-affordability-card">
            <span><DashboardIcon name="verification" size={24} /></span>
            <div>
              <p>Affordable matching</p>
              <h2>Search within each student's budget.</h2>
              <span>Compare verified tutors by subject, level, lesson mode, and price before requesting a lesson.</span>
            </div>
            <Link to="/tutors">Compare tutors</Link>
          </section>
        </aside>
      </div>
    </section>
  )
}
