import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import {
  createTutorSubject,
  listMyCourses,
  listTutorSubjects,
} from '../api/services/catalog.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { useSubjectsQuery } from '../hooks/useCommonQueries'
import {
  courseCompletion,
  formatCourseStatus,
  formatMoney,
  isCourseEditable,
} from './tutorTeaching/courseHelpers.js'
import './TutorTeachingPage.css'

const EMPTY_SUBJECT = {
  subject: '',
  level: 'PRIMARY',
  experience_years: '',
}

function TeachingSkeleton() {
  return (
    <div className="teaching-skeleton" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  )
}

function CourseRow({ course }) {
  const completion = courseCompletion(course)
  const lessonCount = course.lessons?.length || 0

  return (
    <article className="teaching-course-row">
      <div className="teaching-course-row-main">
        <div className="teaching-course-icon"><DashboardIcon name="courses" size={20} /></div>
        <div>
          <div className="teaching-course-title">
            <h3>{course.title}</h3>
            <span className={`teaching-status is-${String(course.status).toLowerCase().replaceAll('_', '-')}`}>
              {formatCourseStatus(course.status)}
            </span>
          </div>
          <p>{course.subject_name} <span aria-hidden="true">/</span> {course.academic_level || 'Level not set'}</p>
          <dl className="teaching-course-meta">
            <div><dt>Lessons</dt><dd>{lessonCount}</dd></div>
            <div><dt>Price</dt><dd>{formatMoney(course.price)}</dd></div>
            <div><dt>Setup</dt><dd>{completion.percent}%</dd></div>
          </dl>
        </div>
      </div>
      <div className="teaching-course-progress" aria-label={`${completion.percent}% setup complete`}>
        <span style={{ width: `${completion.percent}%` }} />
      </div>
      {course.latest_moderation?.reason ? (
        <p className="teaching-review-note">
          <strong>Administrator feedback</strong>
          <span>{course.latest_moderation.reason}</span>
        </p>
      ) : null}
      <div className="teaching-course-actions">
        <Link to={`/tutor-teaching/courses/${course.id}/details`}>
          {isCourseEditable(course.status) ? 'Continue setup' : 'View course'}
        </Link>
        <Link to={`/tutor-teaching/courses/${course.id}/curriculum`}>Curriculum</Link>
        <Link className="is-primary" to={`/tutor-teaching/courses/${course.id}/review`}>Review readiness</Link>
      </div>
    </article>
  )
}

