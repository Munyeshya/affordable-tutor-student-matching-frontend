import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import { getTutorEarnings } from '../api/services/payments'
import { listBookingReviews, listLessonReviews } from '../api/services/reviews'
import { getTutorChecklist, getTutorDashboard } from '../api/services/tutors'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { queryKeys } from '../api/queryKeys'
import { DashboardPanelHeading, DashboardStatCard, EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useBookingsQuery } from '../hooks/useCommonQueries'
import './TutorDashboardPage.css'

function formatStatus(value) {
  if (!value) return 'Not started'
  return String(value)
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function formatMoney(value, currency = 'RWF') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return `${currency} 0`
  return `${currency} ${new Intl.NumberFormat('en-RW', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)}`
}

function formatDateTime(value) {
  if (!value) return 'Schedule pending'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Schedule pending'
  return new Intl.DateTimeFormat('en-RW', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatDate(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return new Intl.DateTimeFormat('en-RW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function OverviewSkeleton({ rows = 3 }) {
  return <SkeletonLoader rows={rows} className="tutor-overview-skeleton" />
}
function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`tutor-status tutor-status-${tone}`}>{children}</span>
}

function SectionHeading({ eyebrow, title, action, actionLabel }) {
  return (
    <DashboardPanelHeading
      className="tutor-panel-heading"
      eyebrow={eyebrow}
      title={title}
      to={action}
      action={actionLabel}
    />
  )
}
export function TutorDashboardPage() {
  const { user } = useAuth()

  const dashboardQuery = useQuery({
    queryKey: queryKeys.tutors.dashboard,
    queryFn: () => getTutorDashboard().then((response) => response.data),
    staleTime: 30_000,
  })
  const checklistQuery = useQuery({
    queryKey: queryKeys.tutors.checklist,
    queryFn: () => getTutorChecklist().then((response) => response.data),
    staleTime: 30_000,
  })
  const bookingsQuery = useBookingsQuery({ staleTime: 30_000 })
  const earningsQuery = useQuery({
    queryKey: queryKeys.payments.tutorEarnings,
    queryFn: () => getTutorEarnings().then((response) => response.data),
    staleTime: 30_000,
  })
  const bookingReviewsQuery = useQuery({
    queryKey: queryKeys.reviews.bookings,
    queryFn: () => listBookingReviews().then((response) => response.data),
    staleTime: 30_000,
  })
  const lessonReviewsQuery = useQuery({
    queryKey: queryKeys.reviews.lessons,
    queryFn: () => listLessonReviews().then((response) => response.data),
    staleTime: 30_000,
  })

  const dashboard = dashboardQuery.data || {}
  const checklist = checklistQuery.data || {}
  const bookings = bookingsQuery.data || []
  const earnings = earningsQuery.data || {}
  const bookingReviews = bookingReviewsQuery.data || []
  const lessonReviews = lessonReviewsQuery.data || []
  const reviews = [...bookingReviews, ...lessonReviews]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
  const upcomingBookings = bookings
    .filter((booking) => ['PENDING', 'CONFIRMED'].includes(booking.status))
    .sort((left, right) => String(left.start_datetime || '').localeCompare(String(right.start_datetime || '')))
    .slice(0, 3)
  const latestCourses = Array.isArray(dashboard.latest_courses) ? dashboard.latest_courses : []
  const courseStats = dashboard.course_stats || {}
  const lessonStats = dashboard.lesson_stats || {}
  const steps = Array.isArray(checklist.steps) ? checklist.steps : []
  const documentSummary = checklist.document_summary || dashboard.document_summary || {}
  const documentActions = Array.isArray(documentSummary.action_required)
    ? documentSummary.action_required
    : []
  const completion = dashboard.completion_percentage ?? checklist.completion_percentage ?? 0
  const completedSteps = steps.filter((step) => step.completed).length
  const reviewTotal = reviews.reduce((total, review) => total + Number(review.rating || 0), 0)
  const averageRating = reviews.length ? (reviewTotal / reviews.length).toFixed(1) : null
  const currency = dashboard.profile?.currency || 'RWF'
  const displayName = dashboard.profile?.full_name || user?.first_name || user?.username || 'Tutor'
  const firstName = displayName.split(' ')[0]

  const activities = [
    ...latestCourses.map((course) => ({
      key: `course-${course.id}`,
      date: course.updated_at,
      icon: 'courses',
      title: `Course ${formatStatus(course.status)}`,
      detail: course.title,
    })),
    ...bookings.slice(0, 5).map((booking) => ({
      key: `booking-${booking.id}`,
      date: booking.updated_at || booking.created_at,
      icon: 'bookings',
      title: `Booking ${formatStatus(booking.status)}`,
      detail: `${booking.subject_name || 'Lesson'} with ${booking.student_name || 'a student'}`,
    })),
    ...reviews.slice(0, 5).map((review) => ({
      key: `review-${review.lesson ? 'lesson' : 'booking'}-${review.id}`,
      date: review.created_at,
      icon: 'reviews',
      title: `New ${review.rating || 0}/5 review`,
      detail: review.lesson_title || `Feedback from ${review.student_name || 'a student'}`,
    })),
    ...(earnings.recent_payments || []).slice(0, 3).map((payment) => ({
      key: `payment-${payment.id}`,
      date: payment.paid_at || payment.created_at,
      icon: 'earnings',
      title: 'Payment received',
      detail: formatMoney(payment.amount, payment.currency || currency),
    })),
  ]
    .filter((activity) => activity.date)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 6)

  const overviewQueries = [dashboardQuery, checklistQuery, bookingsQuery, earningsQuery]
  const hasOverviewError = overviewQueries.some((query) => query.isError)
  const retryOverview = () => {
    overviewQueries.forEach((query) => query.refetch())
    bookingReviewsQuery.refetch()
    lessonReviewsQuery.refetch()
  }

  return (
    <section className="tutor-overview">
      <header className="tutor-overview-header">
        <div>
          <p className="tutor-overview-eyebrow">Tutor workspace</p>
          <h1>Welcome back, {firstName}</h1>
          <p>Manage your teaching work, verification, and income from one clear overview.</p>
        </div>
        <div className="tutor-overview-header-actions">
          <Link className="secondary-button" to="/tutor-documents">Verification</Link>
          <Link className="primary-button" to="/tutor-teaching">Create a course</Link>
        </div>
      </header>

      {hasOverviewError ? (
        <ErrorState
          className="tutor-overview-error"
          title="Some dashboard information could not be loaded."
          message={getApiErrorMessage(
            overviewQueries.find((query) => query.error)?.error,
            'Refresh the overview to try again.',
          )}
          onRetry={retryOverview}
          retryLabel="Refresh overview"
        />
      ) : null}

      <section className="tutor-overview-stats" aria-label="Tutor summary">
        <DashboardStatCard icon={<DashboardIcon name="bookings" />} iconClassName="tutor-stat-icon" label="Upcoming bookings" value={bookingsQuery.isLoading ? '--' : upcomingBookings.length} />
        <DashboardStatCard icon={<DashboardIcon name="courses" />} iconClassName="tutor-stat-icon" label="Published courses" value={dashboardQuery.isLoading ? '--' : courseStats.published_courses ?? 0} />
        <DashboardStatCard icon={<DashboardIcon name="earnings" />} iconClassName="tutor-stat-icon" label="Total earnings" value={earningsQuery.isLoading ? '--' : formatMoney(earnings.total_earnings, currency)} />
        <DashboardStatCard icon={<DashboardIcon name="reviews" />} iconClassName="tutor-stat-icon" label="Average rating" value={bookingReviewsQuery.isLoading || lessonReviewsQuery.isLoading ? '--' : averageRating ? averageRating + '/5' : 'New'} />
      </section>

      <section className="tutor-verification-overview" aria-labelledby="verification-progress-title">
        <div className="tutor-verification-copy">
          <span className="tutor-verification-icon"><DashboardIcon name="verification" size={24} /></span>
          <div>
            <p>Marketplace readiness</p>
            <h2 id="verification-progress-title">
              {dashboard.marketplace_ready ? 'Your profile is visible to students' : 'Complete your tutor verification'}
            </h2>
            <span>
              {checklistQuery.isLoading
                ? 'Checking your requirements...'
                : `${completedSteps} of ${steps.length || 5} approval steps complete`}
            </span>
          </div>
        </div>
        <div className="tutor-verification-progress">
          <div>
            <span>Profile progress</span>
            <strong>{completion}%</strong>
          </div>
          <div
            className="tutor-progress-track"
            role="progressbar"
            aria-label="Tutor verification progress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={completion}
          >
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>
        <Link to="/tutor-documents">Review requirements <span aria-hidden="true">-&gt;</span></Link>
      </section>

      <div className="tutor-workspace-grid">
        <div className="tutor-workspace-main">
          <section className="tutor-overview-panel">
            <SectionHeading eyebrow="Schedule" title="Upcoming bookings" action="/bookings" actionLabel="View all" />
            {bookingsQuery.isLoading ? (
              <OverviewSkeleton />
            ) : bookingsQuery.isError ? (
              <p className="tutor-panel-message">Bookings are temporarily unavailable.</p>
            ) : upcomingBookings.length ? (
              <div className="tutor-booking-list">
                {upcomingBookings.map((booking) => (
                  <article key={booking.id}>
                    <time dateTime={booking.start_datetime || undefined}>
                      <strong>{formatDateTime(booking.start_datetime).split(',')[0]}</strong>
                      <span>{formatDateTime(booking.start_datetime).split(',').slice(1).join(',').trim()}</span>
                    </time>
                    <div>
                      <h3>{booking.subject_name || 'Tutoring session'}</h3>
                      <p>{booking.student_name || 'Student'} / {booking.mode === 'IN_PERSON' ? 'In person' : 'Online'}</p>
                    </div>
                    <StatusBadge tone={booking.status === 'CONFIRMED' ? 'success' : 'warning'}>
                      {formatStatus(booking.status)}
                    </StatusBadge>
                    <Link to={`/messages?booking=${booking.id}`} aria-label={`Message ${booking.student_name || 'student'}`}>
                      Message
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                className="tutor-panel-empty"
                icon={<DashboardIcon name="bookings" size={26} />}
                title="No upcoming bookings"
                description="New student requests will appear here as soon as they arrive."
              />
            )}
          </section>

          <section className="tutor-overview-panel">
            <SectionHeading eyebrow="Teaching library" title="Courses and lessons" action="/tutor-teaching" actionLabel="Manage" />
            <div className="tutor-course-summary">
              <div><strong>{courseStats.total_courses ?? 0}</strong><span>Total courses</span></div>
              <div><strong>{courseStats.published_courses ?? 0}</strong><span>Published</span></div>
              <div><strong>{courseStats.pending_courses ?? 0}</strong><span>In review</span></div>
              <div><strong>{lessonStats.total_lessons ?? 0}</strong><span>Lessons</span></div>
            </div>
            {dashboardQuery.isLoading ? (
              <OverviewSkeleton rows={2} />
            ) : latestCourses.length ? (
              <div className="tutor-course-list">
                {latestCourses.slice(0, 4).map((course) => (
                  <article key={course.id}>
                    <span className="tutor-course-mark"><DashboardIcon name="courses" /></span>
                    <div><h3>{course.title}</h3><p>{course.subject__name || 'General subject'} / Updated {formatDate(course.updated_at)}</p></div>
                    <StatusBadge tone={course.status === 'PUBLISHED' ? 'success' : course.status === 'REJECTED' ? 'danger' : 'neutral'}>
                      {formatStatus(course.status)}
                    </StatusBadge>
                  </article>
                ))}
              </div>
            ) : (
              <div className="tutor-panel-empty tutor-panel-empty-compact">
                <h3>Build your first course</h3>
                <p>Organize lessons by subject and topic, then submit the course for review.</p>
                <Link to="/tutor-teaching">Open teaching workspace</Link>
              </div>
            )}
          </section>

          <section className="tutor-overview-panel">
            <SectionHeading eyebrow="Latest updates" title="Recent activity" />
            {activities.length ? (
              <ol className="tutor-activity-list">
                {activities.map((activity) => (
                  <li key={activity.key}>
                    <span><DashboardIcon name={activity.icon} /></span>
                    <div><strong>{activity.title}</strong><p>{activity.detail}</p></div>
                    <time dateTime={activity.date}>{formatDate(activity.date)}</time>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="tutor-panel-empty tutor-panel-empty-compact">
                <h3>Your activity starts here</h3>
                <p>Course updates, bookings, payments, and reviews will appear in this timeline.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="tutor-workspace-side" aria-label="Tutor account details">
          <section className="tutor-overview-panel">
            <SectionHeading eyebrow="Approval" title="Documents and agreement" action="/tutor-documents" actionLabel="Open" />
            {checklistQuery.isLoading ? (
              <OverviewSkeleton />
            ) : (
              <div className="tutor-requirement-list">
                <div>
                  <span><DashboardIcon name="documents" /></span>
                  <div><strong>Identity and qualification</strong><small>{checklist.documents_count ?? 0} document(s) uploaded</small></div>
                  <StatusBadge tone={documentActions.length ? 'warning' : 'success'}>{documentActions.length ? 'Action needed' : 'Submitted'}</StatusBadge>
                </div>
                <div>
                  <span><DashboardIcon name="verification" /></span>
                  <div><strong>Integrity agreement</strong><small>Signed agreement upload</small></div>
                  <StatusBadge tone={checklist.agreement_signed ? 'success' : 'warning'}>{checklist.agreement_signed ? 'Signed' : 'Required'}</StatusBadge>
                </div>
                <div>
                  <span><DashboardIcon name="verification" /></span>
                  <div><strong>Admin approval</strong><small>Final marketplace review</small></div>
                  <StatusBadge tone={dashboard.marketplace_ready ? 'success' : 'neutral'}>{formatStatus(checklist.verification_status)}</StatusBadge>
                </div>
              </div>
            )}
            {documentActions.length ? (
              <div className="tutor-document-notice">
                <strong>{documentActions.length} document action{documentActions.length === 1 ? '' : 's'} required</strong>
                <p>{documentActions[0].message || `${formatStatus(documentActions[0].doc_type)} needs attention.`}</p>
              </div>
            ) : null}
          </section>

          <section className="tutor-overview-panel tutor-earnings-panel">
            <SectionHeading eyebrow="Income" title="Earnings" action="/tutor-earnings" actionLabel="Details" />
            {earningsQuery.isLoading ? (
              <OverviewSkeleton rows={2} />
            ) : earningsQuery.isError ? (
              <p className="tutor-panel-message">Earnings are temporarily unavailable.</p>
            ) : (
              <>
                <div className="tutor-balance">
                  <span>Available balance</span>
                  <strong>{formatMoney(earnings.available_balance, currency)}</strong>
                </div>
                <dl className="tutor-earning-breakdown">
                  <div><dt>Booking revenue</dt><dd>{formatMoney(earnings.booking_revenue, currency)}</dd></div>
                  <div><dt>Course revenue</dt><dd>{formatMoney(earnings.course_revenue, currency)}</dd></div>
                  <div><dt>Pending payouts</dt><dd>{formatMoney(earnings.pending_payouts, currency)}</dd></div>
                </dl>
              </>
            )}
          </section>

          <section className="tutor-overview-panel">
            <SectionHeading eyebrow="Trust" title="Recent reviews" action="/reviews" actionLabel="View all" />
            {bookingReviewsQuery.isLoading || lessonReviewsQuery.isLoading ? (
              <OverviewSkeleton rows={2} />
            ) : bookingReviewsQuery.isError || lessonReviewsQuery.isError ? (
              <p className="tutor-panel-message">Reviews are temporarily unavailable.</p>
            ) : reviews.length ? (
              <>
                <div className="tutor-rating-summary">
                  <strong>{averageRating}</strong>
                  <div><span aria-label={`${averageRating} out of 5`}>*****</span><small>{reviews.length} review{reviews.length === 1 ? '' : 's'}</small></div>
                </div>
                <div className="tutor-review-list">
                  {reviews.slice(0, 2).map((review) => (
                    <blockquote key={`${review.lesson ? 'lesson' : 'booking'}-${review.id}`}>
                      <p>{review.comment || 'The student left a rating without a written comment.'}</p>
                      <footer>{review.student_name || 'Student'} / {review.rating}/5</footer>
                    </blockquote>
                  ))}
                </div>
              </>
            ) : (
              <div className="tutor-panel-empty tutor-panel-empty-compact">
                <h3>No reviews yet</h3>
                <p>Feedback will appear after students complete their lessons.</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}
