import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import {
  createCourse,
  listLessons,
  listMyCourses,
  listTutorSubjects,
  submitCourseForReview,
  updateCourse,
} from '../api/services/catalog.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { CourseWorkspaceNav } from './tutorTeaching/CourseWorkspaceNav.jsx'
import {
  courseCompletion,
  formatCourseStatus,
  formatMoney,
  isCourseEditable,
} from './tutorTeaching/courseHelpers.js'
import './TutorTeachingPage.css'

const EMPTY_COURSE = {
  title: '',
  description: '',
  subject: '',
  academic_level: '',
  price: '',
  thumbnail: null,
}

function courseToForm(course) {
  return {
    title: course.title || '',
    description: course.description || '',
    subject: String(course.subject || ''),
    academic_level: course.academic_level || '',
    price: course.price ?? '',
    thumbnail: null,
  }
}

function buildCoursePayload(form) {
  if (!form.thumbnail) {
    return {
      title: form.title,
      description: form.description,
      subject: Number(form.subject),
      academic_level: form.academic_level,
      price: form.price,
    }
  }

  const data = new FormData()
  data.append('title', form.title)
  data.append('description', form.description)
  data.append('subject', form.subject)
  data.append('academic_level', form.academic_level)
  data.append('price', form.price)
  data.append('thumbnail', form.thumbnail)
  return data
}

function WorkspaceLoading() {
  return <section className="course-workspace-loading" aria-busy="true"><span /><span /><span /></section>
}

function CourseDetailsSection({ course, form, editable, busy, tutorSubjects, onChange, onFile, onSubmit }) {
  return (
    <section className="course-workspace-panel">
      <header>
        <div><span>Step 01</span><h1>Course details</h1><p>Explain exactly what students will learn and what it will cost.</p></div>
        {!editable ? <span className="course-lock-label"><DashboardIcon name="verification" size={16} /> Content locked</span> : null}
      </header>
      <form className="course-details-form" onSubmit={onSubmit}>
        <label className="is-wide"><span>Course title</span><input required disabled={!editable} value={form.title} onChange={(event) => onChange('title', event.target.value)} placeholder="For example, Mastering lower secondary algebra" /></label>
        <label><span>Teaching subject</span><select required disabled={!editable} value={form.subject} onChange={(event) => onChange('subject', event.target.value)}><option value="">Choose subject</option>{tutorSubjects.map((item) => <option key={item.id} value={item.subject}>{item.subject_name} / {item.level_display}</option>)}</select></label>
        <label><span>Academic level</span><input required disabled={!editable} value={form.academic_level} onChange={(event) => onChange('academic_level', event.target.value)} placeholder="Secondary lower level" /></label>
        <label><span>Course price (RWF)</span><input required disabled={!editable} type="number" min="0" value={form.price} onChange={(event) => onChange('price', event.target.value)} /></label>
        <label><span>Marketplace image</span><input disabled={!editable} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onFile(event.target.files?.[0] || null)} /><small>JPEG, PNG, or WebP. Maximum 10 MB.</small></label>
        <label className="is-wide"><span>Course description</span><textarea required disabled={!editable} minLength="20" rows="7" value={form.description} onChange={(event) => onChange('description', event.target.value)} placeholder="Describe the learning problem, what the course covers, and who it is designed for." /><small>{form.description.trim().length}/20 minimum characters</small></label>
        {editable ? <footer><Link to="/tutor-teaching">Cancel</Link><button type="submit" disabled={busy}>{busy ? 'Saving...' : course ? 'Save course details' : 'Create course and continue'}</button></footer> : null}
      </form>
    </section>
  )
}

