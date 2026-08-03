import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { listMyCourses, listTutorSubjects } from '../api/services/catalog.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { formatEducationLevel } from '../constants/educationLevels.js'
import {
  courseCompletion,
  formatCourseStatus,
  formatMoney,
  isCourseEditable,
} from './tutorTeaching/courseHelpers.js'
import './TutorTeachingPage.css'

export function TutorSubjectPage() {
  const { tutorSubjectId } = useParams()
  const subjectsQuery = useQuery({
    queryKey: queryKeys.catalog.tutorSubjects,
    queryFn: () => listTutorSubjects().then((response) => response.data),
  })
  const coursesQuery = useQuery({
    queryKey: queryKeys.catalog.tutorCourses,
    queryFn: () => listMyCourses().then((response) => response.data),
  })
  const teachingArea = (subjectsQuery.data || []).find((item) => String(item.id) === String(tutorSubjectId))
  const courses = (coursesQuery.data || []).filter((course) => (
    Number(course.subject) === Number(teachingArea?.subject)
    && formatEducationLevel(course.academic_level) === teachingArea?.level_display
  ))

  if (subjectsQuery.isLoading || coursesQuery.isLoading) {
    return <section className="course-workspace-loading" aria-busy="true"><span /><span /><span /></section>
  }
  if (subjectsQuery.isError || coursesQuery.isError) {
    return <section className="teaching-empty" role="alert"><h1>Teaching area could not be loaded</h1><p>{getApiErrorMessage(subjectsQuery.error || coursesQuery.error)}</p></section>
  }
  if (!teachingArea) {
    return <section className="teaching-empty"><h1>Teaching subject not found</h1><p>This subject is not connected to your tutor account.</p><Link to="/tutor-teaching">Return to teaching workspace</Link></section>
  }

  const createCoursePath = `/tutor-teaching/courses/new?subject=${teachingArea.subject}&level=${teachingArea.level}&teachingArea=${teachingArea.id}`

  return (
    <section className="tutor-teaching-page">
      <div className="new-course-breadcrumb"><Link to="/tutor-teaching">Subjects and levels</Link><span>/</span><strong>{teachingArea.subject_name}</strong></div>
      <header className="teaching-hero">
        <div><p className="eyebrow">Level 2 / Courses</p><h1>{teachingArea.subject_name}</h1><p>{teachingArea.level_display} learning offers, followed by their lessons and course assessments.</p></div>
        <Link className="teaching-primary-action" to={createCoursePath}><DashboardIcon name="courses" size={18} />Create course</Link>
      </header>
      <section className="teaching-course-library">
        <div className="teaching-section-heading"><div><span>Course library</span><h2>{teachingArea.subject_name} courses</h2></div><span>{courses.length} course{courses.length === 1 ? '' : 's'}</span></div>
        {courses.length ? <div className="teaching-course-list">
          {courses.map((course) => {
            const completion = courseCompletion(course)
            return <article className="teaching-course-row" key={course.id}>
              <div className="teaching-course-row-main"><div className="teaching-course-icon"><DashboardIcon name="courses" size={20} /></div><div><div className="teaching-course-title"><h3>{course.title}</h3><span className={`teaching-status is-${String(course.status).toLowerCase().replaceAll('_', '-')}`}>{formatCourseStatus(course.status)}</span></div><p>{course.academic_level || teachingArea.level_display}</p><dl className="teaching-course-meta"><div><dt>Lessons</dt><dd>{course.lessons?.length || 0}</dd></div><div><dt>Price</dt><dd>{formatMoney(course.price)}</dd></div><div><dt>Setup</dt><dd>{completion.percent}%</dd></div></dl></div></div>
              <div className="teaching-course-progress" aria-label={`${completion.percent}% setup complete`}><span style={{ width: `${completion.percent}%` }} /></div>
              <div className="teaching-course-actions"><Link className="is-primary" to={`/tutor-teaching/courses/${course.id}/details`}>{isCourseEditable(course.status) ? 'Open course workspace' : 'View course'}</Link><Link to={`/tutor-teaching/courses/${course.id}/curriculum`}>Lessons</Link><Link to={`/tutor-teaching/courses/${course.id}/assessments`}>Assessments</Link></div>
            </article>
          })}
        </div> : <div className="teaching-empty"><DashboardIcon name="courses" size={28} /><h3>No course in this subject yet</h3><p>Create the course details first, then add lessons and the initial and final assessments.</p><Link to={createCoursePath}>Create first course</Link></div>}
      </section>
    </section>
  )
}
