import React, { useState } from 'react'
import { queryKeys } from '../api/queryKeys'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getApiErrorMessage } from '../api/errors'
import {
  createAssessment,
  createAssessmentQuestion,
  getLearningImpact,
  listAssessmentAttempts,
  listAssessmentConfirmations,
  listAssessments,
  submitAssessmentAttempt,
  submitAssessmentConfirmation,
} from '../api/services/assessments'
import { listMyCourses } from '../api/services/catalog'
import { listBookings } from '../api/services/bookings'
import { useAuth } from '../context/AuthContext.jsx'
import { useLearningLibraryQuery } from '../hooks/useCommonQueries'
import './AssessmentsPage.css'

function formatPercent(value) {
  const number = Number(value || 0)
  return `${Number.isInteger(number) ? number : number.toFixed(1)}%`
}

function formatDate(value) {
  if (!value) return 'Not submitted'
  return new Intl.DateTimeFormat('en-RW', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(value))
}

function getContextKey(item) {
  return item.context_type === 'BOOKING'
    ? `booking:${item.booking}`
    : `lesson:${item.lesson}`
}

function AssessmentSkeleton() {
  return <div className="assessment-skeleton" aria-hidden="true"><span /><span /><span /></div>
}

function QuizPanel({ assessment, answers, busy, onAnswer, onClose, onSubmit }) {
  const answeredCount = assessment.questions.filter((question) => answers[question.id]).length

  return (
    <section className="quiz-panel" aria-labelledby="active-quiz-title">
      <header className="quiz-panel-head">
        <div>
          <span>{assessment.attempt_type === 'PRE_TEST' ? 'Initial assessment' : 'Final assessment'} / {assessment.context_title}</span>
          <h2 id="active-quiz-title">{assessment.title}</h2>
          <p><strong>Expected outcomes:</strong> {assessment.expected_knowledge_outcomes}</p>
          <p>{assessment.instructions || 'Choose one answer for every question before submitting.'}</p>
        </div>
        <button type="button" onClick={onClose} disabled={busy}>Exit quiz</button>
      </header>

      <div className="quiz-progress-line">
        <span>{answeredCount} of {assessment.questions.length} answered</span>
        <progress value={answeredCount} max={assessment.questions.length || 1}>{answeredCount}</progress>
      </div>

      <form onSubmit={onSubmit}>
        <div className="quiz-question-list">
          {assessment.questions.map((question, index) => {
            const options = ['A', 'B', 'C', 'D']
              .map((key) => ({ key, text: question[`option_${key.toLowerCase()}`] }))
              .filter((option) => option.text)
            return (
              <fieldset key={question.id} className="quiz-question">
                <legend><span>{String(index + 1).padStart(2, '0')}</span>{question.question}</legend>
                <div>
                  {options.map((option) => (
                    <label key={option.key} className={answers[question.id] === option.key ? 'is-selected' : ''}>
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.key}
                        checked={answers[question.id] === option.key}
                        onChange={() => onAnswer(question.id, option.key)}
                      />
                      <span>{option.key}</span>
                      <strong>{option.text}</strong>
                    </label>
                  ))}
                </div>
              </fieldset>
            )
          })}
        </div>
        <footer className="quiz-submit-row">
          <p>Assessment attempts can only be submitted once.</p>
          <button type="submit" disabled={busy || answeredCount !== assessment.questions.length}>
            {busy ? 'Scoring answers...' : 'Submit assessment'}
          </button>
        </footer>
      </form>
    </section>
  )
}

