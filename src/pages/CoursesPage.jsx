import React, { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { PaymentCheckoutDialog } from '../components/payments/PaymentCheckoutDialog.jsx'
import { FilterBar } from '../components/ui/FilterBar.jsx'
import { listCoursePurchases } from '../api/services/payments'
import { useAuth } from '../context/AuthContext.jsx'
import { usePublicCoursesQuery } from '../hooks/useCommonQueries'
import './CoursesPage.css'

function formatMoney(value) {
  return `${new Intl.NumberFormat('en-RW').format(Number(value || 0))} RWF`
}

function CourseSkeleton() {
  return (
    <article className="market-course-card market-course-skeleton" aria-hidden="true">
      <span /><span /><span /><span />
    </article>
  )
}

function CourseCard({ course, isOwned, canPurchase, isAuthenticated, accessLoading, busy, onPurchase }) {
  const previews = Array.isArray(course.lessons) ? course.lessons : []

  return (
    <article className="market-course-card">
      <div className="market-course-visual">
        {course.thumbnail_url ? <img src={course.thumbnail_url} alt="" /> : (
          <div className="market-course-placeholder" aria-hidden="true">
            <span>{course.subject_name?.slice(0, 2).toUpperCase() || 'IS'}</span>
          </div>
        )}
        <span className="market-price">{Number(course.price) === 0 ? 'Free' : formatMoney(course.price)}</span>
      </div>

      <div className="market-course-body">
        <div className="market-course-labels">
          <span>{course.subject_name || 'Course'}</span>
          <span>{course.academic_level || 'All levels'}</span>
        </div>
        <h2>{course.title}</h2>
        <p>{course.description || 'A focused course created by a verified Isomo tutor.'}</p>

        <div className="market-course-tutor">
          <span aria-hidden="true">{(course.tutor_name || 'T').charAt(0).toUpperCase()}</span>
          <div>
            <small>Verified tutor</small>
            <strong>{course.tutor_name || 'Isomo tutor'}</strong>
          </div>
        </div>

        <div className="market-preview">
          <div>
            <strong>{previews.length}</strong>
            <span>preview lesson{previews.length === 1 ? '' : 's'}</span>
          </div>
          <div>
            <strong>{previews.reduce((total, lesson) => total + Number(lesson.duration || 0), 0)}</strong>
            <span>preview minutes</span>
          </div>
        </div>

        {previews.length > 0 && (
          <div className="market-preview-list">
            {previews.slice(0, 2).map((lesson) => (
              <div key={lesson.id}>
                <span>{String(lesson.order_number).padStart(2, '0')}</span>
                <p><strong>{lesson.title}</strong><small>{lesson.topic || 'Course lesson'}</small></p>
              </div>
            ))}
          </div>
        )}

        <div className="market-course-actions">
          <Link to={`/tutors/${course.tutor}`}>View tutor</Link>
          {accessLoading ? (
            <button type="button" disabled>Checking access...</button>
          ) : isOwned ? (
            <Link className="market-primary-action" to={`/learning?course=${course.id}`}>Continue learning</Link>
          ) : canPurchase ? (
            <button type="button" onClick={() => onPurchase(course)} disabled={busy}>
              {busy ? 'Processing...' : Number(course.price) === 0 ? 'Enroll free' : 'Buy course'}
            </button>
          ) : !isAuthenticated ? (
            <Link className="market-primary-action" to="/sign-in">Sign in to buy</Link>
          ) : (
            <span className="market-role-note">Student accounts can enroll</span>
          )}
        </div>
      </div>
    </article>
  )
}

export function CoursesPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    q: '', subject: '', topic: '', min_price: '', max_price: '', sort: 'price_low',
  })
  const deferredFilters = useDeferredValue(filters)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const canPurchase = isAuthenticated && user?.role === 'STUDENT'

  const coursesQuery = usePublicCoursesQuery(deferredFilters)
  const purchasesQuery = useQuery({
    queryKey: queryKeys.payments.coursePurchases,
    queryFn: () => listCoursePurchases().then((response) => response.data),
    enabled: canPurchase,
  })
  const courseData = coursesQuery.data
  const courses = Array.isArray(courseData)
    ? courseData
    : Array.isArray(courseData?.results) ? courseData.results : []
  const purchases = Array.isArray(purchasesQuery.data) ? purchasesQuery.data : []
  const ownedCourseIds = new Set(
    purchases.filter((purchase) => purchase.status === 'PAID').map((purchase) => purchase.course),
  )
  const visibleCount = Number.isFinite(courseData?.count) ? courseData.count : courses.length

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function resetFilters() {
    setFilters({ q: '', subject: '', topic: '', min_price: '', max_price: '', sort: 'price_low' })
  }

  return (
    <section className="course-marketplace">
      <header className="market-header">
        <div>
          <p className="eyebrow">Affordable course library</p>
          <h1>Learn at your pace, within your budget</h1>
          <p>Compare clear prices, preview lessons, and learn from tutors whose qualifications have been reviewed.</p>
        </div>
        <div className="market-header-count">
          <strong>{visibleCount}</strong>
          <span>courses found</span>
        </div>
      </header>

      <FilterBar className="market-filter-bar" ariaLabel="Course filters">
        <label className="market-search-field">
          <span>Search courses</span>
          <input
            type="search"
            value={filters.q}
            onChange={(event) => updateFilter('q', event.target.value)}
            placeholder="Course, topic, or tutor"
          />
        </label>
        <label><span>Subject</span><input value={filters.subject} onChange={(event) => updateFilter('subject', event.target.value)} placeholder="Any subject" /></label>
        <label><span>Topic</span><input value={filters.topic} onChange={(event) => updateFilter('topic', event.target.value)} placeholder="Any topic" /></label>
        <label>
          <span>Sort by</span>
          <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
            <option value="price_low">Lowest price</option>
            <option value="price_high">Highest price</option>
            <option value="newest">Newest</option>
          </select>
        </label>
        <details className="market-price-filter">
          <summary>Price range</summary>
          <div>
            <label><span>Minimum</span><input type="number" min="0" value={filters.min_price} onChange={(event) => updateFilter('min_price', event.target.value)} /></label>
            <label><span>Maximum</span><input type="number" min="0" value={filters.max_price} onChange={(event) => updateFilter('max_price', event.target.value)} /></label>
          </div>
        </details>
        <button className="market-reset" type="button" onClick={resetFilters}>Reset</button>
      </FilterBar>

      {coursesQuery.isLoading ? (
        <section className="market-course-grid" aria-label="Loading courses">
          <CourseSkeleton /><CourseSkeleton /><CourseSkeleton />
        </section>
      ) : coursesQuery.isError ? (
        <section className="market-state" role="alert">
          <h2>Courses are temporarily unavailable</h2>
          <p>{getApiErrorMessage(coursesQuery.error)}</p>
          <button type="button" onClick={() => coursesQuery.refetch()}>Try again</button>
        </section>
      ) : courses.length ? (
        <section className="market-course-grid" aria-label="Available courses">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isOwned={ownedCourseIds.has(course.id)}
              canPurchase={canPurchase}
              isAuthenticated={isAuthenticated}
              accessLoading={canPurchase && purchasesQuery.isLoading}
              busy={selectedCourse?.id === course.id}
              onPurchase={setSelectedCourse}
            />
          ))}
        </section>
      ) : (
        <section className="market-state">
          <h2>No courses match these filters</h2>
          <p>Clear the filters or try a broader course or topic name.</p>
          <button type="button" onClick={resetFilters}>Clear filters</button>
        </section>
      )}

      <PaymentCheckoutDialog
        key={selectedCourse?.id || 'course-payment'}
        open={Boolean(selectedCourse)}
        kind="course"
        itemId={selectedCourse?.id}
        title={selectedCourse?.title || 'Course enrollment'}
        amount={selectedCourse?.price}
        currency="RWF"
        initialPhone={user?.profile?.data?.phone_number || ''}
        onClose={() => setSelectedCourse(null)}
        onSettled={async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.payments.coursePurchases }),
            queryClient.invalidateQueries({ queryKey: queryKeys.learning.library }),
            queryClient.invalidateQueries({ queryKey: queryKeys.catalog.publicCoursesRoot }),
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
          ])
        }}
      />
    </section>
  )
}