function CurriculumSection({ course, lessons, loading }) {
  const editable = isCourseEditable(course.status)

  return (
    <section className="course-workspace-panel">
      <header>
        <div><span>Step 02</span><h1>Build the curriculum</h1><p>Arrange lessons in the order students should complete them.</p></div>
        {editable ? <Link className="course-panel-action" to={`/tutor-teaching/courses/${course.id}/lessons/new`}>Add lesson</Link> : null}
      </header>
      <div className="curriculum-summary">
        <div><span>Lessons</span><strong>{lessons.length}</strong></div>
        <div><span>Total duration</span><strong>{lessons.reduce((sum, lesson) => sum + Number(lesson.duration || 0), 0)} min</strong></div>
        <div><span>Public previews</span><strong>{lessons.filter((lesson) => lesson.is_preview).length}</strong></div>
      </div>
      {loading ? <WorkspaceLoading /> : lessons.length ? (
        <ol className="course-curriculum-list">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <span>{String(lesson.order_number).padStart(2, '0')}</span>
              <div>
                <small>{lesson.topic || 'Topic not set'}</small>
                <strong>{lesson.title}</strong>
                <p>{lesson.description || 'No lesson description yet.'}</p>
                <div><span>{lesson.duration ? `${lesson.duration} minutes` : 'Duration not set'}</span><span>{lesson.is_preview ? 'Public preview' : 'Enrolled students'}</span>{lesson.has_video_file || lesson.video_url ? <span>Video ready</span> : <span>No video</span>}</div>
              </div>
              <Link to={`/tutor-teaching/courses/${course.id}/lessons/${lesson.id}`}>{editable ? 'Edit lesson' : 'View lesson'}</Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="teaching-empty">
          <DashboardIcon name="courses" size={28} />
          <h3>No lessons added</h3>
          <p>Create the first lesson, then return here to see the complete learning sequence.</p>
          {editable ? <Link to={`/tutor-teaching/courses/${course.id}/lessons/new`}>Add first lesson</Link> : null}
        </div>
      )}
      <footer className="course-panel-footer">
        <Link to={`/tutor-teaching/courses/${course.id}/details`}>Previous: details</Link>
        <Link className="is-primary" to={`/tutor-teaching/courses/${course.id}/assessments`}>Next: assessments</Link>
      </footer>
    </section>
  )
}

