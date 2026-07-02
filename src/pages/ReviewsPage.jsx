import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import { createBookingReview, createLessonReview, listBookingReviews, listLessonReviews } from '../api/services/reviews'

function ReviewCard({ item, kind }) {
  return (
    <article className="panel review-card">
      <div className="review-head">
        <div>
          <p className="eyebrow">{kind}</p>
          <h3>{kind === 'Booking review' ? item.tutor_name : item.lesson_title}</h3>
          <p className="supporting-text">{item.comment || 'No comment provided.'}</p>
        </div>
        <span className="status-pill">{item.rating}/5</span>
      </div>
      <div className="review-meta">
        <span>{item.student_name || 'Student'}</span>
        <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
      </div>
    </article>
  )
}

function ReviewForm({ title, fields, onSubmit, busy, cta }) {
  return (
    <form className="page-card card review-form" onSubmit={onSubmit}>
      <p className="eyebrow">{title}</p>
      {fields}
      <button className="primary-button" type="submit" disabled={busy}>
        {busy ? 'Saving...' : cta}
      </button>
    </form>
  )
}

export function ReviewsPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('bookings')
  const [bookingForm, setBookingForm] = useState({ booking_id: '', rating: 5, comment: '' })
  const [lessonForm, setLessonForm] = useState({ lesson_id: '', rating: 5, comment: '' })

  const bookingReviewsQuery = useQuery({
    queryKey: ['booking-reviews'],
    queryFn: () => listBookingReviews().then((response) => response.data),
    enabled: isAuthenticated,
  })

  const lessonReviewsQuery = useQuery({
    queryKey: ['lesson-reviews'],
    queryFn: () => listLessonReviews().then((response) => response.data),
    enabled: isAuthenticated,
  })

  const bookingCreateMutation = useMutation({
    mutationFn: createBookingReview,
    onSuccess: async () => {
      setBookingForm({ booking_id: '', rating: 5, comment: '' })
      await queryClient.invalidateQueries({ queryKey: ['booking-reviews'] })
    },
  })

  const lessonCreateMutation = useMutation({
    mutationFn: createLessonReview,
    onSuccess: async () => {
      setLessonForm({ lesson_id: '', rating: 5, comment: '' })
      await queryClient.invalidateQueries({ queryKey: ['lesson-reviews'] })
    },
  })

  const canReview = user?.role === 'STUDENT'
  const bookingReviews = bookingReviewsQuery.data || []
  const lessonReviews = lessonReviewsQuery.data || []

  const reviewStats = useMemo(() => ({
    bookingCount: bookingReviews.length,
    lessonCount: lessonReviews.length,
  }), [bookingReviews.length, lessonReviews.length])

  if (!isAuthenticated) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Reviews</p>
        <h1>Sign in to see and write reviews</h1>
        <p className="supporting-text">Booking and lesson feedback is available to signed-in users.</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Join now</Link>
        </div>
      </section>
    )
  }

  function handleBookingSubmit(event) {
    event.preventDefault()
    bookingCreateMutation.mutate({
      booking_id: Number(bookingForm.booking_id),
      rating: Number(bookingForm.rating),
      comment: bookingForm.comment,
    })
  }

  function handleLessonSubmit(event) {
    event.preventDefault()
    lessonCreateMutation.mutate({
      lesson_id: Number(lessonForm.lesson_id),
      rating: Number(lessonForm.rating),
      comment: lessonForm.comment,
    })
  }

  return (
    <section className="reviews-page">
      <section className="page-card card reviews-hero">
        <div>
          <p className="eyebrow">Reviews</p>
          <h1>Share and read lesson feedback</h1>
          <p className="supporting-text">
            Keep booking reviews and lesson reviews in one place so students can learn from each completed session.
          </p>
        </div>

        <div className="reviews-summary">
          <article className="stat-card">
            <strong>{reviewStats.bookingCount}</strong>
            <span>Booking reviews</span>
          </article>
          <article className="stat-card">
            <strong>{reviewStats.lessonCount}</strong>
            <span>Lesson reviews</span>
          </article>
        </div>
      </section>

      <div className="reviews-tabs">
        <button className={`tab-button ${activeTab === 'bookings' ? 'is-active' : ''}`} type="button" onClick={() => setActiveTab('bookings')}>Booking reviews</button>
        <button className={`tab-button ${activeTab === 'lessons' ? 'is-active' : ''}`} type="button" onClick={() => setActiveTab('lessons')}>Lesson reviews</button>
      </div>

      {canReview ? (
        <section className="reviews-forms-grid">
          <ReviewForm
            title="Add booking review"
            cta="Save booking review"
            busy={bookingCreateMutation.isPending}
            onSubmit={handleBookingSubmit}
            fields={(
              <>
                <label className="account-field">
                  <span>Booking ID</span>
                  <input type="number" value={bookingForm.booking_id} onChange={(event) => setBookingForm((current) => ({ ...current, booking_id: event.target.value }))} required />
                </label>
                <label className="account-field">
                  <span>Rating</span>
                  <input type="number" min="1" max="5" value={bookingForm.rating} onChange={(event) => setBookingForm((current) => ({ ...current, rating: event.target.value }))} required />
                </label>
                <label className="account-field account-field-wide">
                  <span>Comment</span>
                  <textarea rows="4" value={bookingForm.comment} onChange={(event) => setBookingForm((current) => ({ ...current, comment: event.target.value }))} />
                </label>
              </>
            )}
          />

          <ReviewForm
            title="Add lesson review"
            cta="Save lesson review"
            busy={lessonCreateMutation.isPending}
            onSubmit={handleLessonSubmit}
            fields={(
              <>
                <label className="account-field">
                  <span>Lesson ID</span>
                  <input type="number" value={lessonForm.lesson_id} onChange={(event) => setLessonForm((current) => ({ ...current, lesson_id: event.target.value }))} required />
                </label>
                <label className="account-field">
                  <span>Rating</span>
                  <input type="number" min="1" max="5" value={lessonForm.rating} onChange={(event) => setLessonForm((current) => ({ ...current, rating: event.target.value }))} required />
                </label>
                <label className="account-field account-field-wide">
                  <span>Comment</span>
                  <textarea rows="4" value={lessonForm.comment} onChange={(event) => setLessonForm((current) => ({ ...current, comment: event.target.value }))} />
                </label>
              </>
            )}
          />
        </section>
      ) : (
        <section className="page-card card">
          <p className="eyebrow">Reviews</p>
          <h2>Students can create reviews after completed sessions</h2>
          <p className="supporting-text">
            You can still read existing reviews, but only student accounts can post new ones.
          </p>
        </section>
      )}

      <section className="reviews-list-grid">
        {activeTab === 'bookings' ? (
          bookingReviewsQuery.isLoading ? (
            <article className="page-card card"><p className="supporting-text">Loading booking reviews...</p></article>
          ) : bookingReviews.length ? bookingReviews.map((item) => <ReviewCard key={item.id} item={item} kind="Booking review" />) : (
            <article className="page-card card"><p className="supporting-text">No booking reviews yet.</p></article>
          )
        ) : lessonReviewsQuery.isLoading ? (
          <article className="page-card card"><p className="supporting-text">Loading lesson reviews...</p></article>
        ) : lessonReviews.length ? lessonReviews.map((item) => <ReviewCard key={item.id} item={item} kind="Lesson review" />) : (
          <article className="page-card card"><p className="supporting-text">No lesson reviews yet.</p></article>
        )}
      </section>
    </section>
  )
}