export function TutorTeachingPage() {
  const queryClient = useQueryClient()
  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJECT)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const subjectsQuery = useSubjectsQuery()
  const tutorSubjectsQuery = useQuery({
    queryKey: queryKeys.catalog.tutorSubjects,
    queryFn: () => listTutorSubjects().then((response) => response.data),
  })
  const coursesQuery = useQuery({
    queryKey: queryKeys.catalog.tutorCourses,
    queryFn: () => listMyCourses().then((response) => response.data),
  })

  const createSubjectMutation = useMutation({
    mutationFn: () => createTutorSubject({
      subject: Number(subjectForm.subject),
      level: subjectForm.level,
      experience_years: subjectForm.experience_years
        ? Number(subjectForm.experience_years)
        : null,
    }),
    onSuccess: async () => {
      toast.success('Teaching subject added.')
      setSubjectForm(EMPTY_SUBJECT)
      setShowSubjectForm(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.tutorSubjects }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.checklist }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not add this teaching subject.')),
  })

  const subjects = subjectsQuery.data || []
  const tutorSubjects = tutorSubjectsQuery.data || []
  const courses = coursesQuery.data || []
  const draftCount = courses.filter((course) => isCourseEditable(course.status)).length
  const reviewCount = courses.filter((course) => course.status === 'PENDING_REVIEW').length
  const publishedCount = courses.filter((course) => course.status === 'PUBLISHED').length

  function submitSubject(event) {
    event.preventDefault()
    createSubjectMutation.mutate()
  }

  return (
    <section className="tutor-teaching-page">
      <header className="teaching-hero">
        <div>
          <p className="eyebrow">Teaching workspace</p>
          <h1>Build and publish your learning offer</h1>
          <p>Move from your approved subjects to a complete course, lesson curriculum, assessments, and review.</p>
        </div>
        <Link className="teaching-primary-action" to="/tutor-teaching/courses/new">
          <DashboardIcon name="courses" size={18} />
          Create course
        </Link>
      </header>

      <section className="teaching-summary" aria-label="Course summary">
        <article><span>All courses</span><strong>{courses.length}</strong><small>Your complete teaching library</small></article>
        <article><span>In preparation</span><strong>{draftCount}</strong><small>Drafts and returned courses</small></article>
        <article><span>Awaiting review</span><strong>{reviewCount}</strong><small>Locked while administrators review</small></article>
        <article><span>Published</span><strong>{publishedCount}</strong><small>Visible in the marketplace</small></article>
      </section>

      <section className="teaching-flow" aria-labelledby="teaching-flow-title">
        <div className="teaching-section-heading">
          <div>
            <span>Recommended order</span>
            <h2 id="teaching-flow-title">Follow one clear publishing path</h2>
          </div>
          <p>Each level unlocks the information needed by the next one.</p>
        </div>
        <ol>
          <li className={tutorSubjects.length ? 'is-complete' : ''}>
            <span>01</span><div><strong>Teaching subjects</strong><small>State what and where you are qualified to teach.</small></div>
          </li>
          <li className={courses.length ? 'is-complete' : ''}>
            <span>02</span><div><strong>Course details</strong><small>Set the promise, level, price, and marketplace image.</small></div>
          </li>
          <li className={courses.some((course) => course.lessons?.length) ? 'is-complete' : ''}>
            <span>03</span><div><strong>Curriculum</strong><small>Arrange lessons in the order students will learn.</small></div>
          </li>
          <li className={courses.some((course) => course.assessment_readiness?.is_ready) ? 'is-complete' : ''}>
            <span>04</span><div><strong>Assessments</strong><small>Add initial and final checks to measure impact.</small></div>
          </li>
          <li className={reviewCount || publishedCount ? 'is-complete' : ''}>
            <span>05</span><div><strong>Review and publish</strong><small>Check readiness before sending the course to admin.</small></div>
          </li>
        </ol>
      </section>

      <section className="teaching-content-grid">
        <div className="teaching-course-library">
          <div className="teaching-section-heading">
            <div><span>Course library</span><h2>Your courses</h2></div>
            <Link to="/tutor-teaching/courses/new">New course</Link>
          </div>
          {coursesQuery.isLoading ? (
            <TeachingSkeleton />
          ) : coursesQuery.isError ? (
            <div className="teaching-empty" role="alert">
              <h3>Courses could not be loaded</h3>
              <p>{getApiErrorMessage(coursesQuery.error)}</p>
              <button type="button" onClick={() => coursesQuery.refetch()}>Try again</button>
            </div>
          ) : courses.length ? (
            <div className="teaching-course-list">
              {courses.map((course) => <CourseRow key={course.id} course={course} />)}
            </div>
          ) : (
            <div className="teaching-empty">
              <DashboardIcon name="courses" size={28} />
              <h3>Create your first course</h3>
              <p>Start with the course details. You will add lessons and assessments after it is saved.</p>
              <Link to="/tutor-teaching/courses/new">Create course</Link>
            </div>
          )}
        </div>

        <aside className="teaching-subject-panel" id="subjects">
          <div className="teaching-section-heading">
            <div><span>Foundation</span><h2>Teaching subjects</h2></div>
            <button type="button" onClick={() => setShowSubjectForm((current) => !current)}>
              {showSubjectForm ? 'Close' : 'Add'}
            </button>
          </div>
          <p>Courses can only use subjects already listed in your teaching profile.</p>
          {tutorSubjectsQuery.isLoading ? <TeachingSkeleton /> : (
            <div className="teaching-subject-list">
              {tutorSubjects.map((item) => (
                <div key={item.id}>
                  <span><DashboardIcon name="verification" size={16} /></span>
                  <div><strong>{item.subject_name}</strong><small>{item.level_display} / {item.experience_years ?? 0} years</small></div>
                </div>
              ))}
              {!tutorSubjects.length ? <p className="teaching-subject-empty">No teaching subjects added yet.</p> : null}
            </div>
          )}
          {showSubjectForm ? (
            <form className="teaching-subject-form" onSubmit={submitSubject}>
              <label>
                <span>Subject</span>
                <select required value={subjectForm.subject} onChange={(event) => setSubjectForm((current) => ({ ...current, subject: event.target.value }))}>
                  <option value="">Choose a subject</option>
                  {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </label>
              <label>
                <span>Education level</span>
                <select value={subjectForm.level} onChange={(event) => setSubjectForm((current) => ({ ...current, level: event.target.value }))}>
                  <option value="PRIMARY">Primary</option>
                  <option value="SECONDARY_LOWER">Secondary lower level</option>
                  <option value="SECONDARY_UPPER">Secondary upper level</option>
                  <option value="UNIVERSITY">University</option>
                </select>
              </label>
              <label>
                <span>Experience in years</span>
                <input type="number" min="0" value={subjectForm.experience_years} onChange={(event) => setSubjectForm((current) => ({ ...current, experience_years: event.target.value }))} />
              </label>
              <button type="submit" disabled={createSubjectMutation.isPending}>
                {createSubjectMutation.isPending ? 'Adding...' : 'Add teaching subject'}
              </button>
            </form>
          ) : null}
        </aside>
      </section>
    </section>
  )
}
