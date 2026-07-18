import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import { listAssessments, listAssessmentAttempts } from '../api/services/assessments'
import { listPayments } from '../api/services/payments'
import { listEligibleReviews } from '../api/services/reviews'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { queryKeys } from '../api/queryKeys'
import { DashboardPanelHeading, DashboardStatCard, EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useBookingsQuery, useLearningLibraryQuery } from '../hooks/useCommonQueries'
import './StudentDashboardPage.css'

function formatStatus(value) {
  if (!value) return 'Not started'
  return String(value).toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function formatDateTime(value) {
  if (!value) return { day: '--', month: 'TBD', time: 'Schedule pending' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { day: '--', month: 'TBD', time: 'Schedule pending' }
  return {
    day: new Intl.DateTimeFormat('en-RW', { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat('en-RW', { month: 'short' }).format(date),
    time: new Intl.DateTimeFormat('en-RW', { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(date),
  }
}

function formatMoney(value, currency = 'RWF') {
  return `${new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 }).format(Number(value || 0))} ${currency}`
}

function DashboardSkeleton({ rows = 3 }) {
  return <SkeletonLoader rows={rows} className="student-dashboard-skeleton" />
}
function SectionHeading(props) {
  return <DashboardPanelHeading className="student-panel-heading" {...props} />
}
export function StudentDashboardPage() {
  const { user } = useAuth()
  const libraryQuery = useLearningLibraryQuery({ staleTime: 30_000 })
  const bookingsQuery = useBookingsQuery({ staleTime: 30_000 })
  const assessmentsQuery = useQuery({
    queryKey: queryKeys.assessments.list,
    queryFn: () => listAssessments().then((response) => response.data),
    staleTime: 30_000,
  })
  const attemptsQuery = useQuery({
    queryKey: queryKeys.assessments.attempts,
    queryFn: () => listAssessmentAttempts().then((response) => response.data),
    staleTime: 30_000,
  })
  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews.eligible,
    queryFn: listEligibleReviews,
    staleTime: 30_000,
  })
  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments.bookings,
    queryFn: () => listPayments().then((response) => response.data),
    staleTime: 30_000,
  })

  const courses = Array.isArray(libraryQuery.data) ? libraryQuery.data : []
  const bookings = Array.isArray(bookingsQuery.data) ? bookingsQuery.data : []
  const assessments = Array.isArray(assessmentsQuery.data) ? assessmentsQuery.data : []
  const attempts = Array.isArray(attemptsQuery.data) ? attemptsQuery.data : []
  const eligibleReviews = reviewsQuery.data || {}
  const payments = Array.isArray(paymentsQuery.data) ? paymentsQuery.data : []
  const paymentsByBooking = new Map(payments.map((payment) => [String(payment.booking_id), payment]))
  const outstandingBookings = bookings.filter((booking) => (
    ['CONFIRMED', 'COMPLETED'].includes(booking.status)
    && !['PAID', 'REFUNDED'].includes(paymentsByBooking.get(String(booking.id))?.status)
  ))
  const outstandingTotal = outstandingBookings.reduce(
    (total, booking) => total + Number(booking.total_amount || 0),
    0,
  )
  const recentPayments = payments.filter((payment) => payment.status === 'PAID').slice(0, 2)
  const attemptedIds = new Set(attempts.map((attempt) => Number(attempt.assessment)))
  const pendingAssessments = assessments.filter((assessment) => !attemptedIds.has(Number(assessment.id)))
  const upcomingBookings = bookings
    .filter((booking) => ['PENDING', 'CONFIRMED'].includes(booking.status))
    .sort((left, right) => String(left.start_datetime || '').localeCompare(String(right.start_datetime || '')))
  const totalLessons = courses.reduce((total, course) => total + Number(course.total_lessons || 0), 0)
  const completedLessons = courses.reduce((total, course) => total + Number(course.completed_lessons || 0), 0)
  const activeCourses = courses.filter((course) => Number(course.progress_percent || 0) < 100)
  const activeCourse = activeCourses[0] || courses[0]
  const nextLesson = activeCourse?.lessons?.find((lesson) => !lesson.progress?.is_completed) || activeCourse?.lessons?.[0]
  const reviewCount = (eligibleReviews.bookings?.length || 0) + (eligibleReviews.lessons?.length || 0)
  const firstName = (user?.first_name || user?.username || user?.email || 'Student').split(/\s|@/)[0]
  const overviewQueries = [libraryQuery, bookingsQuery, assessmentsQuery, attemptsQuery, reviewsQuery, paymentsQuery]
  const failedQuery = overviewQueries.find((query) => query.isError)

  function refreshDashboard() {
    overviewQueries.forEach((query) => query.refetch())
  }

  return (
    <section className="student-overview">
      <header className="student-overview-header">
        <div>
          <p className="student-overview-eyebrow">Student workspace</p>
          <h1>Welcome back, {firstName}</h1>
          <p>Continue learning, prepare for your next lesson, and find support that fits your budget.</p>
        </div>
        <div className="student-overview-actions">
          <Link className="secondary-button" to="/courses">Browse courses</Link>
          <Link className="primary-button" to="/tutors">Find a tutor</Link>
        </div>
      </header>

      {failedQuery ? (
        <ErrorState
          className="student-overview-error"
          title="Some dashboard information could not be loaded."
          message={getApiErrorMessage(failedQuery.error)}
          onRetry={refreshDashboard}
          retryLabel="Refresh overview"
        />
      ) : null}

      <section className="student-overview-stats" aria-label="Student learning summary">
        <DashboardStatCard icon={<DashboardIcon name="bookings" />} label="Upcoming lessons" value={bookingsQuery.isLoading ? '--' : upcomingBookings.length} />
        <DashboardStatCard icon={<DashboardIcon name="courses" />} label="Active courses" value={libraryQuery.isLoading ? '--' : activeCourses.length} />
        <DashboardStatCard icon={<DashboardIcon name="verification" />} label="Lessons completed" value={libraryQuery.isLoading ? '--' : completedLessons + '/' + totalLessons} />
        <DashboardStatCard icon={<DashboardIcon name="assessments" />} label="Assessments to take" value={assessmentsQuery.isLoading || attemptsQuery.isLoading ? '--' : pendingAssessments.length} />
      </section>

      <div className="student-overview-grid">
        <div className="student-overview-main">
          <section className="student-overview-panel student-continue-panel">
            <SectionHeading eyebrow="My learning" title="Continue learning" to="/learning" action="Open library" />
            {libraryQuery.isLoading ? <DashboardSkeleton rows={3} /> : activeCourse ? (
              <div className="student-current-course">
                <div className="student-course-mark">{activeCourse.subject_name?.slice(0, 2).toUpperCase() || 'IS'}</div>
                <div className="student-current-course-copy">
                  <span>{activeCourse.subject_name || 'Course'} / {activeCourse.academic_level || 'All levels'}</span>
                  <h3>{activeCourse.title}</h3>
                  <p>With {activeCourse.tutor_name || 'your tutor'}</p>
                  <div className="student-progress-label"><span>{activeCourse.completed_lessons || 0} of {activeCourse.total_lessons || 0} lessons</span><strong>{activeCourse.progress_percent || 0}%</strong></div>
                  <progress value={activeCourse.progress_percent || 0} max="100">{activeCourse.progress_percent || 0}%</progress>
                </div>
                <div className="student-current-course-action">
                  <span>{nextLesson ? 'Up next' : 'Course progress'}</span>
                  <strong>{nextLesson?.title || 'Review completed lessons'}</strong>
                  <Link to={`/learning?course=${activeCourse.course_id}${nextLesson ? `&lesson=${nextLesson.id}` : ''}`}>{nextLesson ? 'Continue lesson' : 'Open course'}</Link>
                </div>
              </div>
            ) : (
              <EmptyState
                className="student-panel-empty"
                icon={<DashboardIcon name="courses" size={26} />}
                title="Your learning library is ready"
                description="Choose an affordable course from a verified tutor to begin tracking your progress."
                actionTo="/courses"
                actionLabel="Browse courses"
              />
            )}
          </section>

          <section className="student-overview-panel">
            <SectionHeading eyebrow="Schedule" title="Upcoming lessons" to="/bookings" action="View all" />
            {bookingsQuery.isLoading ? <DashboardSkeleton /> : upcomingBookings.length ? (
              <div className="student-booking-list">
                {upcomingBookings.slice(0, 4).map((booking) => {
                  const schedule = formatDateTime(booking.start_datetime)
                  return (
                    <article key={booking.id}>
                      <time dateTime={booking.start_datetime || undefined}><strong>{schedule.day}</strong><span>{schedule.month}</span></time>
                      <div><h3>{booking.subject_name || 'Tutoring session'}</h3><p>{booking.tutor_name || 'Tutor'} / {booking.mode === 'IN_PERSON' ? 'In person' : 'Online'}</p><small>{schedule.time}</small></div>
                      <span className={`student-booking-status is-${String(booking.status).toLowerCase()}`}>{formatStatus(booking.status)}</span>
                      <Link to={`/messages?booking=${booking.id}`}>Message</Link>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="student-panel-empty student-panel-empty-compact">
                <h3>No upcoming lessons</h3>
                <p>Search by subject, topic, level, and price to find the right tutor.</p>
                <Link to="/tutors">Find a tutor</Link>
              </div>
            )}
          </section>

          <section className="student-overview-panel">
            <SectionHeading eyebrow="Course library" title="Your courses" to="/learning" action="View all" />
            {libraryQuery.isLoading ? <DashboardSkeleton /> : courses.length ? (
              <div className="student-course-list">
                {courses.slice(0, 4).map((course) => (
                  <Link key={course.id} to={`/learning?course=${course.course_id}`}>
                    <span>{course.subject_name?.slice(0, 2).toUpperCase() || 'IS'}</span>
                    <div><strong>{course.title}</strong><small>{course.subject_name || 'Course'} / {course.completed_lessons || 0} of {course.total_lessons || 0} lessons</small></div>
                    <b>{course.progress_percent || 0}%</b>
                  </Link>
                ))}
              </div>
            ) : <p className="student-panel-message">Purchased courses will appear here.</p>}
          </section>
        </div>

        <aside className="student-overview-side" aria-label="Student actions and progress">
          <section className="student-overview-panel">
            <SectionHeading eyebrow="Next steps" title="Needs your attention" />
            {assessmentsQuery.isLoading || attemptsQuery.isLoading || reviewsQuery.isLoading || paymentsQuery.isLoading ? <DashboardSkeleton rows={3} /> : (
              <div className="student-action-list">
                <Link to="/payments"><span><DashboardIcon name="payments" /></span><div><strong>{outstandingBookings.length} payment{outstandingBookings.length === 1 ? '' : 's'} due</strong><small>{outstandingBookings.length ? `${formatMoney(outstandingTotal)} for confirmed lessons.` : 'No confirmed lesson payments are due.'}</small></div><b aria-hidden="true">-&gt;</b></Link>
                <Link to="/assessments"><span><DashboardIcon name="assessments" /></span><div><strong>{pendingAssessments.length} assessment{pendingAssessments.length === 1 ? '' : 's'}</strong><small>Check your knowledge before or after lessons.</small></div><b aria-hidden="true">-&gt;</b></Link>
                <Link to="/reviews"><span><DashboardIcon name="reviews" /></span><div><strong>{reviewCount} review{reviewCount === 1 ? '' : 's'} pending</strong><small>Share feedback after completed learning.</small></div><b aria-hidden="true">-&gt;</b></Link>
              </div>
            )}
          </section>

          <section className="student-overview-panel student-payment-panel">
            <SectionHeading eyebrow="Payments" title="Recent activity" to="/payments" action="View payments" />
            {paymentsQuery.isLoading ? <DashboardSkeleton rows={2} /> : recentPayments.length ? (
              <div className="student-payment-list">
                {recentPayments.map((payment) => (
                  <div key={payment.id}>
                    <span><DashboardIcon name="verification" /></span>
                    <div><strong>{payment.learner_name || 'Lesson payment'}</strong><small>Booking #{payment.booking_id}</small></div>
                    <b>{formatMoney(payment.amount, payment.currency)}</b>
                  </div>
                ))}
              </div>
            ) : <p className="student-panel-message">Completed lesson payments will appear here.</p>}
          </section>

          <section className="student-overview-panel student-progress-panel">
            <SectionHeading eyebrow="Progress" title="Learning completion" />
            {libraryQuery.isLoading ? <DashboardSkeleton rows={2} /> : (
              <>
                <div className="student-progress-total"><strong>{totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0}%</strong><span>of purchased lessons completed</span></div>
                <dl><div><dt>Courses</dt><dd>{courses.length}</dd></div><div><dt>Lessons complete</dt><dd>{completedLessons}</dd></div><div><dt>Assessment attempts</dt><dd>{attempts.length}</dd></div></dl>
              </>
            )}
          </section>

          <section className="student-overview-panel">
            <SectionHeading eyebrow="Quick access" title="Keep moving" />
            <nav className="student-quick-links" aria-label="Student shortcuts">
              <Link to="/tutors"><DashboardIcon name="search" /><span><strong>Find tutors</strong><small>Compare topics and prices</small></span></Link>
              <Link to="/tutors"><DashboardIcon name="search" /><span><strong>Request a lesson</strong><small>Choose a tutor and send your learning needs</small></span></Link>
              <Link to="/messages"><DashboardIcon name="messages" /><span><strong>Messages</strong><small>Talk with your tutors</small></span></Link>
              <Link to="/payments"><DashboardIcon name="payments" /><span><strong>Payments</strong><small>Pay lessons and print receipts</small></span></Link>
            </nav>
          </section>
        </aside>
      </div>
    </section>
  )
}
