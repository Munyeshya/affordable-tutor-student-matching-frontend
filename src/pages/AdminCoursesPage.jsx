import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { getAdminCourse, listAdminCourses, moderateAdminCourse } from '../api/services/adminCourses.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { useSubjectsQuery } from '../hooks/useCommonQueries.js'
import './AdminCoursesPage.css'


const PAGE_SIZE = 20
const EMPTY_FILTERS = {
  search: '',
  status: 'PENDING_REVIEW',
  subject: '',
  ordering: 'newest',
}

const STATUS_OPTIONS = [
  ['', 'All courses'],
  ['PENDING_REVIEW', 'Pending'],
  ['PUBLISHED', 'Published'],
  ['CHANGES_REQUESTED', 'Changes requested'],
  ['REJECTED', 'Rejected'],
  ['DRAFT', 'Drafts'],
]

const DECISION_CONFIG = {
  PUBLISHED: {
    label: 'Publish course',
    shortLabel: 'Approve',
    description: 'Make this course visible in the public marketplace for learners.',
    className: 'is-positive',
  },
  CHANGES_REQUESTED: {
    label: 'Request changes',
    shortLabel: 'Request changes',
    description: 'Return the course to the tutor with specific improvements required before resubmission.',
    className: 'is-warning',
  },
  REJECTED: {
    label: 'Reject course',
    shortLabel: 'Reject',
    description: 'Reject this submission when it is unsuitable for the marketplace in its current form.',
    className: 'is-danger',
  },
}

