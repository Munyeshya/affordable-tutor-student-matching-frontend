import React, { useState } from 'react'
import { queryKeys } from '../api/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/errors'
import { getTutor } from '../api/services/tutors'
import { InlineIcon } from '../components/ui/InlineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const AVAILABILITY_SLOTS_PER_PAGE = 4

function formatMoney(value, currency = 'RWF', suffix = '') {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return 'Price on request'
  }
  const currencyCode = currency || 'RWF'

  return `${new Intl.NumberFormat('en-RW', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)} ${currencyCode}${suffix}`
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

function formatCalendarDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { key: String(value), weekday: 'Date', day: '--', month: 'TBA' }
  }

  return {
    key: getDateKey(date),
    weekday: new Intl.DateTimeFormat('en-RW', { weekday: 'long' }).format(date),
    day: new Intl.DateTimeFormat('en-RW', { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat('en-RW', { month: 'short' }).format(date),
  }
}

function getDateKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthDate(monthKey) {
  const [year, month] = String(monthKey).split('-').map(Number)
  if (!year || !month) return new Date()
  return new Date(year, month - 1, 1)
}

function getCalendarDays(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: firstWeekday }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function formatSelectedDate(dateKey) {
  if (!dateKey) return 'Select a date'
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('en-RW', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time to arrange'

  return new Intl.DateTimeFormat('en-RW', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function groupAvailabilityByDay(slots) {
  const groups = new Map()

  slots
    .slice()
    .sort((first, second) => new Date(first.start_datetime) - new Date(second.start_datetime))
    .forEach((slot) => {
      const date = formatCalendarDate(slot.start_datetime)
      if (!groups.has(date.key)) {
        groups.set(date.key, { ...date, slots: [] })
      }
      groups.get(date.key).slots.push(slot)
    })

  return Array.from(groups.values())
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
  const rating = Number(value)
  const roundedRating = Number.isFinite(rating) ? Math.round(rating) : 0

  return (
    <span
      className={compact ? 'tutor-rating tutor-rating-compact' : 'tutor-rating'}
      aria-label={Number.isFinite(rating) ? `${rating.toFixed(1)} out of 5` : 'No ratings yet'}
    >
      <span className="tutor-rating-stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <InlineIcon key={star} name="star" className={star <= roundedRating ? 'is-active' : ''} />
        ))}
      </span>
      <strong>{formatRating(value)}</strong>
      {showCount ? <span>{count ? `(${count})` : 'No reviews yet'}</span> : null}
    </span>
  )
}

export function TutorDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState('')
  const [visibleCalendarMonth, setVisibleCalendarMonth] = useState('')
  const [availabilitySlotPage, setAvailabilitySlotPage] = useState(1)
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
  const availabilityDays = groupAvailabilityByDay(availability)
  const availabilityByDate = new Map(availabilityDays.map((day) => [day.key, day]))
  const defaultAvailabilityDate = availabilityDays[0]?.key || getDateKey(new Date())
  const activeAvailabilityDate = selectedAvailabilityDate || defaultAvailabilityDate
  const activeAvailabilityDay = availabilityByDate.get(activeAvailabilityDate)
  const activeAvailabilitySlots = activeAvailabilityDay?.slots || []
  const availabilitySlotPageCount = Math.max(
    1,
    Math.ceil(activeAvailabilitySlots.length / AVAILABILITY_SLOTS_PER_PAGE),
  )
  const activeAvailabilitySlotPage = Math.min(availabilitySlotPage, availabilitySlotPageCount)
  const visibleAvailabilitySlots = activeAvailabilitySlots.slice(
    (activeAvailabilitySlotPage - 1) * AVAILABILITY_SLOTS_PER_PAGE,
    activeAvailabilitySlotPage * AVAILABILITY_SLOTS_PER_PAGE,
  )
  const firstVisibleSlotNumber = activeAvailabilitySlots.length
    ? ((activeAvailabilitySlotPage - 1) * AVAILABILITY_SLOTS_PER_PAGE) + 1
    : 0
  const lastVisibleSlotNumber = Math.min(
    activeAvailabilitySlotPage * AVAILABILITY_SLOTS_PER_PAGE,
    activeAvailabilitySlots.length,
  )
  const defaultCalendarMonth = getMonthKey(availability[0]?.start_datetime || new Date())
  const activeCalendarMonth = visibleCalendarMonth || defaultCalendarMonth
  const activeCalendarMonthDate = getMonthDate(activeCalendarMonth)
  const calendarDays = getCalendarDays(activeCalendarMonthDate)
  const todayKey = getDateKey(new Date())
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

  function changeCalendarMonth(offset) {
    const nextMonth = new Date(
      activeCalendarMonthDate.getFullYear(),
      activeCalendarMonthDate.getMonth() + offset,
      1,
    )
    setVisibleCalendarMonth(getMonthKey(nextMonth))
    setSelectedAvailabilityDate(getDateKey(nextMonth))
    setAvailabilitySlotPage(1)
  }

  function selectCalendarDate(date) {
    setSelectedAvailabilityDate(getDateKey(date))
    setAvailabilitySlotPage(1)
  }

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
            <span className="tutor-verified-badge"><InlineIcon name="verified" /> Document verified</span>
          </div>
          <p className="tutor-detail-headline">
            {tutor.headline || 'Committed to clear, supportive, and affordable learning.'}
          </p>
          <div className="tutor-detail-meta">
            <Rating value={tutor.average_rating} count={tutor.review_count} />
            <span><InlineIcon name="location" /> {tutor.location || 'Location flexible'}</span>
            <span>
              <InlineIcon name="teaching" />{' '}
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

          {(tutor.education_level || tutor.teaching_experience) ? (
            <article className="tutor-detail-section">
              <p className="eyebrow">Qualifications</p>
              <h2>Education and teaching experience.</h2>
              <div className="tutor-credentials-grid">
                <div>
                  <span>Education</span>
                  <strong>{tutor.education_level || 'Verified qualification documents supplied'}</strong>
                </div>
                <div>
                  <span>Experience</span>
                  <p>{tutor.teaching_experience || 'Experience details available from the tutor.'}</p>
                </div>
              </div>
            </article>
          ) : null}

          <article className="tutor-detail-section tutor-courses-section">
            <div className="tutor-detail-section-heading">
              <div>
                <p className="eyebrow"><InlineIcon name="book" /> Courses and lessons</p>
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
                  const hasThumbnail = Boolean(course.thumbnail_url)

                  return (
                    <article className="tutor-course-card" key={course.id}>
                      <div className={`tutor-course-overview${hasThumbnail ? '' : ' tutor-course-overview-no-image'}`}>
                        {hasThumbnail ? (
                          <img className="tutor-course-thumbnail" loading="lazy" src={course.thumbnail_url} alt="" />
                        ) : null}
                        <div className="tutor-course-content">
                          <div className="tutor-course-heading">
                            <div>
                              <span className="tutor-course-subject">{course.subject_name}</span>
                              <h3>{course.title}</h3>
                              <p>{formatLabel(course.academic_level)}</p>
                            </div>
                            <strong className="tutor-course-price">{formatMoney(course.price, course.currency, ' / course')}</strong>
                          </div>
                          {course.description ? <p className="supporting-text">{course.description}</p> : null}
                          {canBook ? (
                            <Link className="link-button tutor-course-action" to={courseBookingPath}>
                              <InlineIcon name="calendar" /> Request lesson
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
                <p className="eyebrow"><InlineIcon name="calendar" /> Availability</p>
                <h2>Upcoming lesson times.</h2>
              </div>
              <span className="soft-chip">{availability.length} open across {availabilityDays.length} day{availabilityDays.length === 1 ? '' : 's'}</span>
            </div>

            {availability.length === 0 ? (
              <p className="tutor-detail-empty">No open times are published. You can still request a suitable time.</p>
            ) : (
              <div className="tutor-availability-calendar">
                <div className="tutor-calendar-toolbar">
                  <span><InlineIcon name="calendar" /> Select a date and time</span>
                  <small>Times are shown in your local timezone.</small>
                </div>
                <div className="tutor-availability-layout">
                  <section className="tutor-selected-day" aria-live="polite">
                    <div className="tutor-selected-day-heading">
                      <div>
                        <p className="eyebrow">Selected date</p>
                        <h3>{formatSelectedDate(activeAvailabilityDate)}</h3>
                      </div>
                      <span>
                        {activeAvailabilityDay
                          ? `${activeAvailabilityDay.slots.length} open`
                          : 'No openings'}
                      </span>
                    </div>

                    {activeAvailabilityDay ? (
                      <div>
                        <div className="tutor-calendar-slots">
                          {visibleAvailabilitySlots.map((slot) => {
                            const slotContent = (
                              <>
                                <span className="tutor-calendar-time">
                                  <InlineIcon name="clock" />
                                  <strong>{formatTime(slot.start_datetime)} - {formatTime(slot.end_datetime)}</strong>
                                </span>
                                <span className="tutor-calendar-mode">{formatLabel(slot.mode)}</span>
                                {canBook ? <span className="tutor-calendar-choose">Choose</span> : null}
                              </>
                            )

                            return canBook ? (
                              <Link
                                className="tutor-calendar-slot"
                                key={slot.id}
                                to={`${baseBookingPath}&slot=${slot.id}&mode=${slot.mode}`}
                                aria-label={`Choose ${formatSelectedDate(activeAvailabilityDate)} from ${formatTime(slot.start_datetime)} to ${formatTime(slot.end_datetime)}, ${formatLabel(slot.mode)}`}
                              >
                                {slotContent}
                              </Link>
                            ) : (
                              <div className="tutor-calendar-slot" key={slot.id}>{slotContent}</div>
                            )
                          })}
                        </div>

                        {availabilitySlotPageCount > 1 ? (
                          <nav className="tutor-slot-pagination" aria-label="Available lesson time pages">
                            <button
                              type="button"
                              disabled={activeAvailabilitySlotPage === 1}
                              onClick={() => setAvailabilitySlotPage((page) => Math.max(1, page - 1))}
                            >
                              <InlineIcon name="arrow" className="is-reversed" />
                              Previous
                            </button>
                            <span>
                              {firstVisibleSlotNumber}-{lastVisibleSlotNumber} of {activeAvailabilitySlots.length}
                            </span>
                            <button
                              type="button"
                              disabled={activeAvailabilitySlotPage === availabilitySlotPageCount}
                              onClick={() => setAvailabilitySlotPage((page) => Math.min(availabilitySlotPageCount, page + 1))}
                            >
                              Next
                              <InlineIcon name="arrow" />
                            </button>
                          </nav>
                        ) : null}
                      </div>
                    ) : (
                      <div className="tutor-calendar-empty">
                        <InlineIcon name="calendar" size={24} />
                        <h4>No available lesson times</h4>
                        <p>This tutor has not published an open slot for this date. Choose a highlighted date or send a general lesson request.</p>
                        {canBook ? <Link to={baseBookingPath}>Request another time</Link> : null}
                      </div>
                    )}
                  </section>

                  <section className="tutor-month-calendar" aria-label="Tutor availability calendar">
                    <header>
                      <button type="button" onClick={() => changeCalendarMonth(-1)} aria-label="Previous month">
                        <InlineIcon name="arrow" className="is-reversed" />
                      </button>
                      <h3>{new Intl.DateTimeFormat('en-RW', { month: 'long', year: 'numeric' }).format(activeCalendarMonthDate)}</h3>
                      <button type="button" onClick={() => changeCalendarMonth(1)} aria-label="Next month">
                        <InlineIcon name="arrow" />
                      </button>
                    </header>
                    <div className="tutor-calendar-weekdays" aria-hidden="true">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => <span key={weekday}>{weekday}</span>)}
                    </div>
                    <div className="tutor-calendar-grid">
                      {calendarDays.map((date, index) => {
                        if (!date) return <span className="tutor-calendar-blank" key={`blank-${index}`} />

                        const dateKey = getDateKey(date)
                        const availableDay = availabilityByDate.get(dateKey)
                        const isSelected = dateKey === activeAvailabilityDate
                        const isToday = dateKey === todayKey
                        const dateLabel = new Intl.DateTimeFormat('en-RW', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }).format(date)
                        const availabilityLabel = availableDay
                          ? `${availableDay.slots.length} available lesson time${availableDay.slots.length === 1 ? '' : 's'}`
                          : 'no available lesson times'

                        return (
                          <button
                            className={[
                              'tutor-calendar-cell',
                              availableDay ? 'has-availability' : '',
                              isSelected ? 'is-selected' : '',
                              isToday ? 'is-today' : '',
                            ].filter(Boolean).join(' ')}
                            type="button"
                            key={dateKey}
                            aria-pressed={isSelected}
                            aria-label={`${dateLabel}, ${availabilityLabel}`}
                            onClick={() => selectCalendarDate(date)}
                          >
                            <span>{date.getDate()}</span>
                            {availableDay ? <i aria-hidden="true">{availableDay.slots.length}</i> : null}
                          </button>
                        )
                      })}
                    </div>
                    <footer>
                      <span><i className="is-available" /> Available date</span>
                      <span><i className="is-selected" /> Selected date</span>
                    </footer>
                  </section>
                </div>
              </div>
            )}
          </article>

          <article className="tutor-detail-section">
            <div className="tutor-detail-section-heading">
              <div>
                <p className="eyebrow"><InlineIcon name="star" /> Student feedback</p>
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
            <>
              <Link className="primary-button tutor-booking-button" to={baseBookingPath}>
                <InlineIcon name="calendar" /> {bookingLabel}
              </Link>
              <Link className="secondary-button tutor-booking-button" to={`/tutors/${tutor.id}/propose`}>
                <InlineIcon name="calendar" /> Propose a custom schedule
              </Link>
            </>
          ) : (
            <p className="tutor-detail-role-note">Booking requests are available to students and parents.</p>
          )}
          <Link className="secondary-button tutor-booking-button" to={marketplaceReturnPath}>
            <InlineIcon name="arrow" className="is-reversed" /> Compare tutors
          </Link>
          <small>No payment is taken when you send a request.</small>
        </aside>
      </section>
    </div>
  )
}
