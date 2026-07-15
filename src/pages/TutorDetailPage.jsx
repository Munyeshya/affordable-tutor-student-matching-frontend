import React from 'react'
import { queryKeys } from '../api/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/errors'
import { getTutor } from '../api/services/tutors'
import { useAuth } from '../context/AuthContext.jsx'

function formatMoney(value, currency = 'RWF', suffix = '') {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return 'Price on request'
  }

  return `${currency} ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)}${suffix}`
}

function formatLabel(value) {
  if (!value) {
    return 'Not specified'
  }

  const label = String(value).replaceAll('_', ' ').toLowerCase()
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatRating(value) {
  const rating = Number(value)
  return Number.isFinite(rating) ? rating.toFixed(1) : 'New'
}

function formatDateTime(value) {
  if (!value) {
    return 'Time to be arranged'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Time to be arranged'
  }

  return new Intl.DateTimeFormat('en-RW', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getInitials(name = '') {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  return initials.toUpperCase() || 'IT'
}

function getMarketplaceReturnPath(value) {
  if (typeof value === 'string' && (value === '/tutors' || value.startsWith('/tutors?'))) {
    return value
  }

  return '/tutors'
}
function ProfileSkeleton() {
  return (
    <div className="tutor-detail-page" aria-busy="true" aria-label="Loading tutor profile">
      <section className="tutor-detail-hero tutor-detail-skeleton">
        <div className="skeleton tutor-detail-avatar-skeleton" />
        <div className="tutor-detail-skeleton-copy">
          <div className="skeleton skeleton-line skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" />
        </div>
      </section>
      <section className="tutor-detail-layout">
        <div className="tutor-detail-main">
          <div className="skeleton tutor-detail-block-skeleton" />
          <div className="skeleton tutor-detail-block-skeleton" />
        </div>
        <div className="skeleton tutor-detail-aside-skeleton" />
      </section>
    </div>
  )
}

function Rating({ value, count, compact = false, showCount = true }) {
  return (
    <span className={compact ? 'tutor-rating tutor-rating-compact' : 'tutor-rating'}>
      <span aria-hidden="true">Rating</span>
      <strong>{formatRating(value)}</strong>
      {showCount ? <span>{count ? `(${count})` : 'No reviews yet'}</span> : null}
    </span>
  )
}

export function TutorDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const marketplaceReturnPath = getMarketplaceReturnPath(location.state?.fromMarketplace)

  const tutorQuery = useQuery({
    queryKey: queryKeys.tutors.detail(id),
    queryFn: async () => (await getTutor(id)).data,
    enabled: Boolean(id),
  })

  if (tutorQuery.isLoading) {
    return <ProfileSkeleton />
  }

  if (tutorQuery.isError || !tutorQuery.data) {
    return (
      <section className="tutor-detail-state card">
        <p className="eyebrow">Tutor profile</p>
        <h1>We could not open this tutor profile.</h1>
        <p className="supporting-text">{getApiErrorMessage(tutorQuery.error)}</p>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={() => tutorQuery.refetch()}>
            Try again
          </button>
          <Link className="secondary-button" to={marketplaceReturnPath}>Back to tutors</Link>
        </div>
      </section>
    )
  }

  const tutor = tutorQuery.data
  const courses = Array.isArray(tutor.courses) ? tutor.courses : []
  const reviews = Array.isArray(tutor.reviews) ? tutor.reviews : []
  const availability = Array.isArray(tutor.upcoming_availability)
    ? tutor.upcoming_availability
    : []
  const subjectLevels = Array.isArray(tutor.subject_levels) ? tutor.subject_levels : []
  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : []
  const lowestCoursePrice = courses.reduce((lowest, course) => {
    const price = Number(course.price)
    if (!Number.isFinite(price)) return lowest
    return lowest === null || price < lowest ? price : lowest
  }, null)
  const canBook = !isAuthenticated || user?.role === 'STUDENT' || user?.role === 'PARENT'
  const baseBookingPath = `/book?tutor=${tutor.user_id}&profile=${tutor.id}`
  const bookingLabel = isAuthenticated ? 'Request a lesson' : 'Sign in to request'

  return (
    <div className="tutor-detail-page">
      <nav className="tutor-detail-breadcrumb" aria-label="Breadcrumb">
        <Link to={marketplaceReturnPath}>Tutors</Link>
        <span aria-hidden="true">/</span>
        <span>{tutor.full_name}</span>
      </nav>

      <section className="tutor-detail-hero">
        <div className="tutor-detail-avatar">
          {tutor.profile_image_url ? (
            <img src={tutor.profile_image_url} alt={`${tutor.full_name} profile`} />
          ) : (
            <span>{getInitials(tutor.full_name)}</span>
          )}
        </div>

        <div className="tutor-detail-identity">
          <div className="tutor-detail-title-row">
            <div>
              <p className="eyebrow">Verified tutor</p>
              <h1>{tutor.full_name}</h1>
            </div>
            <span className="tutor-verified-badge">Document verified</span>
          </div>
          <p className="tutor-detail-headline">
            {tutor.headline || 'Committed to clear, supportive, and affordable learning.'}
          </p>
          <div className="tutor-detail-meta">
            <Rating value={tutor.average_rating} count={tutor.review_count} />
            <span>{tutor.location || 'Location flexible'}</span>
            <span>
              {[tutor.teaches_online && 'Online', tutor.teaches_in_person && 'In person']
                .filter(Boolean)
                .join(' and ') || 'Teaching mode arranged with tutor'}
            </span>
          </div>
          <div className="tutor-detail-chips">
            {subjectLevels.map((item) => (
              <span className="trust-mark" key={`${item.subject}-${item.level}`}>
                {item.subject} - {formatLabel(item.level)}
              </span>
            ))}
            {subjectLevels.length === 0 && subjects.map((subject) => (
              <span className="trust-mark" key={subject}>{subject}</span>
            ))}
            {subjectLevels.length === 0 && subjects.length === 0 ? (
              <span className="trust-mark">Subjects arranged with tutor</span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="tutor-detail-layout">
        <div className="tutor-detail-main">
          <article className="tutor-detail-section">
            <p className="eyebrow">About</p>
            <h2>Meet {tutor.full_name.split(' ')[0]}.</h2>
            <p className="supporting-text tutor-detail-bio">
              {tutor.bio || 'This tutor is building their public introduction. Explore their approved subjects, courses, and available lesson times below.'}
            </p>
          </article>

          <article className="tutor-detail-section">
            <div className="tutor-detail-section-heading">
              <div>
                <p className="eyebrow">Courses and lessons</p>
                <h2>Choose the learning focus that fits.</h2>
              </div>
              <span className="soft-chip">{courses.length} course{courses.length === 1 ? '' : 's'}</span>
            </div>

            {courses.length === 0 ? (
              <p className="tutor-detail-empty">No public courses have been added yet.</p>
            ) : (
              <div className="tutor-course-list">
                {courses.map((course) => {
                  const lessons = Array.isArray(course.lessons) ? course.lessons : []
                  const courseBookingPath = `${baseBookingPath}&subject=${course.subject}`

                  return (
                    <article className="tutor-course-card" key={course.id}>
                      <div className="tutor-course-overview">
                        {course.thumbnail_url ? (
                          <img className="tutor-course-thumbnail" loading="lazy" src={course.thumbnail_url} alt="" />
                        ) : null}
                        <div className="tutor-course-content">
                          <div className="tutor-course-heading">
                            <div>
                              <span className="tutor-course-subject">{course.subject_name}</span>
                              <h3>{course.title}</h3>
                              <p>{formatLabel(course.academic_level)}</p>
                            </div>
                            <strong>{formatMoney(course.price, course.currency, ' / course')}</strong>
                          </div>
                          {course.description ? <p className="supporting-text">{course.description}</p> : null}
                          {canBook ? (
                            <Link className="link-button tutor-course-action" to={courseBookingPath}>
                              Request a lesson in {course.subject_name}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      <div className="tutor-lesson-list">
                        {lessons.map((lesson) => (
                          <div className="tutor-lesson-row" key={lesson.id}>
                            <div>
                              <span className="tutor-lesson-number">{lesson.order_number}</span>
                              <div>
                                <strong>{lesson.title}</strong>
                                <span>{lesson.topic || 'General topic'} / {lesson.duration} min</span>
                              </div>
                            </div>
                            <Rating
                              compact
                              value={lesson.average_rating}
                              count={lesson.review_count}
                            />
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </article>

          <article className="tutor-detail-section">
            <div className="tutor-detail-section-heading">
              <div>
                <p className="eyebrow">Availability</p>
                <h2>Upcoming lesson times.</h2>
              </div>
              <span className="soft-chip">{availability.length} open</span>
            </div>

            {availability.length === 0 ? (
              <p className="tutor-detail-empty">No open times are published. You can still request a suitable time.</p>
            ) : (
              <div className="tutor-slot-list">
                {availability.map((slot) => (
                  <article className="tutor-slot-row" key={slot.id}>
                    <div>
                      <strong>{formatDateTime(slot.start_datetime)}</strong>
                      <span>Until {formatDateTime(slot.end_datetime)} / {formatLabel(slot.mode)}</span>
                    </div>
                    {canBook ? (
                      <Link
                        className="secondary-button"
                        to={`${baseBookingPath}&slot=${slot.id}&mode=${slot.mode}`}
                      >
                        Choose time
                      </Link>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="tutor-detail-section">
            <div className="tutor-detail-section-heading">
              <div>
                <p className="eyebrow">Student feedback</p>
                <h2>Recent lesson experiences.</h2>
              </div>
              <Rating value={tutor.average_rating} count={tutor.review_count} compact />
            </div>

            {reviews.length === 0 ? (
              <p className="tutor-detail-empty">This tutor has not received public feedback yet.</p>
            ) : (
              <div className="tutor-review-grid">
                {reviews.map((review) => (
                  <blockquote className="tutor-review-card" key={review.id}>
                    <Rating value={review.rating} compact showCount={false} />
                    <p>{review.comment || 'A positive lesson experience.'}</p>
                    <footer>
                      <strong>{review.student_name}</strong>
                      <span>{formatDateTime(review.created_at)}</span>
                    </footer>
                  </blockquote>
                ))}
              </div>
            )}
          </article>
        </div>

        <aside className="tutor-booking-card">
          <p className="eyebrow">Affordable learning</p>
          <h2>{formatMoney(tutor.hourly_rate, tutor.currency, ' / hour')}</h2>
          {lowestCoursePrice !== null ? (
            <p>Courses from {formatMoney(lowestCoursePrice, tutor.currency)}.</p>
          ) : (
            <p>Agree on the right lesson plan before confirming.</p>
          )}
          <div className="tutor-booking-facts">
            <div>
              <span>Next opening</span>
              <strong>{formatDateTime(tutor.availability_summary?.next_available_at)}</strong>
            </div>
            <div>
              <span>Available modes</span>
              <strong>
                {[tutor.teaches_online && 'Online', tutor.teaches_in_person && 'In person']
                  .filter(Boolean)
                  .join(', ') || 'Ask tutor'}
              </strong>
            </div>
            <div>
              <span>Verification</span>
              <strong>Approved by Isomo</strong>
            </div>
          </div>
          {canBook ? (
            <Link className="primary-button tutor-booking-button" to={baseBookingPath}>
              {bookingLabel}
            </Link>
          ) : (
            <p className="tutor-detail-role-note">Booking requests are available to students and parents.</p>
          )}
          <Link className="secondary-button tutor-booking-button" to={marketplaceReturnPath}>
            Compare tutors
          </Link>
          <small>No payment is taken when you send a request.</small>
        </aside>
      </section>
    </div>
  )
}