function formatLabel(value) {
  return String(value || 'Unknown')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function formatDate(value, includeTime = false) {
  if (!value) return 'Not submitted'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat('en-RW', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date)
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function StatusBadge({ status }) {
  return <span className={`admin-course-status is-${String(status).toLowerCase().replaceAll('_', '-')}`}>{formatLabel(status)}</span>
}

export function AdminCoursesPage() {
  const queryClient = useQueryClient()
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [decisionStatus, setDecisionStatus] = useState('')
  const [reason, setReason] = useState('')
  const queryParams = { ...filters, page, page_size: PAGE_SIZE }

  const subjectsQuery = useSubjectsQuery()
  const coursesQuery = useQuery({
    queryKey: queryKeys.admin.courses(queryParams),
    queryFn: () => listAdminCourses(queryParams).then((response) => response.data),
    staleTime: 15_000,
  })
  const courseQuery = useQuery({
    queryKey: queryKeys.admin.course(selectedCourseId),
    queryFn: () => getAdminCourse(selectedCourseId).then((response) => response.data),
    enabled: Boolean(selectedCourseId),
  })
  const decisionMutation = useMutation({
    mutationFn: ({ id, status, decisionReason }) => moderateAdminCourse(id, {
      status,
      reason: decisionReason,
    }),
    onSuccess: async (_, variables) => {
      toast.success(`${DECISION_CONFIG[variables.status].label} completed.`)
      setDecisionStatus('')
      setReason('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'course-moderation'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'audit-events'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.publicCoursesRoot }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'The moderation decision could not be saved.')),
  })

  const subjects = Array.isArray(subjectsQuery.data) ? subjectsQuery.data : []
  const coursePage = coursesQuery.data || { count: 0, next: null, previous: null, results: [] }
  const courses = Array.isArray(coursePage.results) ? coursePage.results : []
  const selectedCourse = courseQuery.data
  const totalPages = Math.max(1, Math.ceil(coursePage.count / PAGE_SIZE))
  const decisionConfig = DECISION_CONFIG[decisionStatus]
  const reasonRequired = decisionStatus && decisionStatus !== 'PUBLISHED'
  const validReason = !reasonRequired || reason.trim().length >= 10

  function updateDraft(field, value) {
    setDraftFilters((current) => ({ ...current, [field]: value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setFilters(draftFilters)
    setPage(1)
  }

  function selectStatus(status) {
    setDraftFilters((current) => ({ ...current, status }))
    setFilters((current) => ({ ...current, status }))
    setPage(1)
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  function openCourse(id) {
    setDecisionStatus('')
    setReason('')
    setSelectedCourseId(id)
  }

  function closeDialog() {
    if (decisionMutation.isPending) return
    setSelectedCourseId(null)
    setDecisionStatus('')
    setReason('')
  }

  function chooseDecision(status) {
    setDecisionStatus(status)
    setReason('')
  }

  function submitDecision(event) {
    event.preventDefault()
    if (!decisionStatus || !validReason) {
      toast.error('Provide a clear reason of at least 10 characters.')
      return
    }
    decisionMutation.mutate({
      id: selectedCourse.id,
      status: decisionStatus,
      decisionReason: reason.trim(),
    })
  }

  const columns = [
    {
      key: 'course',
      header: 'Course',
      render: (row) => (
        <span className="admin-course-identity">
          <strong>{row.title}</strong>
          <small>{row.subject_name} / {row.academic_level || 'Level not provided'}</small>
        </span>
      ),
    },
    {
      key: 'tutor',
      header: 'Tutor',
      render: (row) => (
        <span className="admin-course-tutor">
          <strong>{row.tutor_name}</strong>
          <small>{row.tutor_email}</small>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'lessons', header: 'Lessons', render: (row) => row.lesson_count },
    { key: 'price', header: 'Price', render: (row) => formatMoney(row.price) },
    { key: 'submitted', header: 'Submitted', render: (row) => <time dateTime={row.submitted_at || ''}>{formatDate(row.submitted_at)}</time> },
    { key: 'actions', header: 'Actions', render: (row) => <button className="admin-course-review" type="button" onClick={() => openCourse(row.id)}>Preview and review</button> },
  ]

  return (
    <section className="admin-courses-page">
      <header className="admin-courses-header">
        <div>
          <p className="admin-overview-eyebrow">Administration</p>
          <h1>Course moderation</h1>
          <p>Preview course content and lesson structure before approving it for Isomo&apos;s public learning marketplace.</p>
        </div>
        <div className="admin-courses-summary"><strong>{coursePage.count}</strong><span>Matching courses</span></div>
      </header>

      <aside className="admin-courses-policy" aria-label="Course moderation policy">
        <DashboardIcon name="courses" size={22} />
        <p><strong>Published means publicly visible.</strong> Request changes when the course can be corrected; reject only when it is unsuitable in its current form. Every decision remains in moderation and audit history.</p>
      </aside>

      <nav className="admin-course-tabs" aria-label="Course status">
        {STATUS_OPTIONS.map(([value, label]) => (
          <button className={filters.status === value ? 'is-active' : ''} type="button" key={value || 'all'} onClick={() => selectStatus(value)}>{label}</button>
        ))}
      </nav>

      <form className="admin-course-filters" onSubmit={applyFilters}>
        <label className="admin-course-search"><span>Search</span><input type="search" placeholder="Course, lesson, topic, tutor, or subject" value={draftFilters.search} onChange={(event) => updateDraft('search', event.target.value)} /></label>
        <label><span>Subject</span><select value={draftFilters.subject} onChange={(event) => updateDraft('subject', event.target.value)}><option value="">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
        <label><span>Order</span><select value={draftFilters.ordering} onChange={(event) => updateDraft('ordering', event.target.value)}><option value="newest">Newest submissions</option><option value="oldest">Oldest submissions</option><option value="title">Course title</option><option value="price_low">Lowest price</option><option value="price_high">Highest price</option></select></label>
        <div className="admin-course-filter-actions"><button className="primary-button" type="submit">Apply filters</button><button className="secondary-button" type="button" onClick={clearFilters}>Clear</button></div>
      </form>

      <section className="admin-course-results" aria-busy={coursesQuery.isLoading}>
        <header><div><p>Moderation queue</p><h2>{coursesQuery.isLoading ? 'Loading courses...' : `${coursePage.count} course${coursePage.count === 1 ? '' : 's'}`}</h2></div><span>Pending submissions are shown first</span></header>
        {coursesQuery.isLoading ? (
          <SkeletonLoader rows={6} className="admin-course-skeleton" />
        ) : coursesQuery.isError ? (
          <ErrorState className="admin-overview-error" title="Courses could not be loaded." message={getApiErrorMessage(coursesQuery.error)} onRetry={coursesQuery.refetch} />
        ) : courses.length ? (
          <DataTable columns={columns} rows={courses} caption="Course moderation queue" className="admin-course-table" />
        ) : (
          <EmptyState className="admin-panel-empty" icon={<DashboardIcon name="courses" size={28} />} title="No matching courses" description="There are no course submissions in this view. Choose another status or clear the filters." />
        )}

        {coursePage.count > PAGE_SIZE ? (
          <nav className="admin-course-pagination" aria-label="Course moderation pages"><button type="button" disabled={!coursePage.previous} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={!coursePage.next} onClick={() => setPage((current) => current + 1)}>Next</button></nav>
        ) : null}
      </section>

      <ConfirmationDialog open={Boolean(selectedCourseId)} onClose={closeDialog} labelledBy="admin-course-dialog-title" describedBy="admin-course-dialog-description" dialogClassName="admin-course-dialog">
        <header className="admin-course-dialog-header">
          <div><span>Course preview</span><h2 id="admin-course-dialog-title">{selectedCourse?.title || 'Loading course...'}</h2></div>
          <button type="button" onClick={closeDialog} disabled={decisionMutation.isPending} aria-label="Close course preview">Close</button>
        </header>

        {courseQuery.isLoading ? (
          <SkeletonLoader rows={6} className="admin-course-skeleton" />
        ) : courseQuery.isError ? (
          <ErrorState className="admin-overview-error" title="Course details could not be loaded." message={getApiErrorMessage(courseQuery.error)} onRetry={courseQuery.refetch} />
        ) : selectedCourse ? (
          <>
            <div className="admin-course-dialog-summary">
              <div><span>Status</span><StatusBadge status={selectedCourse.status} /></div>
              <div><span>Tutor</span><strong>{selectedCourse.tutor_name}</strong><small>{selectedCourse.tutor_email}</small></div>
              <div><span>Verification</span><strong>{formatLabel(selectedCourse.tutor_verification_status)}</strong><small>{selectedCourse.tutor_marketplace_ready ? 'Marketplace ready' : 'Requirements incomplete'}</small></div>
              <div><span>Subject and level</span><strong>{selectedCourse.subject_name}</strong><small>{selectedCourse.academic_level || 'Not provided'}</small></div>
              <div><span>Price</span><strong>{formatMoney(selectedCourse.price)}</strong></div>
              <div><span>Submitted</span><strong>{formatDate(selectedCourse.submitted_at, true)}</strong></div>
            </div>

            <section className="admin-course-description"><h3>Course description</h3><p id="admin-course-dialog-description">{selectedCourse.description || 'No course description was provided.'}</p></section>

            <section className="admin-course-lessons">
              <div><h3>Lesson preview</h3><span>{selectedCourse.lessons.length} lesson{selectedCourse.lessons.length === 1 ? '' : 's'}</span></div>
              {selectedCourse.lessons.length ? selectedCourse.lessons.map((lesson) => (
                <article key={lesson.id}>
                  <span>{lesson.order_number}</span>
                  <div><h4>{lesson.title}</h4><p>{lesson.topic || 'No topic'}{lesson.duration ? ` / ${lesson.duration} minutes` : ''}</p>{lesson.description ? <small>{lesson.description}</small> : null}</div>
                  <div className="admin-lesson-flags">{lesson.is_preview ? <b>Public preview</b> : <b>Enrolled learners</b>}{lesson.video_file_url ? <a href={lesson.video_file_url} target="_blank" rel="noreferrer">Open video</a> : lesson.video_url ? <a href={lesson.video_url} target="_blank" rel="noreferrer">Open link</a> : <em>No video</em>}</div>
                </article>
              )) : <p className="admin-course-empty-copy">This course has no lessons.</p>}
            </section>

            {selectedCourse.moderation_history.length ? (
              <section className="admin-course-history"><h3>Moderation history</h3>{selectedCourse.moderation_history.map((decision) => <article key={decision.id}><StatusBadge status={decision.status} /><div><p>{decision.reason || 'No additional note.'}</p><small>{decision.admin_name} / {formatDate(decision.created_at, true)}</small></div></article>)}</section>
            ) : null}

            {selectedCourse.status === 'PENDING_REVIEW' ? decisionStatus ? (
              <form className="admin-course-decision-form" onSubmit={submitDecision}>
                <button type="button" onClick={() => setDecisionStatus('')} disabled={decisionMutation.isPending}>Back to decisions</button>
                <h3>{decisionConfig.label}</h3><p>{decisionConfig.description}</p>
                <label><span>{reasonRequired ? 'Required reason' : 'Decision note (optional)'}</span><textarea rows="4" maxLength="1000" value={reason} onChange={(event) => setReason(event.target.value)} placeholder={reasonRequired ? 'Give the tutor specific, actionable feedback.' : 'Add an optional note for the tutor and moderation history.'} /></label>
                {reasonRequired ? <small>{reason.trim().length}/10 minimum characters</small> : null}
                <div><button className="secondary-button" type="button" onClick={() => setDecisionStatus('')} disabled={decisionMutation.isPending}>Cancel</button><button className={`admin-course-confirm ${decisionConfig.className}`} type="submit" disabled={decisionMutation.isPending || !validReason}>{decisionMutation.isPending ? 'Saving...' : decisionConfig.label}</button></div>
              </form>
            ) : (
              <section className="admin-course-decisions"><h3>Moderation decision</h3><p>Choose the outcome that best reflects the course and lesson preview.</p><div>{Object.entries(DECISION_CONFIG).map(([status, config]) => <button className={config.className} type="button" key={status} onClick={() => chooseDecision(status)}>{config.shortLabel}</button>)}</div></section>
            ) : null}
          </>
        ) : null}
      </ConfirmationDialog>
    </section>
  )
}