function StudentAssessmentCard({ assessment, attempt, lessonCompleted, onStart }) {
  const isPostTest = assessment.attempt_type === 'POST_TEST'
  const locked = assessment.can_attempt === false || (
    assessment.context_type !== 'BOOKING' && isPostTest && !lessonCompleted
  )
  const hasQuestions = assessment.questions.length > 0

  return (
    <article className="student-assessment-card">
      <div className="assessment-card-type">
        <span>{isPostTest ? 'POST' : 'PRE'}</span>
        <small>{isPostTest ? 'After learning' : 'Before learning'}</small>
      </div>
      <div className="assessment-card-copy">
        <span>{assessment.context_title}</span>
        <h3>{assessment.title}</h3>
        <p>{assessment.description}</p>
        <p><strong>Expected:</strong> {assessment.expected_knowledge_outcomes}</p>
        <div>
          <span>{assessment.questions.length} question{assessment.questions.length === 1 ? '' : 's'}</span>
          <span>{assessment.marks} marks</span>
        </div>
      </div>
      <div className="assessment-card-action">
        {attempt ? (
          <><strong>{formatPercent(attempt.percentage)}</strong><span>Submitted {formatDate(attempt.submitted_at)}</span></>
        ) : locked ? (
          <>
            <span>{assessment.availability_message || 'Complete the learning activity first'}</span>
            <Link to={assessment.context_type === 'BOOKING' ? '/bookings' : `/learning?course=${assessment.course_id}&lesson=${assessment.lesson}`}>
              Open {assessment.context_type === 'BOOKING' ? 'booking' : 'lesson'}
            </Link>
          </>
        ) : !hasQuestions ? (
          <span>Questions are being prepared</span>
        ) : (
          <button type="button" onClick={() => onStart(assessment)}>Start assessment</button>
        )}
      </div>
    </article>
  )
}

