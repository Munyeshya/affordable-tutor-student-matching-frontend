import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import {
  createLesson,
  listLessons,
  listMyCourses,
  updateLesson,
} from '../api/services/catalog.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { formatCourseStatus, isCourseEditable } from './tutorTeaching/courseHelpers.js'
import './TutorTeachingPage.css'

const EMPTY_LESSON = {
  title: '',
  topic: '',
  description: '',
  duration: '',
  order_number: '1',
  video_url: '',
  video_file: null,
  is_preview: false,
}

function lessonToForm(lesson) {
  return {
    title: lesson.title || '',
    topic: lesson.topic || '',
    description: lesson.description || '',
    duration: lesson.duration ?? '',
    order_number: String(lesson.order_number || 1),
    video_url: lesson.video_url || '',
    video_file: null,
    is_preview: Boolean(lesson.is_preview),
  }
}

function buildLessonPayload(form) {
  const values = {
    title: form.title,
    topic: form.topic,
    description: form.description,
    duration: form.duration ? Number(form.duration) : null,
    order_number: Number(form.order_number),
    video_url: form.video_url,
    is_preview: form.is_preview,
  }
  if (!form.video_file) return values

  const data = new FormData()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== null) data.append(key, String(value))
  })
  data.append('video_file', form.video_file)
  return data
}

