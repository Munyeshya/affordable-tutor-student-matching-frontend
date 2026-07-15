import React, { useState } from 'react'
import { queryKeys } from '../api/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/errors'
import {
  createBookingReview,
  createLessonReview,
  listBookingReviews,
  listEligibleReviews,
  listLessonReviews,
} from '../api/services/reviews'
import { useAuth } from '../context/AuthContext.jsx'
import './ReviewsPage.css'

const RATING_OPTIONS = [
  { value: 1, label: 'Poor' },
  { value: 2, label: 'Fair' },
  { value: 3, label: 'Good' },
  { value: 4, label: 'Very good' },
  { value: 5, label: 'Excellent' },
]

function formatDate(value) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-RW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function ReviewSkeleton() {
  return (
    <div className="review-skeleton" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  )
}

function EmptyState({ kind }) {
  const isBooking = kind === 'bookings'
  return (
    <div className="review-empty">
      <span className="review-empty-mark">{isBooking ? '01' : '02'}</span>
      <div>
        <h3>No {isBooking ? 'sessions' : 'lessons'} waiting for feedback</h3>
        <p>
          {isBooking
            ? 'A completed tutoring session will appear here automatically.'
            : 'Finish a lesson from a purchased course and it will appear here.'}
        </p>
      </div>
      <Link className="review-text-link" to={isBooking ? '/bookings' : '/courses'}>
        {isBooking ? 'View bookings' : 'Browse courses'}
      </Link>
    </div>
  )
}

function ReviewHistoryCard({ item, kind }) {
  const isBooking = kind === 'bookings'
  return (
    <article className="review-history-card">
      <div className="review-score" aria-label={`${item.rating} out of 5`}>
        <strong>{item.rating}</strong>
        <span>/ 5</span>
      </div>
      <div className="review-history-copy">
        <span>{isBooking ? 'Tutoring session' : 'Course lesson'}</span>
        <h3>{isBooking ? item.tutor_name : item.lesson_title}</h3>
        <p>{item.comment || 'No written comment was added.'}</p>
      </div>
      <time dateTime={item.created_at || undefined}>{formatDate(item.created_at)}</time>
    </article>
  )
}