function StudentAssessments({
  assessments,
  attempts,
  confirmations,
  library,
  loading,
  error,
  activeAssessment,
  answers,
  comments,
  submitBusy,
  confirmationBusy,
  onStart,
  onAnswer,
  onClose,
  onSubmit,
  onComment,
  onConfirm,
  onRetry,
}) {
  const [searchParams] = useSearchParams()
  const requestedLesson = searchParams.get('lesson')
  const requestedBooking = searchParams.get('booking')
  const attemptedByAssessment = new Map(attempts.map((attempt) => [attempt.assessment, attempt]))
  const lessonCompletion = new Map()
  library.forEach((course) => course.lessons.forEach((lesson) => {
    lessonCompletion.set(lesson.id, Boolean(lesson.progress?.is_completed))
  }))
  const orderedAssessments = [...assessments].sort((left, right) => {
    const leftRequested = (
      String(left.lesson) === requestedLesson || String(left.booking) === requestedBooking
    ) ? 0 : 1
    const rightRequested = (
      String(right.lesson) === requestedLesson || String(right.booking) === requestedBooking
    ) ? 0 : 1
    if (leftRequested !== rightRequested) return leftRequested - rightRequested
    if (left.lesson !== right.lesson) return left.lesson - right.lesson
    return left.attempt_type === 'PRE_TEST' ? -1 : 1
  })
  const attemptsByContext = attempts.reduce((result, attempt) => {
    const key = getContextKey(attempt)
    result[key] ||= {}
    result[key][attempt.attempt_type] = attempt
    return result
  }, {})
  const confirmationByContext = new Map(confirmations.map((item) => [getContextKey(item), item]))
  const resultPairs = Object.entries(attemptsByContext).filter(([, pair]) => pair.PRE_TEST && pair.POST_TEST)

  if (activeAssessment) {
    return (
      <QuizPanel
        assessment={activeAssessment}
        answers={answers}
        busy={submitBusy}
        onAnswer={onAnswer}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
  }

  return (
    <>
      <header className="assessment-page-head">
        <div>
          <p className="eyebrow">Knowledge checks</p>
          <h1>See how your learning grows</h1>
          <p>Take the pre-test, complete the lesson, then use the post-test to measure your progress.</p>
        </div>
        <dl className="assessment-overview">
          <div><dt>Available</dt><dd>{assessments.length}</dd></div>
          <div><dt>Completed</dt><dd>{attempts.length}</dd></div>
        </dl>
      </header>

      <section className="assessment-section">
        <div className="assessment-section-head"><div><span>01</span><div><h2>Your assessments</h2><p>Each assessment can be submitted once.</p></div></div><Link to="/learning">Back to learning</Link></div>
        {loading ? (
          <div className="assessment-card-list"><AssessmentSkeleton /><AssessmentSkeleton /></div>
        ) : error ? (
          <div className="assessment-error" role="alert"><div><h3>Assessments could not be loaded</h3><p>{getApiErrorMessage(error)}</p></div><button type="button" onClick={onRetry}>Try again</button></div>
        ) : orderedAssessments.length ? (
          <div className="assessment-card-list">
            {orderedAssessments.map((assessment) => (
              <StudentAssessmentCard
                key={assessment.id}
                assessment={assessment}
                attempt={attemptedByAssessment.get(assessment.id)}
                lessonCompleted={lessonCompletion.get(assessment.lesson)}
                onStart={onStart}
              />
            ))}
          </div>
        ) : (
          <div className="assessment-empty"><h3>No assessments available yet</h3><p>Your tutors' knowledge checks will appear here after you enroll in a course.</p><Link to="/courses">Browse courses</Link></div>
        )}
      </section>

      <section className="assessment-section">
        <div className="assessment-section-head"><div><span>02</span><div><h2>Learning outcomes</h2><p>Compare completed pre-tests and post-tests.</p></div></div></div>
        {resultPairs.length ? (
          <div className="outcome-list">
            {resultPairs.map(([contextKey, pair]) => {
              const existing = confirmationByContext.get(contextKey)
              const improvement = Number(pair.POST_TEST.percentage) - Number(pair.PRE_TEST.percentage)
              return (
                <article className="outcome-card" key={contextKey}>
                  <div className="outcome-copy">
                    <span>{pair.POST_TEST.context_type === 'BOOKING' ? 'Booked tutoring lesson' : pair.POST_TEST.course_title}</span>
                    <h3>{pair.POST_TEST.context_title}</h3>
                    <p>Tell your tutor whether this result reflects your learning experience.</p>
                  </div>
                  <div className="outcome-scores">
                    <div><span>Before</span><strong>{formatPercent(pair.PRE_TEST.percentage)}</strong></div>
                    <div><span>After</span><strong>{formatPercent(pair.POST_TEST.percentage)}</strong></div>
                    <div className={improvement >= 0 ? 'is-positive' : 'is-negative'}><span>Change</span><strong>{improvement > 0 ? '+' : ''}{formatPercent(improvement)}</strong></div>
                  </div>
                  <div className="outcome-response">
                    {existing && <span className={`outcome-status is-${existing.student_confirmation_status.toLowerCase()}`}>{existing.student_confirmation_status}</span>}
                    <textarea
                      rows="2"
                      value={comments[contextKey] ?? existing?.student_comment ?? ''}
                      onChange={(event) => onComment(contextKey, event.target.value)}
                      placeholder="Optional note for your tutor"
                      maxLength="500"
                    />
                    <div>
                      <button type="button" onClick={() => onConfirm(pair, 'REJECTED', existing?.student_comment)} disabled={confirmationBusy}>Does not reflect progress</button>
                      <button type="button" onClick={() => onConfirm(pair, 'CONFIRMED', existing?.student_comment)} disabled={confirmationBusy}>Confirm result</button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="assessment-empty compact"><p>Complete a pre-test and post-test for the same lesson to see your learning outcome.</p></div>
        )}
      </section>
    </>
  )
}

function TutorAssessments({
  assessments,
  attempts,
  courses,
  bookings,
  impact,
  loading,
  error,
  onRetry,
  assessmentForm,
  questionForm,
  assessmentBusy,
  questionBusy,
  onAssessmentChange,
  onQuestionChange,
  onCreateAssessment,
  onCreateQuestion,
}) {
  const lessons = courses.flatMap((course) => (course.lessons || []).map((lesson) => ({
    ...lesson,
    courseTitle: course.title,
  })))
  const eligibleBookings = bookings.filter((booking) => ['CONFIRMED', 'COMPLETED'].includes(booking.status))
  const selectedContextItems = assessmentForm.context_type === 'BOOKING' ? eligibleBookings : lessons

  return (
    <>
      <header className="assessment-page-head tutor-mode">
        <div><p className="eyebrow">Tutor assessments</p><h1>Build checks that show real progress</h1><p>Create initial and final assessments for course lessons or confirmed bookings, then review student-confirmed outcomes.</p></div>
        <dl className="assessment-overview"><div><dt>Assessments</dt><dd>{assessments.length}</dd></div><div><dt>Attempts</dt><dd>{attempts.length}</dd></div><div><dt>Avg. improvement</dt><dd>{formatPercent(impact?.average_improvement)}</dd></div></dl>
      </header>

      {error && (
        <div className="assessment-error tutor-query-error" role="alert">
          <div><h3>Some assessment data could not be loaded</h3><p>{getApiErrorMessage(error)}</p></div>
          <button type="button" onClick={onRetry}>Try again</button>
        </div>
      )}

      <section className="tutor-assessment-builder">
        <form onSubmit={onCreateAssessment} className="assessment-builder-form">
          <div className="assessment-section-head"><div><span>01</span><div><h2>Create assessment</h2><p>Measure knowledge around a course lesson or an individual booking.</p></div></div></div>
          <label><span>Learning context</span><select value={assessmentForm.context_type} onChange={(event) => onAssessmentChange('context_type', event.target.value)}><option value="COURSE_LESSON">Course lesson</option><option value="BOOKING">Confirmed booking</option></select></label>
          <label>
            <span>{assessmentForm.context_type === 'BOOKING' ? 'Booking' : 'Lesson'}</span>
            <select value={assessmentForm.context_id} onChange={(event) => onAssessmentChange('context_id', event.target.value)} required>
              <option value="">Choose {assessmentForm.context_type === 'BOOKING' ? 'booking' : 'lesson'}</option>
              {selectedContextItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {assessmentForm.context_type === 'BOOKING'
                    ? `#${item.id} / ${item.subject_name} / ${item.student_name} / ${formatDate(item.start_datetime)}`
                    : `${item.courseTitle} / ${item.title}`}
                </option>
              ))}
            </select>
          </label>
          <div className="builder-two-columns">
            <label><span>Assessment stage</span><select value={assessmentForm.attempt_type} onChange={(event) => onAssessmentChange('attempt_type', event.target.value)}><option value="PRE_TEST">Initial assessment</option><option value="POST_TEST">Final assessment</option></select></label>
            <label><span>Total marks</span><input type="number" min="1" value={assessmentForm.marks} onChange={(event) => onAssessmentChange('marks', event.target.value)} required /></label>
          </div>
          <label><span>Title</span><input value={assessmentForm.title} onChange={(event) => onAssessmentChange('title', event.target.value)} placeholder="Cell biology pre-test" required /></label>
          <label><span>Description</span><textarea rows="3" value={assessmentForm.description} onChange={(event) => onAssessmentChange('description', event.target.value)} placeholder="Explain what this assessment measures and why it matters." required /></label>
          <label><span>Expected knowledge outcomes</span><textarea rows="3" value={assessmentForm.expected_knowledge_outcomes} onChange={(event) => onAssessmentChange('expected_knowledge_outcomes', event.target.value)} placeholder="State the knowledge or skills the student should demonstrate." required /></label>
          <label><span>Instructions</span><textarea rows="3" value={assessmentForm.instructions} onChange={(event) => onAssessmentChange('instructions', event.target.value)} placeholder="Explain what students should do." /></label>
          <button type="submit" disabled={assessmentBusy || !selectedContextItems.length}>{assessmentBusy ? 'Creating...' : 'Create assessment'}</button>
        </form>

        <form onSubmit={onCreateQuestion} className="assessment-builder-form question-form">
          <div className="assessment-section-head"><div><span>02</span><div><h2>Add question</h2><p>Answers are hidden from students.</p></div></div></div>
          <label><span>Assessment</span><select value={questionForm.assessment} onChange={(event) => onQuestionChange('assessment', event.target.value)} required><option value="">Choose assessment</option>{assessments.map((item) => <option key={item.id} value={item.id}>{item.title} / {item.context_title}</option>)}</select></label>
          <label><span>Question</span><textarea rows="3" value={questionForm.question} onChange={(event) => onQuestionChange('question', event.target.value)} required /></label>
          <div className="builder-two-columns">
            {['A', 'B', 'C', 'D'].map((key) => <label key={key}><span>Option {key}{['C', 'D'].includes(key) ? ' (optional)' : ''}</span><input value={questionForm[`option_${key.toLowerCase()}`]} onChange={(event) => onQuestionChange(`option_${key.toLowerCase()}`, event.target.value)} required={['A', 'B'].includes(key)} /></label>)}
          </div>
          <div className="builder-three-columns">
            <label><span>Correct answer</span><select value={questionForm.correct_answer} onChange={(event) => onQuestionChange('correct_answer', event.target.value)}>{['A', 'B', 'C', 'D'].map((key) => <option key={key}>{key}</option>)}</select></label>
            <label><span>Marks</span><input type="number" min="1" value={questionForm.marks} onChange={(event) => onQuestionChange('marks', event.target.value)} required /></label>
            <label><span>Order</span><input type="number" min="1" value={questionForm.order_number} onChange={(event) => onQuestionChange('order_number', event.target.value)} required /></label>
          </div>
          <button type="submit" disabled={questionBusy || !assessments.length}>{questionBusy ? 'Adding...' : 'Add question'}</button>
        </form>
      </section>

      <section className="assessment-section">
        <div className="assessment-section-head"><div><span>03</span><div><h2>Assessment library</h2><p>Review question coverage across your lessons.</p></div></div><Link to="/tutor-teaching">Manage courses</Link></div>
        {loading ? <div className="assessment-card-list"><AssessmentSkeleton /><AssessmentSkeleton /></div> : assessments.length ? (
          <div className="tutor-assessment-grid">{assessments.map((item) => <article key={item.id}><div><span>{item.attempt_type === 'PRE_TEST' ? 'INITIAL' : 'FINAL'}</span><small>{item.context_type === 'BOOKING' ? 'Booking' : 'Course lesson'}</small></div><h3>{item.title}</h3><p>{item.context_title}</p><p>{item.description}</p><p><strong>Expected:</strong> {item.expected_knowledge_outcomes}</p><footer><span>{item.questions.length} questions</span><span>{item.marks} marks</span></footer></article>)}</div>
        ) : <div className="assessment-empty compact"><p>Create your first assessment using the builder above.</p></div>}
      </section>

      <section className="assessment-section">
        <div className="assessment-section-head"><div><span>04</span><div><h2>Learning impact</h2><p>Only student-confirmed outcomes contribute to averages.</p></div></div></div>
        <div className="impact-grid">
          <article><span>Confirmed outcomes</span><strong>{impact?.confirmed_confirmations || 0}</strong></article>
          <article><span>Students assessed</span><strong>{impact?.assessed_students || 0}</strong></article>
          <article><span>Pending responses</span><strong>{impact?.pending_confirmations || 0}</strong></article>
          <article><span>Average improvement</span><strong>{formatPercent(impact?.average_improvement)}</strong></article>
          <article><span>Positive outcomes</span><strong>{formatPercent(impact?.positive_outcome_rate)}</strong></article>
        </div>
        {impact?.top_lessons?.length > 0 && <div className="impact-lessons">{impact.top_lessons.map((lesson) => <div key={lesson.lesson__id}><span>{lesson.lesson__course__title}</span><strong>{lesson.lesson__title}</strong><small>{formatPercent(lesson.average_improvement)} average improvement / {lesson.confirmations} confirmation{lesson.confirmations === 1 ? '' : 's'}</small></div>)}</div>}
        {impact?.top_bookings?.length > 0 && <div className="impact-lessons">{impact.top_bookings.map((booking) => <div key={booking.booking__id}><span>Individual booking</span><strong>{booking.booking__subject__name || `Booking #${booking.booking__id}`}</strong><small>{formatPercent(booking.average_improvement)} average improvement / {booking.confirmations} confirmation{booking.confirmations === 1 ? '' : 's'}</small></div>)}</div>}
      </section>
    </>
  )
}

const EMPTY_ASSESSMENT = {
  context_type: 'COURSE_LESSON',
  context_id: '',
  attempt_type: 'PRE_TEST',
  title: '',
  description: '',
  expected_knowledge_outcomes: '',
  instructions: '',
  marks: '5',
}
const EMPTY_QUESTION = { assessment: '', question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', marks: '1', order_number: '1' }

export function AssessmentsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [pageSearchParams] = useSearchParams()
  const [activeAssessment, setActiveAssessment] = useState(null)
  const [answers, setAnswers] = useState({})
  const [comments, setComments] = useState({})
  const [assessmentForm, setAssessmentForm] = useState(() => {
    const requestedBooking = pageSearchParams.get('booking')
    const requestedLesson = pageSearchParams.get('lesson')
    if (requestedBooking) {
      return { ...EMPTY_ASSESSMENT, context_type: 'BOOKING', context_id: requestedBooking }
    }
    if (requestedLesson) {
      return { ...EMPTY_ASSESSMENT, context_id: requestedLesson }
    }
    return EMPTY_ASSESSMENT
  })
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION)
  const isStudent = user?.role === 'STUDENT'
  const isTutor = user?.role === 'TUTOR'

  const assessmentsQuery = useQuery({ queryKey: queryKeys.assessments.list, queryFn: () => listAssessments().then((response) => response.data), enabled: isStudent || isTutor })
  const attemptsQuery = useQuery({ queryKey: queryKeys.assessments.attempts, queryFn: () => listAssessmentAttempts().then((response) => response.data), enabled: isStudent || isTutor })
  const confirmationsQuery = useQuery({ queryKey: queryKeys.assessments.confirmations, queryFn: () => listAssessmentConfirmations().then((response) => response.data), enabled: isStudent })
  const libraryQuery = useLearningLibraryQuery({ enabled: isStudent })
  const coursesQuery = useQuery({ queryKey: queryKeys.catalog.tutorCourses, queryFn: () => listMyCourses().then((response) => response.data), enabled: isTutor })
  const bookingsQuery = useQuery({ queryKey: queryKeys.bookings.all, queryFn: () => listBookings().then((response) => response.data), enabled: isTutor })
  const impactQuery = useQuery({ queryKey: queryKeys.learning.impact, queryFn: () => getLearningImpact().then((response) => response.data), enabled: isTutor })

  const attemptMutation = useMutation({
    mutationFn: submitAssessmentAttempt,
    onSuccess: async (response) => {
      toast.success(`Assessment submitted: ${formatPercent(response.data.percentage)}.`)
      setActiveAssessment(null)
      setAnswers({})
      await queryClient.invalidateQueries({ queryKey: queryKeys.assessments.attempts })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not submit this assessment.')),
  })
  const confirmationMutation = useMutation({
    mutationFn: submitAssessmentConfirmation,
    onSuccess: async () => {
      toast.success('Your outcome response was saved.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.assessments.confirmations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.learning.impact }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not save your response.')),
  })
  const assessmentMutation = useMutation({
    mutationFn: createAssessment,
    onSuccess: async (response) => {
      toast.success('Assessment created. Add its questions next.')
      setAssessmentForm(EMPTY_ASSESSMENT)
      setQuestionForm((current) => ({ ...current, assessment: String(response.data.id) }))
      await queryClient.invalidateQueries({ queryKey: queryKeys.assessments.list })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create the assessment.')),
  })
  const questionMutation = useMutation({
    mutationFn: createAssessmentQuestion,
    onSuccess: async () => {
      toast.success('Question added.')
      setQuestionForm((current) => ({ ...EMPTY_QUESTION, assessment: current.assessment, order_number: String(Number(current.order_number) + 1) }))
      await queryClient.invalidateQueries({ queryKey: queryKeys.assessments.list })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not add the question.')),
  })

  const assessments = assessmentsQuery.data || []
  const attempts = attemptsQuery.data || []

  function submitQuiz(event) {
    event.preventDefault()
    const unanswered = activeAssessment.questions.some((question) => !answers[question.id])
    if (unanswered) {
      toast.error('Answer every question before submitting.')
      return
    }
    attemptMutation.mutate({
      assessment_id: activeAssessment.id,
      answers: activeAssessment.questions.map((question) => ({ question_id: question.id, selected_answer: answers[question.id] })),
    })
  }

  function submitConfirmation(pair, status, existingComment = '') {
    const contextKey = getContextKey(pair.POST_TEST)
    confirmationMutation.mutate({
      ...(pair.POST_TEST.context_type === 'BOOKING'
        ? { booking_id: pair.POST_TEST.booking }
        : { lesson_id: pair.POST_TEST.lesson }),
      pre_test_attempt_id: pair.PRE_TEST.id,
      post_test_attempt_id: pair.POST_TEST.id,
      student_confirmation_status: status,
      student_comment: comments[contextKey] ?? existingComment,
    })
  }

  function submitNewAssessment(event) {
    event.preventDefault()
    const contextField = assessmentForm.context_type === 'BOOKING' ? 'booking' : 'lesson'
    assessmentMutation.mutate({
      attempt_type: assessmentForm.attempt_type,
      title: assessmentForm.title,
      description: assessmentForm.description,
      expected_knowledge_outcomes: assessmentForm.expected_knowledge_outcomes,
      instructions: assessmentForm.instructions,
      marks: Number(assessmentForm.marks),
      [contextField]: Number(assessmentForm.context_id),
    })
  }

  function submitNewQuestion(event) {
    event.preventDefault()
    questionMutation.mutate({
      ...questionForm,
      assessment: Number(questionForm.assessment),
      marks: Number(questionForm.marks),
      order_number: Number(questionForm.order_number),
    })
  }

  if (!isStudent && !isTutor) {
    return <section className="assessment-role-note"><h1>Assessments are available to students and tutors</h1><p>Students complete knowledge checks while tutors create and monitor them.</p><Link to="/account">Return to account</Link></section>
  }

  return (
    <section className="assessments-page">
      {isStudent ? (
        <StudentAssessments
          assessments={assessments}
          attempts={attempts}
          confirmations={confirmationsQuery.data || []}
          library={libraryQuery.data || []}
          loading={assessmentsQuery.isLoading || attemptsQuery.isLoading || libraryQuery.isLoading}
          error={assessmentsQuery.error || attemptsQuery.error || libraryQuery.error}
          activeAssessment={activeAssessment}
          answers={answers}
          comments={comments}
          submitBusy={attemptMutation.isPending}
          confirmationBusy={confirmationMutation.isPending}
          onStart={(assessment) => { setActiveAssessment(assessment); setAnswers({}); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          onAnswer={(questionId, answer) => setAnswers((current) => ({ ...current, [questionId]: answer }))}
          onClose={() => { setActiveAssessment(null); setAnswers({}) }}
          onSubmit={submitQuiz}
          onComment={(lessonId, value) => setComments((current) => ({ ...current, [lessonId]: value }))}
          onConfirm={submitConfirmation}
          onRetry={() => { assessmentsQuery.refetch(); attemptsQuery.refetch(); libraryQuery.refetch() }}
        />
      ) : (
        <TutorAssessments
          assessments={assessments}
          attempts={attempts}
          courses={coursesQuery.data || []}
          bookings={bookingsQuery.data || []}
          impact={impactQuery.data}
          loading={assessmentsQuery.isLoading || attemptsQuery.isLoading || coursesQuery.isLoading || bookingsQuery.isLoading}
          error={assessmentsQuery.error || attemptsQuery.error || coursesQuery.error || bookingsQuery.error || impactQuery.error}
          onRetry={() => { assessmentsQuery.refetch(); attemptsQuery.refetch(); coursesQuery.refetch(); bookingsQuery.refetch(); impactQuery.refetch() }}
          assessmentForm={assessmentForm}
          questionForm={questionForm}
          assessmentBusy={assessmentMutation.isPending}
          questionBusy={questionMutation.isPending}
          onAssessmentChange={(name, value) => setAssessmentForm((current) => ({
            ...current,
            [name]: value,
            ...(name === 'context_type' ? { context_id: '' } : {}),
          }))}
          onQuestionChange={(name, value) => setQuestionForm((current) => ({ ...current, [name]: value }))}
          onCreateAssessment={submitNewAssessment}
          onCreateQuestion={submitNewQuestion}
        />
      )}
    </section>
  )
}