export function TutorLessonPage({ isNew = false }) {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(null)
  const coursesQuery = useQuery({
    queryKey: queryKeys.catalog.tutorCourses,
    queryFn: () => listMyCourses().then((response) => response.data),
  })
  const lessonsQuery = useQuery({
    queryKey: queryKeys.catalog.courseLessons(courseId),
    queryFn: () => listLessons(courseId).then((response) => response.data),
  })
  const course = (coursesQuery.data || []).find((item) => String(item.id) === String(courseId))
  const lessons = lessonsQuery.data || []
  const lesson = lessons.find((item) => String(item.id) === String(lessonId))
  const editable = isCourseEditable(course?.status)
  const nextOrder = lessons.length
    ? Math.max(...lessons.map((item) => Number(item.order_number) || 0)) + 1
    : 1
  const initialForm = isNew
    ? { ...EMPTY_LESSON, order_number: String(nextOrder) }
    : lesson
      ? lessonToForm(lesson)
      : EMPTY_LESSON
  const activeForm = form || initialForm

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = buildLessonPayload(activeForm)
      return isNew ? createLesson(courseId, payload) : updateLesson(lessonId, payload)
    },
    onSuccess: async (response) => {
      const savedLesson = response.data
      toast.success(isNew ? 'Lesson added to the curriculum.' : 'Lesson changes saved.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.courseLessons(courseId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.tutorCourses }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard }),
      ])
      if (isNew) navigate(`/tutor-teaching/courses/${courseId}/lessons/${savedLesson.id}`, { replace: true })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not save the lesson.')),
  })

  if (coursesQuery.isLoading || lessonsQuery.isLoading) {
    return <section className="course-workspace-loading" aria-busy="true"><span /><span /><span /></section>
  }
  if (coursesQuery.isError || lessonsQuery.isError) {
    return <section className="teaching-empty" role="alert"><h1>Lesson workspace could not be loaded</h1><p>{getApiErrorMessage(coursesQuery.error || lessonsQuery.error)}</p><button type="button" onClick={() => { coursesQuery.refetch(); lessonsQuery.refetch() }}>Try again</button></section>
  }
  if (!course || (!isNew && !lesson)) {
    return <section className="teaching-empty"><h1>Lesson not found</h1><p>This lesson is not available in your teaching account.</p><Link to="/tutor-teaching">Return to courses</Link></section>
  }

  return (
    <section className="tutor-teaching-page">
      <div className="lesson-breadcrumb">
        <Link to="/tutor-teaching">Courses</Link><span>/</span>
        <Link to={`/tutor-teaching/courses/${course.id}/curriculum`}>{course.title}</Link><span>/</span>
        <strong>{isNew ? 'New lesson' : lesson.title}</strong>
      </div>
      <div className="lesson-editor-layout">
        <aside className="lesson-context">
          <span><DashboardIcon name="courses" size={22} /></span>
          <small>{course.subject_name}</small>
          <h2>{course.title}</h2>
          <p>{formatCourseStatus(course.status)}</p>
          <dl>
            <div><dt>Lesson position</dt><dd>{activeForm.order_number || '-'}</dd></div>
            <div><dt>Curriculum size</dt><dd>{lessons.length + (isNew ? 1 : 0)}</dd></div>
            <div><dt>Visibility</dt><dd>{activeForm.is_preview ? 'Public preview' : 'Enrolled only'}</dd></div>
          </dl>
          <Link to={`/tutor-teaching/courses/${course.id}/curriculum`}>Return to curriculum</Link>
        </aside>
        <section className="lesson-editor-panel">
          <header>
            <div><span>{isNew ? 'New curriculum item' : `Lesson ${lesson.order_number}`}</span><h1>{isNew ? 'Create a lesson' : 'Edit lesson content'}</h1><p>Keep one clear topic, outcome, and learning activity per lesson.</p></div>
            {!editable ? <span className="course-lock-label"><DashboardIcon name="verification" size={16} /> Content locked</span> : null}
          </header>
          {!editable ? <p className="lesson-lock-note">This course is {formatCourseStatus(course.status).toLowerCase()}. You can review this lesson, but changes are paused until the course is returned.</p> : null}
          <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate() }}>
            <label className="is-wide"><span>Lesson title</span><input required disabled={!editable} value={activeForm.title} onChange={(event) => setForm((current) => ({ ...(current || initialForm), title: event.target.value }))} placeholder="For example, Solving two-step equations" /></label>
            <label><span>Topic</span><input required disabled={!editable} value={activeForm.topic} onChange={(event) => setForm((current) => ({ ...(current || initialForm), topic: event.target.value }))} placeholder="Algebraic equations" /></label>
            <label><span>Duration in minutes</span><input required disabled={!editable} type="number" min="1" value={activeForm.duration} onChange={(event) => setForm((current) => ({ ...(current || initialForm), duration: event.target.value }))} /></label>
            <label><span>Curriculum order</span><input required disabled={!editable} type="number" min="1" value={activeForm.order_number} onChange={(event) => setForm((current) => ({ ...(current || initialForm), order_number: event.target.value }))} /><small>Each lesson in this course needs a unique position.</small></label>
            <label><span>External video URL</span><input disabled={!editable} type="url" value={activeForm.video_url} onChange={(event) => setForm((current) => ({ ...(current || initialForm), video_url: event.target.value }))} placeholder="https://..." /></label>
            <label className="is-wide"><span>Lesson description and expected coverage</span><textarea required disabled={!editable} rows="7" value={activeForm.description} onChange={(event) => setForm((current) => ({ ...(current || initialForm), description: event.target.value }))} placeholder="Explain what is covered, what students will practise, and what they should know by the end." /></label>
            <label className="is-wide"><span>Upload lesson video</span><input disabled={!editable} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setForm((current) => ({ ...(current || initialForm), video_file: event.target.files?.[0] || null }))} /><small>MP4, WebM, or MOV. Maximum 100 MB. An upload takes priority over the external URL.</small></label>
            <label className="lesson-preview-option">
              <input disabled={!editable} type="checkbox" checked={activeForm.is_preview} onChange={(event) => setForm((current) => ({ ...(current || initialForm), is_preview: event.target.checked }))} />
              <span><strong>Make this a public preview</strong><small>Visitors can use this lesson to understand your teaching style before buying.</small></span>
            </label>
            {editable ? <footer><Link to={`/tutor-teaching/courses/${course.id}/curriculum`}>Cancel</Link><button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : isNew ? 'Create lesson' : 'Save lesson'}</button></footer> : null}
          </form>
          {!isNew && editable ? (
            <div className="lesson-assessment-next">
              <DashboardIcon name="assessments" size={22} />
              <div><strong>Next: measure this lesson</strong><p>Create initial and final assessments after the lesson content is ready.</p></div>
              <Link to={`/assessments?lesson=${lesson.id}`}>Open assessments</Link>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  )
}