function AssessmentsSection({ course, lessons }) {
  const readyLessonIds = new Set(course.assessment_readiness?.ready_lesson_ids || [])

  return (
    <section className="course-workspace-panel">
      <header><div><span>Step 03</span><h1>Measure learning impact</h1><p>At least one lesson needs an initial and final assessment with questions.</p></div></header>
      <div className={`assessment-requirement ${course.assessment_readiness?.is_ready ? 'is-ready' : ''}`}>
        <DashboardIcon name={course.assessment_readiness?.is_ready ? 'verification' : 'assessments'} size={22} />
        <div><strong>{course.assessment_readiness?.is_ready ? 'Assessment requirement complete' : 'Assessment setup required'}</strong><p>{course.assessment_readiness?.requirement || 'One lesson must have initial and final assessments with questions.'}</p></div>
      </div>
      {lessons.length ? (
        <div className="course-assessment-lessons">
          {lessons.map((lesson) => (
            <article key={lesson.id}>
              <span className={readyLessonIds.has(lesson.id) ? 'is-ready' : ''}>{readyLessonIds.has(lesson.id) ? '✓' : lesson.order_number}</span>
              <div><strong>{lesson.title}</strong><small>{readyLessonIds.has(lesson.id) ? 'Initial and final checks ready' : 'Assessment pair is incomplete'}</small></div>
              {isCourseEditable(course.status) ? <Link to={`/assessments?lesson=${lesson.id}`}>{readyLessonIds.has(lesson.id) ? 'Manage checks' : 'Create checks'}</Link> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="teaching-empty"><h3>Add a lesson first</h3><p>Assessments are attached to a specific lesson in the curriculum.</p><Link to={`/tutor-teaching/courses/${course.id}/curriculum`}>Open curriculum</Link></div>
      )}
      <footer className="course-panel-footer">
        <Link to={`/tutor-teaching/courses/${course.id}/curriculum`}>Previous: curriculum</Link>
        <Link className="is-primary" to={`/tutor-teaching/courses/${course.id}/review`}>Next: review</Link>
      </footer>
    </section>
  )
}

function ReviewSection({ course, lessons, busy, onSubmit }) {
  const completion = courseCompletion(course)
  const editable = isCourseEditable(course.status)
  const canSubmit = editable && completion.details && completion.curriculum && completion.assessments
  const checks = [
    { complete: completion.details, title: 'Course details', text: 'Title, description, subject, level, and price are present.', to: 'details' },
    { complete: completion.curriculum, title: 'Curriculum', text: `${lessons.length} lesson${lessons.length === 1 ? '' : 's'} arranged for students.`, to: 'curriculum' },
    { complete: completion.assessments, title: 'Learning measurement', text: 'Initial and final checks with questions are required.', to: 'assessments' },
  ]

  return (
    <section className="course-workspace-panel">
      <header><div><span>Step 04</span><h1>Review and submit</h1><p>Confirm the student-facing offer before administrators review it.</p></div><span className={`teaching-status is-${course.status.toLowerCase().replaceAll('_', '-')}`}>{formatCourseStatus(course.status)}</span></header>
      <div className="course-review-overview">
        <div><span>Readiness</span><strong>{completion.percent}%</strong><progress value={completion.completed} max="3">{completion.percent}%</progress></div>
        <div><span>Course price</span><strong>{formatMoney(course.price)}</strong><small>{lessons.length ? `${formatMoney(Number(course.price) / lessons.length)} average per lesson` : 'Add lessons to calculate value'}</small></div>
      </div>
      <div className="course-review-checklist">
        {checks.map((check) => (
          <article key={check.title} className={check.complete ? 'is-complete' : ''}>
            <span>{check.complete ? '✓' : '!'}</span>
            <div><strong>{check.title}</strong><p>{check.text}</p></div>
            <Link to={`/tutor-teaching/courses/${course.id}/${check.to}`}>{check.complete ? 'Review' : 'Complete'}</Link>
          </article>
        ))}
      </div>
      {course.latest_moderation?.reason ? <aside className="course-admin-feedback"><strong>Administrator feedback</strong><p>{course.latest_moderation.reason}</p></aside> : null}
      {!editable ? (
        <div className="course-submission-state">
          <DashboardIcon name="verification" size={24} />
          <div><strong>{course.status === 'PUBLISHED' ? 'This course is published' : 'This course is under review'}</strong><p>{course.status === 'PUBLISHED' ? 'Its approved content is visible to students and protected from silent edits.' : 'Editing is paused until an administrator publishes or returns the course.'}</p></div>
        </div>
      ) : (
        <div className="course-submit-panel">
          <div><strong>{canSubmit ? 'Ready for administrator review' : 'Complete the missing steps first'}</strong><p>Submitting locks the course while an administrator checks its content and assessment coverage.</p></div>
          <button type="button" disabled={!canSubmit || busy} onClick={onSubmit}>{busy ? 'Submitting...' : course.status === 'DRAFT' ? 'Submit course for review' : 'Resubmit course for review'}</button>
        </div>
      )}
    </section>
  )
}

export function TutorCoursePage({ section = 'details', isNew = false }) {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(isNew ? EMPTY_COURSE : null)
  const coursesQuery = useQuery({
    queryKey: queryKeys.catalog.tutorCourses,
    queryFn: () => listMyCourses().then((response) => response.data),
    enabled: !isNew,
  })
  const tutorSubjectsQuery = useQuery({
    queryKey: queryKeys.catalog.tutorSubjects,
    queryFn: () => listTutorSubjects().then((response) => response.data),
  })
  const lessonsQuery = useQuery({
    queryKey: queryKeys.catalog.courseLessons(courseId),
    queryFn: () => listLessons(courseId).then((response) => response.data),
    enabled: !isNew && Boolean(courseId),
  })
  const course = (coursesQuery.data || []).find((item) => String(item.id) === String(courseId))
  const lessons = lessonsQuery.data || course?.lessons || []
  const editable = isNew || isCourseEditable(course?.status)
  const activeForm = form || (course ? courseToForm(course) : EMPTY_COURSE)

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = buildCoursePayload(activeForm)
      return isNew ? createCourse(payload) : updateCourse(courseId, payload)
    },
    onSuccess: async (response) => {
      const savedCourse = response.data
      toast.success(isNew ? 'Course created. Add the curriculum next.' : 'Course details saved.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.tutorCourses })
      if (isNew) navigate(`/tutor-teaching/courses/${savedCourse.id}/curriculum`, { replace: true })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not save the course.')),
  })

  const submitMutation = useMutation({
    mutationFn: () => submitCourseForReview(courseId),
    onSuccess: async () => {
      toast.success('Course submitted for administrator review.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.tutorCourses }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard }),
      ])
    },
    onError: (error) => {
      const missing = error.response?.data?.missing_fields
      toast.error(Array.isArray(missing) && missing.length
        ? `${getApiErrorMessage(error)} Missing: ${missing.map(formatCourseStatus).join(', ')}.`
        : getApiErrorMessage(error, 'Could not submit this course.'))
    },
  })

  if (isNew) {
    const tutorSubjects = tutorSubjectsQuery.data || []
    return (
      <section className="tutor-teaching-page">
        <div className="new-course-breadcrumb"><Link to="/tutor-teaching">Teaching workspace</Link><span>/</span><strong>New course</strong></div>
        {!tutorSubjectsQuery.isLoading && !tutorSubjects.length ? (
          <div className="course-prerequisite">
            <DashboardIcon name="verification" size={24} />
            <div><h1>Add a teaching subject first</h1><p>Your course must use a subject already declared in your teaching profile.</p><Link to="/tutor-teaching#subjects">Return to teaching subjects</Link></div>
          </div>
        ) : (
          <CourseDetailsSection
            form={activeForm}
            editable
            busy={saveMutation.isPending}
            tutorSubjects={tutorSubjects}
            onChange={(name, value) => setForm((current) => ({ ...(current || activeForm), [name]: value }))}
            onFile={(thumbnail) => setForm((current) => ({ ...(current || activeForm), thumbnail }))}
            onSubmit={(event) => { event.preventDefault(); saveMutation.mutate() }}
          />
        )}
      </section>
    )
  }

  if (coursesQuery.isLoading || tutorSubjectsQuery.isLoading) return <WorkspaceLoading />
  if (coursesQuery.isError || tutorSubjectsQuery.isError) {
    return <section className="teaching-empty" role="alert"><h1>Course workspace could not be loaded</h1><p>{getApiErrorMessage(coursesQuery.error || tutorSubjectsQuery.error)}</p><button type="button" onClick={() => { coursesQuery.refetch(); tutorSubjectsQuery.refetch() }}>Try again</button></section>
  }
  if (!course) {
    return <section className="teaching-empty"><h1>Course not found</h1><p>This course does not exist or is not part of your teaching account.</p><Link to="/tutor-teaching">Return to courses</Link></section>
  }

  return (
    <section className="tutor-teaching-page">
      <div className="course-workspace-layout">
        <CourseWorkspaceNav course={course} activeSection={section} />
        {section === 'details' ? (
          <CourseDetailsSection
            course={course}
            form={activeForm}
            editable={editable}
            busy={saveMutation.isPending}
            tutorSubjects={tutorSubjectsQuery.data || []}
            onChange={(name, value) => setForm((current) => ({ ...(current || activeForm), [name]: value }))}
            onFile={(thumbnail) => setForm((current) => ({ ...(current || activeForm), thumbnail }))}
            onSubmit={(event) => { event.preventDefault(); saveMutation.mutate() }}
          />
        ) : null}
        {section === 'curriculum' ? <CurriculumSection course={course} lessons={lessons} loading={lessonsQuery.isLoading} /> : null}
        {section === 'assessments' ? <AssessmentsSection course={course} lessons={lessons} /> : null}
        {section === 'review' ? <ReviewSection course={course} lessons={lessons} busy={submitMutation.isPending} onSubmit={() => submitMutation.mutate()} /> : null}
      </div>
    </section>
  )
}