export function ReviewsPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const requestedBooking = searchParams.get('booking') || ''
  const requestedLesson = searchParams.get('lesson') || ''
  const [activeKind, setActiveKind] = useState(requestedLesson ? 'lessons' : 'bookings')
  const [selectedId, setSelectedId] = useState(requestedLesson || requestedBooking)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const canReview = user?.role === 'STUDENT'

  const eligibleQuery = useQuery({
    queryKey: queryKeys.reviews.eligible,
    queryFn: listEligibleReviews,
    enabled: isAuthenticated && canReview,
  })
  const bookingReviewsQuery = useQuery({
    queryKey: queryKeys.reviews.bookings,
    queryFn: () => listBookingReviews().then((response) => response.data),
    enabled: isAuthenticated,
  })
  const lessonReviewsQuery = useQuery({
    queryKey: queryKeys.reviews.lessons,
    queryFn: () => listLessonReviews().then((response) => response.data),
    enabled: isAuthenticated,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ kind, payload }) => (
      kind === 'bookings' ? createBookingReview(payload) : createLessonReview(payload)
    ),
    onSuccess: async (_, variables) => {
      toast.success('Your review has been published.')
      setSelectedId('')
      setRating(5)
      setComment('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews.eligible }),
        queryClient.invalidateQueries({
          queryKey: variables.kind === 'bookings' ? queryKeys.reviews.bookings : queryKeys.reviews.lessons,
        }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not publish your review.')),
  })

  if (!isAuthenticated) {
    return (
      <section className="review-signin">
        <p className="eyebrow">Reviews</p>
        <h1>Your feedback starts after the lesson</h1>
        <p>Sign in to review completed tutoring sessions and course lessons.</p>
        <div>
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create account</Link>
        </div>
      </section>
    )
  }

  const eligible = eligibleQuery.data || { bookings: [], lessons: [] }
  const options = eligible[activeKind] || []
  const selectedItem = options.find((item) => String(item.id) === String(selectedId))
  const history = activeKind === 'bookings'
    ? (bookingReviewsQuery.data || [])
    : (lessonReviewsQuery.data || [])
  const historyQuery = activeKind === 'bookings' ? bookingReviewsQuery : lessonReviewsQuery
  const bookingCount = bookingReviewsQuery.data?.length || 0
  const lessonCount = lessonReviewsQuery.data?.length || 0

  function changeKind(kind) {
    setActiveKind(kind)
    setSelectedId('')
    setRating(5)
    setComment('')
  }

  function submitReview(event) {
    event.preventDefault()
    if (!selectedItem) {
      toast.error(`Choose a completed ${activeKind === 'bookings' ? 'session' : 'lesson'} first.`)
      return
    }

    reviewMutation.mutate({
      kind: activeKind,
      payload: {
        [activeKind === 'bookings' ? 'booking_id' : 'lesson_id']: selectedItem.id,
        rating,
        comment: comment.trim(),
      },
    })
  }

  return (
    <section className="review-workflow">
      <header className="review-page-header">
        <div>
          <p className="eyebrow">Student feedback</p>
          <h1>Review your learning experience</h1>
          <p>Only completed sessions and lessons are available, keeping every review useful and trustworthy.</p>
        </div>
        <dl className="review-totals">
          <div><dt>Session reviews</dt><dd>{bookingCount}</dd></div>
          <div><dt>Lesson reviews</dt><dd>{lessonCount}</dd></div>
        </dl>
      </header>

      <nav className="review-kind-switch" aria-label="Review type">
        <button
          type="button"
          className={activeKind === 'bookings' ? 'is-active' : ''}
          onClick={() => changeKind('bookings')}
        >
          Sessions
          {canReview && <span>{eligible.bookings.length} ready</span>}
        </button>
        <button
          type="button"
          className={activeKind === 'lessons' ? 'is-active' : ''}
          onClick={() => changeKind('lessons')}
        >
          Course lessons
          {canReview && <span>{eligible.lessons.length} ready</span>}
        </button>
      </nav>

      {canReview ? (
        <section className="review-compose-section" aria-labelledby="compose-review-title">
          <div className="review-section-heading">
            <div>
              <span>01</span>
              <div>
                <h2 id="compose-review-title">Write a review</h2>
                <p>Select one completed item, rate it, and share what helped.</p>
              </div>
            </div>
            <p>Reviews are public on the tutor's profile.</p>
          </div>

          {eligibleQuery.isLoading ? (
            <ReviewSkeleton />
          ) : eligibleQuery.isError ? (
            <div className="review-query-error" role="alert">
              <div>
                <h3>We could not load review options</h3>
                <p>{getApiErrorMessage(eligibleQuery.error)}</p>
              </div>
              <button type="button" onClick={() => eligibleQuery.refetch()}>Try again</button>
            </div>
          ) : options.length === 0 ? (
            <EmptyState kind={activeKind} />
          ) : (
            <form className="review-compose" onSubmit={submitReview}>
              <div className="review-compose-main">
                <label className="review-field" htmlFor="review-item">
                  <span>{activeKind === 'bookings' ? 'Completed session' : 'Completed lesson'}</span>
                  <select
                    id="review-item"
                    value={selectedItem ? selectedId : ''}
                    onChange={(event) => setSelectedId(event.target.value)}
                    required
                  >
                    <option value="">Choose one</option>
                    {options.map((item) => (
                      <option key={item.id} value={item.id}>
                        {activeKind === 'bookings'
                          ? `${item.subject_name} with ${item.tutor_name} - ${formatDate(item.end_datetime)}`
                          : `${item.lesson_title} - ${item.course_title}`}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedItem && (
                  <div className="review-selection-summary">
                    <span>{activeKind === 'bookings' ? selectedItem.mode.replace('_', ' ') : selectedItem.topic || 'Course lesson'}</span>
                    <strong>{activeKind === 'bookings' ? selectedItem.subject_name : selectedItem.lesson_title}</strong>
                    <p>
                      {selectedItem.tutor_name} / {activeKind === 'bookings'
                        ? formatDate(selectedItem.end_datetime)
                        : selectedItem.course_title}
                    </p>
                  </div>
                )}

                <fieldset className="review-rating-field">
                  <legend>Your rating</legend>
                  <div className="review-rating-options">
                    {RATING_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={rating === option.value ? 'is-selected' : ''}
                        aria-pressed={rating === option.value}
                        onClick={() => setRating(option.value)}
                      >
                        <strong>{option.value}</strong>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="review-comment-panel">
                <label htmlFor="review-comment">
                  <span>Comment <small>Optional</small></span>
                  <textarea
                    id="review-comment"
                    rows="7"
                    maxLength="600"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="What worked well? What should another student know?"
                  />
                </label>
                <div className="review-submit-row">
                  <span>{comment.length}/600</span>
                  <button type="submit" disabled={!selectedItem || reviewMutation.isPending}>
                    {reviewMutation.isPending ? 'Publishing...' : 'Publish review'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      ) : (
        <section className="review-role-note">
          <span>01</span>
          <div>
            <h2>Student reviews build trust</h2>
            <p>Your account can read feedback below. Only students can review completed learning experiences.</p>
          </div>
        </section>
      )}

      <section className="review-history-section" aria-labelledby="review-history-title">
        <div className="review-section-heading">
          <div>
            <span>02</span>
            <div>
              <h2 id="review-history-title">{canReview ? 'Your published reviews' : 'Published reviews'}</h2>
              <p>{history.length} {activeKind === 'bookings' ? 'session' : 'lesson'} review{history.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        </div>

        {historyQuery.isLoading ? (
          <div className="review-history-list"><ReviewSkeleton /><ReviewSkeleton /></div>
        ) : historyQuery.isError ? (
          <div className="review-query-error" role="alert">
            <div><h3>Review history is unavailable</h3><p>{getApiErrorMessage(historyQuery.error)}</p></div>
            <button type="button" onClick={() => historyQuery.refetch()}>Try again</button>
          </div>
        ) : history.length ? (
          <div className="review-history-list">
            {history.map((item) => <ReviewHistoryCard key={item.id} item={item} kind={activeKind} />)}
          </div>
        ) : (
          <div className="review-history-empty">No published {activeKind === 'bookings' ? 'session' : 'lesson'} reviews yet.</div>
        )}
      </section>
    </section>
  )
}