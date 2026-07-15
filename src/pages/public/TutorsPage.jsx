import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'

import { getApiErrorMessage } from '../../api/errors.js'
import { EMPTY_PAGE } from '../../api/response.js'
import { usePublicTutorsQuery, useSubjectsQuery } from '../../hooks/useCommonQueries.js'
import { Pagination } from '../../components/ui/Pagination.jsx'
import './TutorsPage.css'

const PAGE_SIZE = 9


const levelOptions = [
  { value: '', label: 'Any level' },
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'SECONDARY_LOWER', label: 'Secondary lower' },
  { value: 'SECONDARY_UPPER', label: 'Secondary upper' },
  { value: 'UNIVERSITY', label: 'University' },
]

const sortOptions = [
  { value: 'price_low', label: 'Lowest price' },
  { value: 'price_high', label: 'Highest price' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'name', label: 'Tutor name' },
  { value: 'newest', label: 'Newest tutors' },
]

const teachingModeOptions = [
  { value: '', label: 'Any teaching mode' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'IN_PERSON', label: 'In person' },
]

const ratingOptions = [
  { value: '', label: 'Any rating' },
  { value: '3', label: '3+ stars' },
  { value: '4', label: '4+ stars' },
  { value: '4.5', label: '4.5+ stars' },
  { value: '5', label: '5 stars' },
]

const validModes = new Set(teachingModeOptions.map((option) => option.value))
const validRatings = new Set(ratingOptions.map((option) => option.value))
const validLevels = new Set(levelOptions.map((option) => option.value))
const validSorts = new Set(sortOptions.map((option) => option.value))

function readNumberFilter(searchParams, key, maximum = null) {
  const rawValue = searchParams.get(key) || ''
  const numericValue = Number(rawValue)

  if (!rawValue || !Number.isFinite(numericValue) || numericValue < 0) return ''
  if (maximum !== null && numericValue > maximum) return ''
  return rawValue
}

function readFilters(searchParams) {
  const level = searchParams.get('level') || ''
  const mode = searchParams.get('mode') || ''
  const minRating = searchParams.get('min_rating') || ''
  const sort = searchParams.get('sort') || 'price_low'

  return {
    q: searchParams.get('q') || '',
    subject: searchParams.get('subject') || '',
    lesson: searchParams.get('lesson') || '',
    topic: searchParams.get('topic') || '',
    level: validLevels.has(level) ? level : '',
    location: searchParams.get('location') || '',
    mode: validModes.has(mode) ? mode : '',
    min_rate: readNumberFilter(searchParams, 'min_rate'),
    max_rate: readNumberFilter(searchParams, 'max_rate'),
    min_rating: validRatings.has(minRating) ? minRating : '',
    sort: validSorts.has(sort) ? sort : 'price_low',
  }
}

function readPage(searchParams) {
  const page = Number.parseInt(searchParams.get('page') || '1', 10)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function buildSearchParams(filters, page = 1) {
  const params = new URLSearchParams()

  for (const key of ['q', 'subject', 'lesson', 'topic', 'level', 'location', 'mode', 'min_rate', 'max_rate', 'min_rating']) {
    if (filters[key]) params.set(key, filters[key])
  }

  if (filters.sort && filters.sort !== 'price_low') params.set('sort', filters.sort)
  if (page > 1) params.set('page', String(page))
  return params
}
function normalizeFilters(filters) {
  return {
    q: filters.q.trim(),
    subject: filters.subject.trim(),
    lesson: filters.lesson.trim(),
    topic: filters.topic.trim(),
    level: filters.level,
    location: filters.location.trim(),
    mode: filters.mode,
    min_rate: String(filters.min_rate || '').trim(),
    max_rate: String(filters.max_rate || '').trim(),
    min_rating: filters.min_rating,
    sort: filters.sort || 'price_low',
  }
}

function buildTutorParams(filters, page) {
  const params = { page, page_size: PAGE_SIZE, sort: filters.sort }

  for (const key of ['q', 'subject', 'lesson', 'topic', 'level', 'location', 'mode', 'min_rate', 'max_rate', 'min_rating']) {
    if (filters[key]) params[key] = filters[key]
  }

  return params
}

function formatTutorRate(rate, currency = 'RWF') {
  const numericRate = Number(rate)
  if (!Number.isFinite(numericRate)) return 'Price on request'

  return `${currency} ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: numericRate % 1 === 0 ? 0 : 2,
  }).format(numericRate)} / hour`
}

function formatLevel(value) {
  return String(value || '')
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}


function TutorSkeleton() {
  return (
    <article className="market-tutor-card market-tutor-skeleton" aria-hidden="true">
      <div className="skeleton skeleton-line skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line skeleton-button" />
    </article>
  )
}

function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'IT'
}

