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
import { EDUCATION_LEVEL_OPTIONS, formatEducationLevel } from '../constants/educationLevels.js'
import {
  isCourseEditable,
} from './tutorTeaching/courseHelpers.js'
import './TutorTeachingPage.css'

const EMPTY_SUBJECT = {
  subject_name: '',
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

export function TutorTeachingPage() {
  const queryClient = useQueryClient()
  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJECT)
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
      subject_input: subjectForm.subject_name.trim(),
      level: subjectForm.level,
      experience_years: subjectForm.experience_years
        ? Number(subjectForm.experience_years)
        : null,
    }),
    onSuccess: async () => {
      toast.success('Teaching subject added.')
      setSubjectForm(EMPTY_SUBJECT)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.tutorSubjects }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.checklist }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not add this teaching subject.')),
  })

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
        <a className="teaching-primary-action" href="#add-teaching-subject"><DashboardIcon name="courses" size={18} />Add teaching subject</a>
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
        <div className="teaching-course-library" id="subjects">
          <div className="teaching-section-heading">
            <div><span>Level 1</span><h2>Your subjects and levels</h2></div>
            <span>{tutorSubjects.length} teaching area{tutorSubjects.length === 1 ? '' : 's'}</span>
          </div>
          {tutorSubjectsQuery.isLoading || coursesQuery.isLoading ? (
            <TeachingSkeleton />
          ) : tutorSubjectsQuery.isError || coursesQuery.isError ? (
            <div className="teaching-empty" role="alert">
              <h3>Teaching areas could not be loaded</h3>
              <p>{getApiErrorMessage(tutorSubjectsQuery.error || coursesQuery.error)}</p>
              <button type="button" onClick={() => Promise.all([tutorSubjectsQuery.refetch(), coursesQuery.refetch()])}>Try again</button>
            </div>
          ) : tutorSubjects.length ? (
            <div className="teaching-subject-directory">
              {tutorSubjects.map((item) => {
                const subjectCourses = courses.filter((course) => (
                  Number(course.subject) === Number(item.subject)
                  && formatEducationLevel(course.academic_level) === item.level_display
                ))
                return (
                  <Link key={item.id} to={`/tutor-teaching/subjects/${item.id}`}>
                    <span><DashboardIcon name="courses" size={19} /></span>
                    <div><strong>{item.subject_name}</strong><small>{item.level_display} / {item.experience_years ?? 0} years experience</small></div>
                    <div><strong>{subjectCourses.length}</strong><small>course{subjectCourses.length === 1 ? '' : 's'}</small></div>
                    <DashboardIcon name="arrowRight" size={17} />
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="teaching-empty">
              <DashboardIcon name="courses" size={28} />
              <h3>Add the first subject you teach</h3>
              <p>Courses are created inside a subject and education level, so learners always understand where they belong.</p>
              <a href="#add-teaching-subject">Add teaching subject</a>
            </div>
          )}
        </div>

        <aside className="teaching-subject-panel" id="add-teaching-subject">
          <div className="teaching-section-heading">
            <div><span>Start here</span><h2>Add a teaching subject</h2></div>
          </div>
          <p>Type the subject exactly as learners know it, then choose the education level where you teach it.</p>
            <form className="teaching-subject-form is-always-open" onSubmit={submitSubject}>
              <label>
                <span>Subject name</span>
                <input required minLength="2" value={subjectForm.subject_name} onChange={(event) => setSubjectForm((current) => ({ ...current, subject_name: event.target.value }))} placeholder="For example, Mathematics" />
                <small>You are not limited to a predefined subject list.</small>
              </label>
              <label>
                <span>Education level</span>
                <select value={subjectForm.level} onChange={(event) => setSubjectForm((current) => ({ ...current, level: event.target.value }))}>
                  {EDUCATION_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
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
        </aside>
      </section>
    </section>
  )
}
