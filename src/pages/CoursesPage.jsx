import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listPublicCourses } from '../api/services/catalog'
import { createCoursePurchase } from '../api/services/payments'
import { useAuth } from '../context/AuthContext.jsx'

function CourseCard({ course, onPurchase, busy, canPurchase }) {
  const previewLessons = Array.isArray(course.lessons) ? course.lessons : []

  return (
    <article className="panel course-card">
      <div className="course-card-head">
        <div>
          <p className="eyebrow">{course.subject_name || 'Course'}</p>
          <h3>{course.title}</h3>
          <p className="supporting-text">{course.description || 'No description available.'}</p>
        </div>
        <span className="status-pill">{course.price} RWF</span>
      </div>

      <div className="course-meta-grid">
        <span><strong>Tutor:</strong> {course.tutor_name || 'Unknown'}</span>
        <span><strong>Level:</strong> {course.academic_level || 'Not set'}</span>
        <span><strong>Preview lessons:</strong> {previewLessons.length}</span>
      </div>

      {previewLessons.length ? (
        <div className="course-preview-list">
          {previewLessons.slice(0, 3).map((lesson) => (
            <div className="course-preview-row" key={lesson.id}>
              <strong>{lesson.title}</strong>
              <span>{lesson.topic || 'Topic not set'}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="supporting-text">No preview lessons published yet.</p>
      )}

      <div className="hero-actions">
        <Link className="secondary-button" to={`/tutors?q=${encodeURIComponent(course.tutor_name || '')}`}>
          View tutor
        </Link>
        {canPurchase ? (
          <button className="primary-button" type="button" onClick={() => onPurchase(course.id)} disabled={busy}>
            {busy ? 'Purchasing...' : 'Buy course'}
          </button>
        ) : null}
      </div>
    </article>
  )
}

export function CoursesPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ q: '', subject: '', topic: '', min_price: '', max_price: '', sort: 'price_low' })
  const [message, setMessage] = useState('')

  const coursesQuery = useQuery({
    queryKey: ['public-courses', filters],
    queryFn: () => listPublicCourses(filters).then((response) => response.data),
  })

  const purchaseMutation = useMutation({
    mutationFn: createCoursePurchase,
    onSuccess: async () => {
      setMessage('Course purchased successfully.')
      await queryClient.invalidateQueries({ queryKey: ['public-courses'] })
      await queryClient.invalidateQueries({ queryKey: ['course-purchases'] })
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      setMessage(error?.response?.data?.detail || 'Could not purchase the course right now.')
    },
  })

  const courses = Array.isArray(coursesQuery.data) ? coursesQuery.data : []
  const canPurchase = isAuthenticated && user?.role === 'STUDENT'

  const visibleCount = useMemo(() => courses.length, [courses])

  function handleFilterChange(name, value) {
    setMessage('')
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function handlePurchase(courseId) {
    setMessage('')
    purchaseMutation.mutate({ course_id: courseId, provider: 'SIMULATED', transaction_reference: '' })
  }

  return (
    <section className="courses-page">
      <section className="page-card card courses-hero">
        <div>
          <p className="eyebrow">Courses</p>
          <h1>Affordable courses from verified tutors</h1>
          <p className="supporting-text">
            Browse course bundles by topic, subject, and level. Preview lessons before you buy.
          </p>
        </div>

        <div className="courses-summary">
          <article className="stat-card">
            <strong>{visibleCount}</strong>
            <span>Courses visible</span>
          </article>
          <article className="stat-card">
            <strong>Preview</strong>
            <span>Free lesson snippets</span>
          </article>
        </div>
      </section>

      <section className="page-card card courses-filters">
        <p className="eyebrow">Filter courses</p>
        <div className="courses-filter-grid">
          <label className="account-field">
            <span>Search</span>
            <input type="text" value={filters.q} onChange={(event) => handleFilterChange('q', event.target.value)} placeholder="Course title or tutor name" />
          </label>
          <label className="account-field">
            <span>Subject</span>
            <input type="text" value={filters.subject} onChange={(event) => handleFilterChange('subject', event.target.value)} placeholder="Math, Biology, ..." />
          </label>
          <label className="account-field">
            <span>Topic</span>
            <input type="text" value={filters.topic} onChange={(event) => handleFilterChange('topic', event.target.value)} placeholder="Exam prep, grammar, ..." />
          </label>
          <label className="account-field">
            <span>Sort</span>
            <select value={filters.sort} onChange={(event) => handleFilterChange('sort', event.target.value)}>
              <option value="price_low">Lowest price</option>
              <option value="price_high">Highest price</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <label className="account-field">
            <span>Min price</span>
            <input type="number" min="0" value={filters.min_price} onChange={(event) => handleFilterChange('min_price', event.target.value)} placeholder="0" />
          </label>
          <label className="account-field">
            <span>Max price</span>
            <input type="number" min="0" value={filters.max_price} onChange={(event) => handleFilterChange('max_price', event.target.value)} placeholder="Any" />
          </label>
        </div>
        <p className="account-status" aria-live="polite">{message || 'Use the filters to quickly find affordable learning options.'}</p>
      </section>

      {coursesQuery.isLoading ? (
        <section className="page-card card"><p className="supporting-text">Loading courses...</p></section>
      ) : courses.length ? (
        <section className="courses-grid">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              canPurchase={canPurchase}
              busy={purchaseMutation.isPending}
              onPurchase={handlePurchase}
            />
          ))}
        </section>
      ) : (
        <section className="page-card card">
          <p className="eyebrow">Courses</p>
          <h2>No courses found</h2>
          <p className="supporting-text">Try another filter or search term.</p>
        </section>
      )}

      {!canPurchase ? (
        <section className="page-card card">
          <p className="eyebrow">Purchase access</p>
          <h2>Students can buy courses after signing in</h2>
          <p className="supporting-text">Create a student account or sign in to unlock one-click course purchases.</p>
          <div className="hero-actions">
            <Link className="primary-button" to="/sign-in">Sign in</Link>
            <Link className="secondary-button" to="/join">Join now</Link>
          </div>
        </section>
      ) : null}
    </section>
  )
}