function formatRating(value, reviewCount) {
  const rating = Number(value)
  if (!Number.isFinite(rating)) return 'New tutor'
  return `${rating.toFixed(1)} (${reviewCount || 0})`
}

function formatAvailability(value) {
  if (!value) return 'Time arranged on request'

  return new Intl.DateTimeFormat('en-RW', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function TutorCard({ tutor, marketplacePath }) {
  const subjectLevels = Array.isArray(tutor.subject_levels) ? tutor.subject_levels : []
  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : []
  const modes = [tutor.teaches_online ? 'Online' : null, tutor.teaches_in_person ? 'In person' : null]
    .filter(Boolean)
    .join(' and ') || 'Arrange with tutor'
  const availability = tutor.availability_summary || {}

  return (
    <article className="market-tutor-card">
      <div className="market-tutor-profile">
        <div className="market-tutor-avatar">
          {tutor.profile_image_url ? (
            <img loading="lazy" src={tutor.profile_image_url} alt={`${tutor.full_name} profile`} />
          ) : (
            <span>{getInitials(tutor.full_name)}</span>
          )}
        </div>
        <div className="market-tutor-identity">
          <span className="market-verified-badge">
            <span aria-hidden="true" />
            Verified
          </span>
          <h2>{tutor.full_name}</h2>
          <p>{tutor.headline || subjects.join(', ') || 'Supportive, student-focused tutoring.'}</p>
        </div>
      </div>

      <div className="market-tutor-facts">
        <div><span>Rating</span><strong>{formatRating(tutor.average_rating, tutor.review_count)}</strong></div>
        <div><span>Location</span><strong>{tutor.location || 'Flexible'}</strong></div>
        <div><span>Teaching</span><strong>{modes}</strong></div>
      </div>

      <div className="market-tutor-tags" aria-label="Subjects and education levels">
        {subjectLevels.slice(0, 3).map((item) => (
          <span key={`${tutor.id}-${item.subject}-${item.level}`}>
            {item.subject} - {formatLevel(item.level)}
          </span>
        ))}
        {subjectLevels.length > 3 ? <span>+{subjectLevels.length - 3} more</span> : null}
        {subjectLevels.length === 0 ? <span>Subjects available on profile</span> : null}
      </div>

      <div className="market-tutor-offer">
        <div>
          <span>Hourly rate</span>
          <strong>{formatTutorRate(tutor.hourly_rate, tutor.currency)}</strong>
        </div>
        <div>
          <span>
            {availability.has_availability
              ? `${availability.available_slot_count} open time${availability.available_slot_count === 1 ? '' : 's'}`
              : 'Availability'}
          </span>
          <strong>{formatAvailability(availability.next_available_at)}</strong>
        </div>
      </div>

      <div className="market-tutor-actions">
        <Link
          className="primary-button"
          to={`/tutors/${tutor.id}`}
          state={{ fromMarketplace: marketplacePath }}
        >
          View profile
        </Link>
        <Link className="secondary-button" to={`/book?tutor=${tutor.user_id}&profile=${tutor.id}`}>
          Request tutor
        </Link>
      </div>
    </article>
  )
}
function MarketplaceFilterForm({ filters, onApply, onClear, subjects, subjectsLoading }) {
  const [draftFilters, setDraftFilters] = useState(filters)
  const [validationError, setValidationError] = useState('')

  function updateDraft(key, value) {
    setDraftFilters((current) => ({ ...current, [key]: value }))
    setValidationError('')
  }

  function submitFilters(event) {
    event.preventDefault()
    const normalized = normalizeFilters(draftFilters)
    const minimumRate = Number(normalized.min_rate)
    const maximumRate = Number(normalized.max_rate)

    if (
      normalized.min_rate
      && normalized.max_rate
      && Number.isFinite(minimumRate)
      && Number.isFinite(maximumRate)
      && minimumRate > maximumRate
    ) {
      setValidationError('Maximum rate must be greater than or equal to minimum rate.')
      return
    }

    onApply(normalized)
  }

  return (
    <form className="marketplace-search" onSubmit={submitFilters}>
      <label className="marketplace-search-main">
        <span>Search tutors</span>
        <input
          type="search"
          value={draftFilters.q}
          onChange={(event) => updateDraft('q', event.target.value)}
          placeholder="Tutor name or keyword"
        />
      </label>
      <label>
        <span>Subject</span>
        <select value={draftFilters.subject} onChange={(event) => updateDraft('subject', event.target.value)}>
          <option value="">{subjectsLoading ? 'Loading subjects...' : 'Any subject'}</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.name}>{subject.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Lesson</span>
        <input value={draftFilters.lesson} onChange={(event) => updateDraft('lesson', event.target.value)} placeholder="e.g. Algebra" />
      </label>
      <label>
        <span>Topic</span>
        <input value={draftFilters.topic} onChange={(event) => updateDraft('topic', event.target.value)} placeholder="e.g. Equations" />
      </label>
      <label>
        <span>Education level</span>
        <select value={draftFilters.level} onChange={(event) => updateDraft('level', event.target.value)}>
          {levelOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Location</span>
        <input value={draftFilters.location} onChange={(event) => updateDraft('location', event.target.value)} placeholder="e.g. Kigali" />
      </label>
      <label>
        <span>Teaching mode</span>
        <select value={draftFilters.mode} onChange={(event) => updateDraft('mode', event.target.value)}>
          {teachingModeOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Minimum rate</span>
        <input type="number" min="0" step="1" inputMode="decimal" value={draftFilters.min_rate} onChange={(event) => updateDraft('min_rate', event.target.value)} placeholder="RWF" />
      </label>
      <label>
        <span>Maximum rate</span>
        <input type="number" min="0" step="1" inputMode="decimal" value={draftFilters.max_rate} onChange={(event) => updateDraft('max_rate', event.target.value)} placeholder="RWF" />
      </label>
      <label>
        <span>Minimum rating</span>
        <select value={draftFilters.min_rating} onChange={(event) => updateDraft('min_rating', event.target.value)}>
          {ratingOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      {validationError ? <p className="marketplace-filter-error" role="alert">{validationError}</p> : null}
      <div className="marketplace-filter-actions">
        <button className="primary-button marketplace-submit" type="submit">Show tutors</button>
        <button className="link-button" type="button" onClick={onClear}>Clear filters</button>
      </div>
    </form>
  )
}

export function TutorsPage() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterButtonRef = useRef(null)
  const filterPanelRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const searchKey = searchParams.toString()
  const appliedFilters = readFilters(searchParams)
  const page = readPage(searchParams)
  const marketplacePath = `${location.pathname}${location.search}`

  const subjectsQuery = useSubjectsQuery({ staleTime: 10 * 60 * 1000 })
  const subjects = subjectsQuery.data || []
  const tutorParams = buildTutorParams(appliedFilters, page)
  const tutorsQuery = usePublicTutorsQuery(tutorParams, {
    placeholderData: (previousData) => previousData,
  })

  const tutorPage = tutorsQuery.data || EMPTY_PAGE
  const totalPages = Math.max(1, Math.ceil(tutorPage.count / PAGE_SIZE))
  const activeFilters = [
    appliedFilters.q ? { key: 'q', label: `Search: ${appliedFilters.q}` } : null,
    appliedFilters.subject ? { key: 'subject', label: `Subject: ${appliedFilters.subject}` } : null,
    appliedFilters.lesson ? { key: 'lesson', label: `Lesson: ${appliedFilters.lesson}` } : null,
    appliedFilters.topic ? { key: 'topic', label: `Topic: ${appliedFilters.topic}` } : null,
    appliedFilters.level ? { key: 'level', label: `Level: ${formatLevel(appliedFilters.level)}` } : null,
    appliedFilters.location ? { key: 'location', label: `Location: ${appliedFilters.location}` } : null,
    appliedFilters.mode ? { key: 'mode', label: teachingModeOptions.find((option) => option.value === appliedFilters.mode)?.label } : null,
    appliedFilters.min_rate ? { key: 'min_rate', label: `From RWF ${appliedFilters.min_rate}` } : null,
    appliedFilters.max_rate ? { key: 'max_rate', label: `Up to RWF ${appliedFilters.max_rate}` } : null,
    appliedFilters.min_rating ? { key: 'min_rating', label: `${appliedFilters.min_rating}+ stars` } : null,
    appliedFilters.sort !== 'price_low'
      ? { key: 'sort', label: sortOptions.find((option) => option.value === appliedFilters.sort)?.label }
      : null,
  ].filter(Boolean)

  useEffect(() => {
    if (!filtersOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const filterButton = filterButtonRef.current
    const desktopMedia = window.matchMedia('(min-width: 901px)')
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setFiltersOpen(false)
        return
      }

      if (event.key !== 'Tab') return
      const focusableElements = Array.from(
        filterPanelRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      )
      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
    const handleViewportChange = (event) => {
      if (event.matches) setFiltersOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    desktopMedia.addEventListener('change', handleViewportChange)
    filterPanelRef.current?.querySelector('input, select, button')?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      desktopMedia.removeEventListener('change', handleViewportChange)
      filterButton?.focus()
    }
  }, [filtersOpen])

  function applyFilters(filters) {
    setSearchParams(buildSearchParams(filters), { replace: false })
    setFiltersOpen(false)
  }

  function changeSort(value) {
    setSearchParams(buildSearchParams({ ...appliedFilters, sort: value }), { replace: false })
  }

  function removeFilter(key) {
    const fallback = key === 'sort' ? 'price_low' : ''
    setSearchParams(
      buildSearchParams(normalizeFilters({ ...appliedFilters, [key]: fallback })),
      { replace: false },
    )
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: false })
    setFiltersOpen(false)
  }

  function changePage(nextPage) {
    setSearchParams(buildSearchParams(appliedFilters, nextPage), { replace: false })
  }
  return (
    <div className="tutor-marketplace">
      <section className="marketplace-intro">
        <div>
          <p className="eyebrow">Tutor marketplace</p>
          <h1>Find trusted tutoring at a price that works.</h1>
          <p className="supporting-text">
            Search approved tutors by name, lesson, topic, or education level.
          </p>
        </div>
        <Link className="secondary-button" to="/join">Become a tutor</Link>
      </section>

      <div className="marketplace-mobile-toolbar">
        <button
          ref={filterButtonRef}
          className="secondary-button marketplace-filter-toggle"
          type="button"
          aria-controls="marketplace-filter-panel"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(true)}
        >
          Filters{activeFilters.length ? ` (${activeFilters.length})` : ''}
        </button>
        <span>{tutorPage.count} tutor{tutorPage.count === 1 ? '' : 's'}</span>
      </div>

      <div className="marketplace-workspace">
        <button
          className={`marketplace-filter-backdrop${filtersOpen ? ' open' : ''}`}
          type="button"
          aria-label="Close tutor filters"
          onClick={() => setFiltersOpen(false)}
        />
        <aside
          ref={filterPanelRef}
          id="marketplace-filter-panel"
          className={`marketplace-filter-panel${filtersOpen ? ' open' : ''}`}
          role={filtersOpen ? 'dialog' : 'region'}
          aria-modal={filtersOpen || undefined}
          aria-labelledby="marketplace-filter-title"
        >
          <header className="marketplace-filter-header">
            <div>
              <p className="eyebrow">Refine results</p>
              <h2 id="marketplace-filter-title">Tutor filters</h2>
            </div>
            <button type="button" aria-label="Close tutor filters" onClick={() => setFiltersOpen(false)}>Close</button>
          </header>
          <MarketplaceFilterForm
            key={searchKey}
            filters={appliedFilters}
            onApply={applyFilters}
            onClear={clearFilters}
            subjects={subjects}
            subjectsLoading={subjectsQuery.isLoading}
          />
        </aside>

        <section className="marketplace-results" aria-label="Tutor results">
          <section className="marketplace-results-heading" aria-live="polite">
        <div>
          <p className="eyebrow">Results</p>
          <h2>
            {tutorsQuery.isLoading
              ? 'Finding tutors...'
              : `${tutorPage.count} tutor${tutorPage.count === 1 ? '' : 's'} available`}
          </h2>
        </div>
        <label className="marketplace-sort">
          <span>Sort by</span>
          <select value={appliedFilters.sort} onChange={(event) => changeSort(event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
          </section>

      {activeFilters.length > 0 ? (
        <div className="marketplace-active-filters" aria-label="Active tutor filters">
          {activeFilters.map((filter) => (
            <button key={filter.key} type="button" onClick={() => removeFilter(filter.key)}>
              {filter.label}<span aria-hidden="true">X</span>
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button className="marketplace-clear" type="button" onClick={clearFilters}>Clear all</button>
        </div>
      ) : null}

      {tutorsQuery.isError ? (
        <section className="marketplace-state card" role="alert">
          <h2>We could not load tutors.</h2>
          <p className="supporting-text">{getApiErrorMessage(tutorsQuery.error)}</p>
          <button className="primary-button" type="button" onClick={() => tutorsQuery.refetch()}>Try again</button>
        </section>
      ) : null}

      {!tutorsQuery.isError ? (
        <section className="marketplace-tutor-grid" aria-busy={tutorsQuery.isLoading}>
          {tutorsQuery.isLoading
            ? Array.from({ length: 6 }, (_, index) => <TutorSkeleton key={index} />)
            : tutorPage.results.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} marketplacePath={marketplacePath} />
            ))}
        </section>
      ) : null}

      {!tutorsQuery.isLoading && !tutorsQuery.isError && tutorPage.results.length === 0 ? (
        <section className="marketplace-state card">
          <h2>No tutors match these filters.</h2>
          <p className="supporting-text">Try a broader lesson, topic, or education level.</p>
          <button className="secondary-button" type="button" onClick={clearFilters}>Clear filters</button>
        </section>
      ) : null}

      {!tutorsQuery.isError && tutorPage.count > PAGE_SIZE ? (
        <Pagination
          className="marketplace-pagination"
          currentPage={page}
          totalPages={totalPages}
          hasPrevious={Boolean(tutorPage.previous)}
          hasNext={Boolean(tutorPage.next)}
          disabled={tutorsQuery.isFetching}
          onPageChange={changePage}
        />
      ) : null}
        </section>
      </div>
    </div>
  )
}
