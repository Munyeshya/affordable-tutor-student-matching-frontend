import React, { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../api/errors'
import { FilterBar } from '../components/ui/FilterBar.jsx'
import { InlineIcon } from '../components/ui/InlineIcon.jsx'
import { UserAvatar } from '../components/ui/UserAvatar.jsx'
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

function CourseCard({ course }) {
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
          <UserAvatar
            src={course.tutor_profile_image_url}
            name={course.tutor_name}
            fallback="T"
            alt=""
          />
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
          <Link className="market-primary-action" to={`/courses/${course.id}`}>
            <InlineIcon name="book" /> View course details
          </Link>
        </div>
      </div>
    </article>
  )
}

export function CoursesPage() {
  const [filters, setFilters] = useState({
    q: '', subject: '', topic: '', min_price: '', max_price: '', sort: 'price_low',
  })
  const deferredFilters = useDeferredValue(filters)

  const coursesQuery = usePublicCoursesQuery(deferredFilters)
  const courseData = coursesQuery.data
  const courses = Array.isArray(courseData)
    ? courseData
    : Array.isArray(courseData?.results) ? courseData.results : []
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
        <button className="market-reset" type="button" onClick={resetFilters}>
          <InlineIcon name="trash" /> Reset
        </button>
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
            />
          ))}
        </section>
      ) : (
        <section className="market-state">
          <h2>No courses match these filters</h2>
          <p>Clear the filters or try a broader course or topic name.</p>
          <button type="button" onClick={resetFilters}>
            <InlineIcon name="trash" /> Clear filters
          </button>
        </section>
      )}

    </section>
  )
}
