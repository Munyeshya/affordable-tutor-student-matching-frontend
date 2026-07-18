import React, { useEffect, useRef } from 'react'
import { queryKeys } from '../api/queryKeys'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getApiErrorMessage } from '../api/errors'
import { recordLessonView, updateLessonProgress } from '../api/services/payments'
import { useAuth } from '../context/AuthContext.jsx'
import { useLearningLibraryQuery } from '../hooks/useCommonQueries'
import './LearningPage.css'

function formatDate(value) {
  if (!value) return 'Not started'
  return new Intl.DateTimeFormat('en-RW', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(value))
}

function LearningSkeleton() {
  return (
    <div className="learning-workspace-skeleton" aria-hidden="true">
      <span /><span /><span /><span />
    </div>
  )
}

function LessonViewTracker({ lessonId }) {
  const lastRecordedLessonId = useRef(null)

  useEffect(() => {
    if (!lessonId || lastRecordedLessonId.current === lessonId) return
    lastRecordedLessonId.current = lessonId
    recordLessonView(lessonId).catch(() => {
      lastRecordedLessonId.current = null
    })
  }, [lessonId])

  return null
}

function CourseLibraryCard({ course, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`learning-library-card ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(course)}
    >
      <span className="learning-library-thumb">
        {course.thumbnail_url ? <img src={course.thumbnail_url} alt="" /> : course.subject_name?.slice(0, 2).toUpperCase() || 'IS'}
      </span>
      <span className="learning-library-copy">
        <small>{course.subject_name}</small>
        <strong>{course.title}</strong>
        <span>{course.completed_lessons} of {course.total_lessons} lessons complete</span>
      </span>
      <span className="learning-library-percent">{course.progress_percent}%</span>
    </button>
  )
}

export function LearningPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const canLearn = isAuthenticated && user?.role === 'STUDENT'

  const libraryQuery = useLearningLibraryQuery({ enabled: canLearn })
  const completionMutation = useMutation({
    mutationFn: (lesson) => updateLessonProgress({
      lesson_id: lesson.id,
      watched_duration: Math.max(Number(lesson.duration || 0), Number(lesson.progress?.watched_duration || 0)),
      is_completed: true,
    }),
    onSuccess: async (_, lesson) => {
      toast.success(`${lesson.title} marked complete.`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.learning.library }),
        queryClient.invalidateQueries({ queryKey: queryKeys.learning.lessonProgress }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews.eligible }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update this lesson.')),
  })

  if (!canLearn) {
    return (
      <section className="learning-access-note">
        <p className="eyebrow">Student learning</p>
        <h1>Your courses live in a student account</h1>
        <p>Sign in as a student to open purchased courses and continue lessons.</p>
        <div>
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create student account</Link>
        </div>
      </section>
    )
  }

  const courses = Array.isArray(libraryQuery.data) ? libraryQuery.data : []
  const requestedCourseId = searchParams.get('course')
  const requestedLessonId = searchParams.get('lesson')
  const activeCourse = courses.find((course) => String(course.course_id) === requestedCourseId) || courses[0]
  const lessons = activeCourse?.lessons || []
  const firstIncompleteLesson = lessons.find((lesson) => !lesson.progress?.is_completed)
  const activeLesson = lessons.find((lesson) => String(lesson.id) === requestedLessonId)
    || firstIncompleteLesson
    || lessons[0]
  const totalLessons = courses.reduce((total, course) => total + Number(course.total_lessons || 0), 0)
  const completedLessons = courses.reduce((total, course) => total + Number(course.completed_lessons || 0), 0)

  function chooseCourse(course) {
    const nextLesson = course.lessons?.find((lesson) => !lesson.progress?.is_completed) || course.lessons?.[0]
    setSearchParams({
      course: String(course.course_id),
      ...(nextLesson ? { lesson: String(nextLesson.id) } : {}),
    })
  }

  function chooseLesson(lesson) {
    setSearchParams({ course: String(activeCourse.course_id), lesson: String(lesson.id) })
  }

  if (libraryQuery.isLoading) {
    return (
      <section className="student-learning">
        <header className="learning-page-head"><div><p className="eyebrow">My learning</p><h1>Preparing your courses</h1></div></header>
        <LearningSkeleton />
      </section>
    )
  }

  if (libraryQuery.isError) {
    return (
      <section className="student-learning">
        <section className="learning-error" role="alert">
          <h1>Your learning library could not be loaded</h1>
          <p>{getApiErrorMessage(libraryQuery.error)}</p>
          <button type="button" onClick={() => libraryQuery.refetch()}>Try again</button>
        </section>
      </section>
    )
  }

  if (!courses.length) {
    return (
      <section className="student-learning">
        <section className="learning-empty-library">
          <span>Start here</span>
          <h1>Build your learning library</h1>
          <p>Explore affordable courses from verified tutors. Your purchased courses and lessons will appear here.</p>
          <Link to="/courses">Browse courses</Link>
        </section>
      </section>
    )
  }

  return (
    <section className="student-learning">
      <header className="learning-page-head">
        <div>
          <p className="eyebrow">My learning</p>
          <h1>Continue where you left off</h1>
          <p>Open a course, move through its lessons, and keep your progress in one place.</p>
        </div>
        <dl className="learning-overview">
          <div><dt>Courses</dt><dd>{courses.length}</dd></div>
          <div><dt>Lessons complete</dt><dd>{completedLessons}/{totalLessons}</dd></div>
        </dl>
      </header>

      <section className="learning-library-strip" aria-labelledby="course-library-title">
        <div className="learning-strip-head">
          <div><span>01</span><h2 id="course-library-title">Your courses</h2></div>
          <Link to="/courses">Browse more courses</Link>
        </div>
        <div className="learning-library-list">
          {courses.map((course) => (
            <CourseLibraryCard
              key={course.id}
              course={course}
              selected={course.id === activeCourse.id}
              onSelect={chooseCourse}
            />
          ))}
        </div>
      </section>

      <section className="learning-course-summary">
        <div>
          <span>{activeCourse.subject_name} / {activeCourse.academic_level || 'All levels'}</span>
          <h2>{activeCourse.title}</h2>
          <p>With <Link to={`/tutors/${activeCourse.tutor_id}`}>{activeCourse.tutor_name}</Link></p>
        </div>
        <div className="learning-course-progress">
          <div><span>Course progress</span><strong>{activeCourse.progress_percent}%</strong></div>
          <progress value={activeCourse.progress_percent} max="100">{activeCourse.progress_percent}%</progress>
          <small>{activeCourse.completed_lessons} of {activeCourse.total_lessons} lessons completed</small>
        </div>
      </section>

      {activeLesson ? (
        <section className="learning-workspace">
          <LessonViewTracker lessonId={activeLesson.id} />
          <aside className="learning-curriculum" aria-labelledby="curriculum-title">
            <div className="learning-curriculum-head">
              <span>02</span>
              <div><h2 id="curriculum-title">Curriculum</h2><p>{lessons.length} lessons</p></div>
            </div>
            <div className="learning-lesson-list">
              {lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  type="button"
                  className={lesson.id === activeLesson.id ? 'is-active' : ''}
                  onClick={() => chooseLesson(lesson)}
                >
                  <span className={lesson.progress?.is_completed ? 'is-complete' : ''}>
                    {lesson.progress?.is_completed ? 'OK' : String(index + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <strong>{lesson.title}</strong>
                    <small>{lesson.duration ? `${lesson.duration} min` : 'Self-paced'} / {lesson.topic || 'Lesson'}</small>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <article className="learning-lesson-viewer">
            <div className="learning-viewer-head">
              <div>
                <span>Lesson {activeLesson.order_number}</span>
                <h2>{activeLesson.title}</h2>
                <p>{activeLesson.topic || activeCourse.subject_name}</p>
              </div>
              <span className={`learning-status ${activeLesson.progress?.is_completed ? 'is-complete' : ''}`}>
                {activeLesson.progress?.is_completed ? 'Completed' : 'In progress'}
              </span>
            </div>

            <div className="learning-media">
              {activeLesson.video_file_url ? (
                <video
                  key={activeLesson.video_file_url}
                  controls
                  preload="metadata"
                  onEnded={() => !activeLesson.progress?.is_completed && completionMutation.mutate(activeLesson)}
                >
                  <source src={activeLesson.video_file_url} />
                  Your browser does not support this lesson video.
                </video>
              ) : activeLesson.video_url ? (
                <div className="learning-external-media">
                  <span>External lesson video</span>
                  <p>This lesson is hosted by the tutor on an external video service.</p>
                  <a href={activeLesson.video_url} target="_blank" rel="noreferrer">Open lesson video</a>
                </div>
              ) : (
                <div className="learning-no-media">
                  <span>Reading lesson</span>
                  <p>No video is attached. Use the lesson notes below to continue.</p>
                </div>
              )}
            </div>

            <div className="learning-lesson-content">
              <div>
                <span>Lesson notes</span>
                <p>{activeLesson.description || 'The tutor has not added written notes for this lesson yet.'}</p>
              </div>
              <dl>
                <div><dt>Duration</dt><dd>{activeLesson.duration ? `${activeLesson.duration} minutes` : 'Self-paced'}</dd></div>
                <div><dt>Last completed</dt><dd>{formatDate(activeLesson.progress?.completed_at)}</dd></div>
              </dl>
            </div>

            <div className="learning-viewer-actions">
              <div>
                {activeLesson.progress?.is_completed ? (
                  <Link to={`/reviews?lesson=${activeLesson.id}`}>Review this lesson</Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => completionMutation.mutate(activeLesson)}
                    disabled={completionMutation.isPending}
                  >
                    {completionMutation.isPending ? 'Saving progress...' : 'Mark lesson complete'}
                  </button>
                )}
                <Link className="learning-assessment-link" to={`/assessments?lesson=${activeLesson.id}`}>Lesson assessments</Link>
              </div>
              <span>Use assessments to compare knowledge before and after this lesson.</span>
            </div>
          </article>
        </section>
      ) : (
        <section className="learning-no-lessons">
          <h2>This course has no lessons yet</h2>
          <p>The tutor is still preparing the curriculum. Check back soon.</p>
        </section>
      )}
    </section>
  )
}
