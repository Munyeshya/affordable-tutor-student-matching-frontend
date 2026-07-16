import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import {
  createCourse,
  createLesson,
  createTutorSubject,
  listLessons,
  listMyCourses,
  listTutorSubjects,
  submitCourseForReview,
} from '../api/services/catalog.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSubjectsQuery } from '../hooks/useCommonQueries'
import { queryKeys } from '../api/queryKeys'
import './TutorTeachingPage.css'


const EDITABLE_COURSE_STATUSES = new Set(['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'])

function formatStatus(value) {
  return String(value || 'Unknown').toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

export function TutorTeachingPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [subjectForm, setSubjectForm] = useState({ subject: '', level: 'PRIMARY', experience_years: '' })
  const [courseForm, setCourseForm] = useState({ title: '', description: '', subject: '', academic_level: '', price: '' })
  const [lessonForm, setLessonForm] = useState({ title: '', topic: '', description: '', order_number: '1', duration: '', is_preview: false })
  const [notice, setNotice] = useState('')


  const subjectsQuery = useSubjectsQuery({ enabled: isAuthenticated })

  const tutorSubjectsQuery = useQuery({
    queryKey: queryKeys.catalog.tutorSubjects,
    queryFn: async () => (await listTutorSubjects()).data,
    enabled: isAuthenticated && user?.role === 'TUTOR',
  })

  const coursesQuery = useQuery({
    queryKey: queryKeys.catalog.tutorCourses,
    queryFn: async () => (await listMyCourses()).data,
    enabled: isAuthenticated && user?.role === 'TUTOR',
  })

  const lessonsQuery = useQuery({
    queryKey: queryKeys.catalog.courseLessons(selectedCourseId),
    queryFn: async () => (await listLessons(selectedCourseId)).data,
    enabled: Boolean(selectedCourseId) && isAuthenticated && user?.role === 'TUTOR',
  })

  const tutorSubjects = Array.isArray(tutorSubjectsQuery.data) ? tutorSubjectsQuery.data : []
  const subjects = Array.isArray(subjectsQuery.data) ? subjectsQuery.data : []
  const courses = Array.isArray(coursesQuery.data) ? coursesQuery.data : []
  const lessons = Array.isArray(lessonsQuery.data) ? lessonsQuery.data : []
  const selectedCourse = courses.find((course) => String(course.id) === selectedCourseId)
  const canEditSelectedCourse = Boolean(selectedCourse && EDITABLE_COURSE_STATUSES.has(selectedCourse.status))

  const createSubjectMutation = useMutation({
    mutationFn: async () => (await createTutorSubject({
      subject: subjectForm.subject,
      level: subjectForm.level,
      experience_years: subjectForm.experience_years ? Number(subjectForm.experience_years) : null,
    })).data,
    onSuccess: async () => {
      setNotice('Subject added successfully.')
      toast.success('Subject added successfully.')
      setSubjectForm({ subject: '', level: 'PRIMARY', experience_years: '' })
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.tutorSubjects })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.checklist })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const createCourseMutation = useMutation({
    mutationFn: async () => (await createCourse({
      title: courseForm.title,
      description: courseForm.description,
      subject: courseForm.subject,
      academic_level: courseForm.academic_level,
      price: courseForm.price,
    })).data,
    onSuccess: async (createdCourse) => {
      setNotice('Course created successfully.')
      toast.success('Course created successfully.')
      setCourseForm({ title: '', description: '', subject: '', academic_level: '', price: '' })
      setSelectedCourseId(String(createdCourse.id))
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.tutorCourses })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const createLessonMutation = useMutation({
    mutationFn: async () => (await createLesson(selectedCourseId, {
      title: lessonForm.title,
      topic: lessonForm.topic,
      description: lessonForm.description,
      order_number: Number(lessonForm.order_number || 1),
      duration: lessonForm.duration ? Number(lessonForm.duration) : null,
      is_preview: lessonForm.is_preview,
    })).data,
    onSuccess: async () => {
      setNotice('Lesson added successfully.')
      toast.success('Lesson added successfully.')
      setLessonForm({ title: '', topic: '', description: '', order_number: '1', duration: '', is_preview: false })
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.courseLessons(selectedCourseId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.tutorCourses })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const submitCourseMutation = useMutation({
    mutationFn: async (courseId) => (await submitCourseForReview(courseId)).data,
    onSuccess: async () => {
      setNotice('Course submitted for review.')
      toast.success('Course submitted for review.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.tutorCourses })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tutors.dashboard })
    },
    onError: (error) => {
      const missingFields = error.response?.data?.missing_fields
      if (Array.isArray(missingFields) && missingFields.length) {
        toast.error(`${getApiErrorMessage(error)} Missing: ${missingFields.map(formatStatus).join(', ')}.`)
        return
      }
      toast.error(getApiErrorMessage(error))
    },
  })

  if (!isAuthenticated) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Tutor teaching</p>
        <h1>Sign in to manage your subjects and lessons.</h1>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create account</Link>
        </div>
      </section>
    )
  }

  if (user?.role !== 'TUTOR') {
    return (
      <section className="page-card card">
        <p className="eyebrow">Tutor teaching</p>
        <h1>This area is only for tutors.</h1>
        <div className="hero-actions">
          <Link className="primary-button" to="/tutors">Browse tutors</Link>
          <Link className="secondary-button" to="/contact">Contact support</Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="page-card card">
        <p className="eyebrow">Teaching setup</p>
        <h1>Manage the subjects, courses, and lessons you teach.</h1>
        <p className="supporting-text">Add only the subjects and levels you are qualified to teach.</p>
        {notice ? <p className="supporting-text" role="status" aria-live="polite">{notice}</p> : null}
      </section>

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Add subject</p>
          <h2>Tell us what you teach.</h2>
          <form className="steps-list" onSubmit={(event) => {
            event.preventDefault()
            createSubjectMutation.mutate()
          }}>
            <label className="form-field">
              <span>Subject</span>
              <select value={subjectForm.subject} onChange={(event) => setSubjectForm((current) => ({ ...current, subject: event.target.value }))}>
                <option value="">Choose a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Education level</span>
              <select value={subjectForm.level} onChange={(event) => setSubjectForm((current) => ({ ...current, level: event.target.value }))}>
                <option value="PRIMARY">Primary</option>
                <option value="SECONDARY_LOWER">Secondary lower level</option>
                <option value="SECONDARY_UPPER">Secondary upper level</option>
                <option value="UNIVERSITY">University</option>
              </select>
            </label>
            <label className="form-field">
              <span>Experience (years)</span>
              <input type="number" min="0" placeholder="For example, 3" value={subjectForm.experience_years} onChange={(event) => setSubjectForm((current) => ({ ...current, experience_years: event.target.value }))} />
            </label>
            <button className="primary-button" type="submit" disabled={createSubjectMutation.isPending}>Add subject</button>
          </form>
          <div className="trust-marks" style={{ marginTop: '1rem' }}>
            {tutorSubjects.map((item) => (
              <span className="trust-mark" key={item.id}>
                {item.subject_name} - {item.level_display}
              </span>
            ))}
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">Create course</p>
          <h2>Package a lesson series.</h2>
          <form className="steps-list" onSubmit={(event) => {
            event.preventDefault()
            createCourseMutation.mutate()
          }}>
            <label className="form-field">
              <span>Course title</span>
              <input type="text" value={courseForm.title} onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label className="form-field">
              <span>Teaching subject</span>
              <select value={courseForm.subject} onChange={(event) => setCourseForm((current) => ({ ...current, subject: event.target.value }))}>
                <option value="">Choose a subject</option>
                {tutorSubjects.map((item) => (
                  <option key={item.id} value={item.subject}>{item.subject_name} - {item.level_display}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Academic level</span>
              <input type="text" value={courseForm.academic_level} onChange={(event) => setCourseForm((current) => ({ ...current, academic_level: event.target.value }))} />
            </label>
            <label className="form-field">
              <span>Price (RWF)</span>
              <input type="number" min="0" value={courseForm.price} onChange={(event) => setCourseForm((current) => ({ ...current, price: event.target.value }))} />
            </label>
            <label className="form-field">
              <span>Course description</span>
              <textarea rows="4" value={courseForm.description} onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <button className="primary-button" type="submit" disabled={createCourseMutation.isPending}>Create course</button>
          </form>
        </article>
      </section>

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">My courses</p>
          <h2>Ready-to-review course drafts.</h2>
          {coursesQuery.isLoading ? (
            <p className="supporting-text">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="supporting-text">No courses yet.</p>
          ) : (
            <div className="mini-list">
              {courses.map((course) => (
                <div key={course.id}>
                  <span>{course.title}</span>
                  <small>{course.subject_name} / {formatStatus(course.status)}</small>
                  {course.latest_moderation?.reason ? (
                    <p className={`tutor-course-review-feedback is-${course.status.toLowerCase().replaceAll('_', '-')}`}>
                      <strong>Administrator feedback</strong>
                      <span>{course.latest_moderation.reason}</span>
                    </p>
                  ) : null}
                  <div className="hero-actions" style={{ marginTop: '0.75rem' }}>
                    <button className="secondary-button" type="button" onClick={() => setSelectedCourseId(String(course.id))}>{EDITABLE_COURSE_STATUSES.has(course.status) ? 'Manage lessons' : 'View lessons'}</button>
                    <button className="primary-button" type="button" onClick={() => submitCourseMutation.mutate(course.id)} disabled={submitCourseMutation.isPending || !EDITABLE_COURSE_STATUSES.has(course.status)}>
                      {course.status === 'PENDING_REVIEW' ? 'Awaiting review' : course.status === 'PUBLISHED' ? 'Published' : course.status === 'DRAFT' ? 'Submit for review' : 'Resubmit for review'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel card">
          <p className="eyebrow">Lessons</p>
          <h2>{selectedCourseId ? canEditSelectedCourse ? 'Add lessons to the selected course.' : 'Review the submitted lesson list.' : 'Select a course to manage lessons.'}</h2>
          {selectedCourseId ? (
            <>
              {canEditSelectedCourse ? <form className="steps-list" onSubmit={(event) => {
                event.preventDefault()
                createLessonMutation.mutate()
              }}>
                <label className="form-field">
                  <span>Lesson title</span>
                  <input type="text" value={lessonForm.title} onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label className="form-field">
                  <span>Topic</span>
                  <input type="text" value={lessonForm.topic} onChange={(event) => setLessonForm((current) => ({ ...current, topic: event.target.value }))} />
                </label>
                <label className="form-field">
                  <span>Lesson description</span>
                  <textarea rows="3" value={lessonForm.description} onChange={(event) => setLessonForm((current) => ({ ...current, description: event.target.value }))} />
                </label>
                <label className="form-field">
                  <span>Lesson order</span>
                  <input type="number" min="1" value={lessonForm.order_number} onChange={(event) => setLessonForm((current) => ({ ...current, order_number: event.target.value }))} />
                </label>
                <label className="form-field">
                  <span>Duration (minutes)</span>
                  <input type="number" min="1" value={lessonForm.duration} onChange={(event) => setLessonForm((current) => ({ ...current, duration: event.target.value }))} />
                </label>
                <label className="check-row">
                  <input type="checkbox" checked={lessonForm.is_preview} onChange={(event) => setLessonForm((current) => ({ ...current, is_preview: event.target.checked }))} />
                  <span>Preview lesson</span>
                </label>
                <button className="primary-button" type="submit" disabled={createLessonMutation.isPending}>Add lesson</button>
              </form> : <p className="tutor-course-edit-lock">{selectedCourse?.status === 'PUBLISHED' ? 'This course is published. Its reviewed content is locked from silent changes.' : 'This course is awaiting an administrator decision. You can review lessons now and edit them after the course is returned.'}</p>}
              <div className="mini-list" style={{ marginTop: '1rem' }}>
                {lessonsQuery.isLoading ? (
                  <div><span>Loading lessons...</span></div>
                ) : lessons.length === 0 ? (
                  <div><span>No lessons for this course yet.</span></div>
                ) : lessons.map((lesson) => (
                  <div key={lesson.id}>
                    <span>{lesson.order_number}. {lesson.title}</span>
                    <small>{lesson.topic || 'No topic'} / {lesson.is_preview ? 'Preview' : 'Private'}</small>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="supporting-text">Choose a course from the list to start adding lessons.</p>
          )}
        </article>
      </section>
    </>
  )
}
