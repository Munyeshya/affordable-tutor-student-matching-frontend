import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { apiClient } from '../api/client'
import { API_ENDPOINTS } from '../api/endpoints'
import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { getParentDashboard } from '../api/services/parents'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { UserAvatar } from '../components/ui/UserAvatar.jsx'
import './ParentStudentsPage.css'

const EMPTY_STUDENTS = []

function formatImprovement(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(1) : '0.0'
}

function StudentDirectoryCard({ item }) {
  const { student, link, booking_stats: bookings, learning_stats: learning } = item
  const subjects = student.subjects_needing_help_names || []
  const improvement = formatImprovement(learning.average_improvement)

  return (
    <article className="parent-directory-card">
      <header>
        <UserAvatar
          className="parent-directory-avatar"
          src={student.profile_image_url}
          name={student.full_name || student.email}
          fallback="ST"
        />
        <div>
          <span>{link.label || 'Linked learner'}</span>
          <h2>{student.full_name || student.email}</h2>
          <p>{student.level || 'Level not added'} / {student.school_name || 'School not added'}</p>
        </div>
        {link.is_primary ? <strong className="parent-directory-primary">Primary</strong> : null}
      </header>

      <div className="parent-directory-subjects" aria-label="Subjects needing support">
        {subjects.length
          ? subjects.slice(0, 3).map((subject) => <span key={subject}>{subject}</span>)
          : <span>Learning subjects not added</span>}
        {subjects.length > 3 ? <span>+{subjects.length - 3}</span> : null}
      </div>

      <dl className="parent-directory-metrics">
        <div><dt>Bookings</dt><dd>{bookings.total_bookings || 0}</dd></div>
        <div><dt>Active</dt><dd>{bookings.confirmed_bookings || 0}</dd></div>
        <div><dt>Completed</dt><dd>{bookings.completed_bookings || 0}</dd></div>
        <div><dt>Improvement</dt><dd>{improvement}%</dd></div>
      </dl>

      <footer>
        <div>
          <DashboardIcon name="verification" size={18} />
          <span>{learning.confirmed_results || 0} confirmed learning outcomes</span>
        </div>
        <Link to={`/parent-students/${link.student}`}>
          View student <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </article>
  )
}

export function ParentStudentsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [studentEmail, setStudentEmail] = useState('')
  const [label, setLabel] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)

  const dashboardQuery = useQuery({
    queryKey: queryKeys.parents.dashboard,
    queryFn: () => getParentDashboard().then((response) => response.data),
    staleTime: 30_000,
  })

  const createMutation = useMutation({
    mutationFn: (payload) => apiClient.post(API_ENDPOINTS.parents.links, payload),
    onSuccess: async () => {
      setStudentEmail('')
      setLabel('')
      setIsPrimary(false)
      setShowLinkForm(false)
      toast.success('Student linked successfully.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.parents.links }),
        queryClient.invalidateQueries({ queryKey: queryKeys.parents.dashboard }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not link this student.')),
  })

  const students = dashboardQuery.data?.linked_students || EMPTY_STUDENTS
  const normalizedSearch = search.trim().toLowerCase()
  const visibleStudents = useMemo(() => students.filter((item) => {
    if (!normalizedSearch) return true
    const searchable = [
      item.student.full_name,
      item.student.email,
      item.student.school_name,
      item.student.level,
      item.link.label,
      ...(item.student.subjects_needing_help_names || []),
    ].join(' ').toLowerCase()
    return searchable.includes(normalizedSearch)
  }), [students, normalizedSearch])

  const activeBookings = students.reduce(
    (total, item) => total + Number(item.booking_stats?.confirmed_bookings || 0),
    0,
  )
  const completedBookings = students.reduce(
    (total, item) => total + Number(item.booking_stats?.completed_bookings || 0),
    0,
  )
  const averageImprovement = students.length
    ? students.reduce(
      (total, item) => total + Number(item.learning_stats?.average_improvement || 0),
      0,
    ) / students.length
    : 0

  function handleLinkStudent(event) {
    event.preventDefault()
    createMutation.mutate({
      student_email: studentEmail.trim(),
      label: label.trim(),
      is_primary: isPrimary,
    })
  }

  return (
    <section className="parent-students-page">
      <header className="parent-students-header">
        <div>
          <p className="eyebrow">Family learners</p>
          <h1>Students in your care</h1>
          <p>Open each learner’s profile to follow lessons, tutor updates, and confirmed academic progress.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowLinkForm((current) => !current)}>
          <DashboardIcon name={showLinkForm ? 'close' : 'students'} size={17} />
          {showLinkForm ? 'Close form' : 'Link a student'}
        </button>
      </header>

      <section className="parent-students-summary" aria-label="Linked student summary">
        <article><DashboardIcon name="students" /><div><span>Linked students</span><strong>{students.length}</strong></div></article>
        <article><DashboardIcon name="bookings" /><div><span>Active bookings</span><strong>{activeBookings}</strong></div></article>
        <article><DashboardIcon name="verification" /><div><span>Completed lessons</span><strong>{completedBookings}</strong></div></article>
        <article><DashboardIcon name="reports" /><div><span>Average improvement</span><strong>{formatImprovement(averageImprovement)}%</strong></div></article>
      </section>

      {showLinkForm ? (
        <section className="parent-link-panel">
          <div>
            <p className="eyebrow">Add a learner</p>
            <h2>Link an existing student account</h2>
            <p>The student must already have an Isomo student account. Their private data remains available only to linked parents.</p>
          </div>
          <form onSubmit={handleLinkStudent}>
            <label>
              <span>Student email</span>
              <input type="email" value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} placeholder="student@example.com" required />
            </label>
            <label>
              <span>Relationship label <small>Optional</small></span>
              <input type="text" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="For example: My daughter" />
            </label>
            <label className="parent-link-checkbox">
              <input type="checkbox" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} />
              <span>Use as the primary learner when booking</span>
            </label>
            <button className="primary-button" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Linking student...' : 'Link student account'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="parent-directory-panel">
        <header>
          <div><p className="eyebrow">Student directory</p><h2>All linked learners</h2></div>
          <label className="parent-directory-search">
            <DashboardIcon name="search" size={17} />
            <span className="sr-only">Search linked students</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, school, level, or subject"
            />
          </label>
        </header>

        {dashboardQuery.isLoading ? (
          <SkeletonLoader rows={5} className="parent-directory-skeleton" />
        ) : dashboardQuery.isError ? (
          <ErrorState
            title="Linked students could not be loaded."
            message={getApiErrorMessage(dashboardQuery.error)}
            onRetry={dashboardQuery.refetch}
          />
        ) : visibleStudents.length ? (
          <div className="parent-directory-grid">
            {visibleStudents.map((item) => <StudentDirectoryCard key={item.link.id} item={item} />)}
          </div>
        ) : (
          <EmptyState
            icon={<DashboardIcon name={normalizedSearch ? 'search' : 'students'} size={28} />}
            title={normalizedSearch ? 'No students match your search' : 'No students linked yet'}
            description={normalizedSearch ? 'Try a different name, school, level, or subject.' : 'Link an existing student account to begin managing their learning.'}
          >
            {normalizedSearch ? <button type="button" onClick={() => setSearch('')}>Clear search</button> : null}
          </EmptyState>
        )}
      </section>
    </section>
  )
}
