import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listCoursePurchases, listLessonProgress, listPayments } from '../api/services/payments'
import { updateLessonProgress } from '../api/services/payments'
import { useAuth } from '../context/AuthContext.jsx'

function SummaryCard({ label, value }) {
  return (
    <article className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function CoursePurchaseCard({ purchase }) {
  return (
    <article className="panel learning-card">
      <div className="review-head">
        <div>
          <p className="eyebrow">Purchased course</p>
          <h3>{purchase.course_title}</h3>
          <p className="supporting-text">{purchase.tutor_name || 'Tutor unavailable'}</p>
        </div>
        <span className="status-pill">{purchase.status}</span>
      </div>
      <div className="review-meta">
        <span>{purchase.amount} {purchase.currency}</span>
        <span>{purchase.purchased_at ? new Date(purchase.purchased_at).toLocaleDateString() : ''}</span>
      </div>
    </article>
  )
}

function ProgressCard({ progress }) {
  return (
    <article className="panel learning-card">
      <div className="review-head">
        <div>
          <p className="eyebrow">Lesson progress</p>
          <h3>{progress.lesson_title}</h3>
          <p className="supporting-text">Course #{progress.course}</p>
        </div>
        <span className="status-pill">{progress.is_completed ? 'Completed' : 'In progress'}</span>
      </div>
      <div className="review-meta">
        <span>{progress.watched_duration} minutes watched</span>
        <span>{progress.completed_at ? new Date(progress.completed_at).toLocaleDateString() : 'Not completed yet'}</span>
      </div>
    </article>
  )
}

export function LearningPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [progressForm, setProgressForm] = useState({ lesson_id: '', watched_duration: '', is_completed: false })
  const [message, setMessage] = useState('')

  const purchasesQuery = useQuery({
    queryKey: ['course-purchases'],
    queryFn: () => listCoursePurchases().then((response) => response.data),
    enabled: isAuthenticated && user?.role === 'STUDENT',
  })

  const progressQuery = useQuery({
    queryKey: ['lesson-progress'],
    queryFn: () => listLessonProgress().then((response) => response.data),
    enabled: isAuthenticated && user?.role === 'STUDENT',
  })

  const summaryQuery = useQuery({
    queryKey: ['student-payments-summary'],
    queryFn: () => listPayments().then((response) => response.data),
    enabled: isAuthenticated && user?.role === 'STUDENT',
  })

  const updateMutation = useMutation({
    mutationFn: (payload) => updateLessonProgress(payload),
    onSuccess: async () => {
      setProgressForm({ lesson_id: '', watched_duration: '', is_completed: false })
      setMessage('Lesson progress saved.')
      await queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
    },
    onError: (error) => {
      setMessage(error?.response?.data?.detail || 'Could not save lesson progress.')
    },
  })

  const purchases = Array.isArray(purchasesQuery.data) ? purchasesQuery.data : []
  const progressItems = Array.isArray(progressQuery.data) ? progressQuery.data : []
  const summary = useMemo(() => ({
    purchasesCount: purchases.length,
    progressCount: progressItems.length,
    completedCount: progressItems.filter((item) => item.is_completed).length,
  }), [purchases.length, progressItems])

  if (!isAuthenticated || user?.role !== 'STUDENT') {
    return (
      <section className="page-card card">
        <p className="eyebrow">Learning</p>
        <h1>Only student accounts can use learning progress.</h1>
        <p className="supporting-text">Sign in with a student account to view purchased courses and lesson progress.</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create account</Link>
        </div>
      </section>
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    updateMutation.mutate({
      lesson_id: Number(progressForm.lesson_id),
      watched_duration: Number(progressForm.watched_duration),
      is_completed: Boolean(progressForm.is_completed),
    })
  }

  return (
    <section className="learning-page">
      <section className="page-card card learning-hero">
        <div>
          <p className="eyebrow">Learning</p>
          <h1>Track what you buy and complete</h1>
          <p className="supporting-text">
            Review your paid courses, log lesson progress, and stay on top of your learning journey.
          </p>
        </div>

        <div className="learning-summary-grid">
          <SummaryCard label="Purchased courses" value={summary.purchasesCount} />
          <SummaryCard label="Tracked lessons" value={summary.progressCount} />
          <SummaryCard label="Completed lessons" value={summary.completedCount} />
        </div>
      </section>

      <section className="learning-layout">
        <div className="page-card card learning-panel">
          <p className="eyebrow">Update progress</p>
          <form className="learning-form" onSubmit={handleSubmit}>
            <label className="account-field">
              <span>Lesson ID</span>
              <input
                type="number"
                value={progressForm.lesson_id}
                onChange={(event) => setProgressForm((current) => ({ ...current, lesson_id: event.target.value }))}
                placeholder="Lesson ID"
                required
              />
            </label>
            <label className="account-field">
              <span>Watched duration</span>
              <input
                type="number"
                min="0"
                value={progressForm.watched_duration}
                onChange={(event) => setProgressForm((current) => ({ ...current, watched_duration: event.target.value }))}
                placeholder="Minutes watched"
                required
              />
            </label>
            <label className="account-check">
              <input
                type="checkbox"
                checked={progressForm.is_completed}
                onChange={() => setProgressForm((current) => ({ ...current, is_completed: !current.is_completed }))}
              />
              <span>Mark lesson as completed</span>
            </label>
            <button className="primary-button" type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save progress'}
            </button>
            <p className="account-status" aria-live="polite">{message || 'Use the lesson ID from the lesson you are studying.'}</p>
          </form>
        </div>

        <div className="learning-list-column">
          <section className="page-card card">
            <p className="eyebrow">Purchased courses</p>
            {purchasesQuery.isLoading ? (
              <p className="supporting-text">Loading purchases...</p>
            ) : purchases.length ? (
              <div className="learning-list">
                {purchases.map((purchase) => (
                  <CoursePurchaseCard key={purchase.id} purchase={purchase} />
                ))}
              </div>
            ) : (
              <p className="supporting-text">You have not purchased any courses yet.</p>
            )}
          </section>

          <section className="page-card card">
            <p className="eyebrow">Lesson progress</p>
            {progressQuery.isLoading ? (
              <p className="supporting-text">Loading progress...</p>
            ) : progressItems.length ? (
              <div className="learning-list">
                {progressItems.map((progress) => (
                  <ProgressCard key={progress.id} progress={progress} />
                ))}
              </div>
            ) : (
              <p className="supporting-text">No lesson progress recorded yet.</p>
            )}
          </section>
        </div>
      </section>
    </section>
  )
}
