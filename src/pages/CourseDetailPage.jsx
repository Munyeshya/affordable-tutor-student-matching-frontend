import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { getPublicCourse } from '../api/services/catalog'
import { listCoursePurchases } from '../api/services/payments'
import { listParentLinks } from '../api/services/parents'
import { PaymentCheckoutDialog } from '../components/payments/PaymentCheckoutDialog.jsx'
import { FormattedText } from '../components/ui/FormattedText.jsx'
import { toPlainFormattedText } from '../components/ui/formattedText.js'
import { UserAvatar } from '../components/ui/UserAvatar.jsx'
import { formatEducationLevel } from '../constants/educationLevels.js'
import { useAuth } from '../context/AuthContext.jsx'
import './CourseDetailPage.css'

function formatMoney(value) {
  const amount = Number(value || 0)
  return amount === 0 ? 'Free' : `${new Intl.NumberFormat('en-RW').format(amount)} RWF`
}

function formatLevel(value) {
  return formatEducationLevel(value)
}

function formatDuration(minutes) {
  const total = Number(minutes || 0)
  if (!total) return 'Duration varies'
  if (total < 60) return `${total} minutes`

  const hours = Math.floor(total / 60)
  const remainingMinutes = total % 60
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`
}

function uniqueCoverageItems(curriculum) {
  const seen = new Set()

  return curriculum.reduce((items, lesson) => {
    const label = (lesson.topic || lesson.title || '').trim()
    const key = label.toLowerCase()
    if (!label || seen.has(key)) return items
    seen.add(key)
    return [...items, label]
  }, [])
}

function CourseDetailSkeleton() {
  return (
    <div className="course-detail-page course-detail-skeleton" aria-busy="true" aria-label="Loading course details">
      <span className="course-detail-skeleton-line course-detail-skeleton-breadcrumb" />
      <section className="course-detail-hero">
        <div className="course-detail-skeleton-visual" />
        <div className="course-detail-skeleton-copy">
          <span className="course-detail-skeleton-line" />
          <span className="course-detail-skeleton-line course-detail-skeleton-title" />
          <span className="course-detail-skeleton-line" />
          <span className="course-detail-skeleton-line course-detail-skeleton-short" />
        </div>
      </section>
    </div>
  )
}

export function CourseDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const isStudent = isAuthenticated && user?.role === 'STUDENT'
  const isParent = isAuthenticated && user?.role === 'PARENT'
  const canPurchase = isStudent || isParent

  const courseQuery = useQuery({
    queryKey: queryKeys.catalog.publicCourse(id),
    queryFn: () => getPublicCourse(id).then((response) => response.data),
    enabled: Boolean(id),
  })
  const purchasesQuery = useQuery({
    queryKey: queryKeys.payments.coursePurchases,
    queryFn: () => listCoursePurchases().then((response) => response.data),
    enabled: canPurchase,
  })
  const parentLinksQuery = useQuery({
    queryKey: queryKeys.parents.links,
    queryFn: () => listParentLinks().then((response) => response.data),
    enabled: isParent,
  })

  if (courseQuery.isLoading) {
    return <CourseDetailSkeleton />
  }

  if (courseQuery.isError || !courseQuery.data) {
    return (
      <section className="course-detail-state" role="alert">
        <p className="eyebrow">Course details</p>
        <h1>We could not open this course.</h1>
        <p>{getApiErrorMessage(courseQuery.error)}</p>
        <div>
          <button type="button" onClick={() => courseQuery.refetch()}>Try again</button>
          <Link to="/courses">Back to courses</Link>
        </div>
      </section>
    )
  }

  const course = courseQuery.data
  const previewLessons = Array.isArray(course.lessons) ? course.lessons : []
  const curriculum = Array.isArray(course.curriculum) && course.curriculum.length
    ? course.curriculum
    : previewLessons
  const lessonCount = Number(course.lesson_count ?? curriculum.length)
  const totalDuration = Number(
    course.total_duration_minutes
      ?? curriculum.reduce((total, lesson) => total + Number(lesson.duration || 0), 0),
  )
  const coverageItems = uniqueCoverageItems(curriculum)
  const purchases = Array.isArray(purchasesQuery.data) ? purchasesQuery.data : []
  const linkedLearners = (parentLinksQuery.data || []).map((link) => ({
    id: link.student,
    name: link.student_name || link.student_email || `Student ${link.student}`,
  }))
  const paidLearnerIds = new Set(
    purchases
      .filter((purchase) => purchase.status === 'PAID' && String(purchase.course) === String(course.id))
      .map((purchase) => String(purchase.student)),
  )
  const eligibleLearners = linkedLearners.filter((learner) => !paidLearnerIds.has(String(learner.id)))
  const isOwned = isStudent && purchases.some(
    (purchase) => (
      purchase.status === 'PAID'
      && String(purchase.course) === String(course.id)
      && String(purchase.student) === String(user?.id)
    ),
  )

  return (
    <div className="course-detail-page">
      <nav className="course-detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/courses">Courses</Link>
        <span aria-hidden="true">/</span>
        <span>{course.title}</span>
      </nav>

      <section className="course-detail-hero">
        <div className="course-detail-visual">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt="" />
          ) : (
            <div className="course-detail-placeholder" aria-hidden="true">
              <span>{course.subject_name?.slice(0, 2).toUpperCase() || 'IS'}</span>
            </div>
          )}
        </div>

        <div className="course-detail-intro">
          <p className="eyebrow">{course.subject_name || 'Isomo course'} / {formatLevel(course.academic_level)}</p>
          <h1>{course.title}</h1>
          <p className="course-detail-summary">
            {toPlainFormattedText(course.description) || 'A focused course created by a verified Isomo tutor.'}
          </p>
          <Link className="course-detail-tutor" to={`/tutors/${course.tutor}`}>
            <UserAvatar
              src={course.tutor_profile_image_url}
              name={course.tutor_name}
              fallback="T"
              alt=""
            />
            <span><small>Course tutor</small><strong>{course.tutor_name || 'Verified Isomo tutor'}</strong></span>
          </Link>

          <div className="course-detail-facts">
            <div><span>Price</span><strong>{formatMoney(course.price)}</strong></div>
            <div><span>Course lessons</span><strong>{lessonCount}</strong></div>
            <div><span>Estimated learning time</span><strong>{formatDuration(totalDuration)}</strong></div>
          </div>
        </div>
      </section>

      <section className="course-detail-layout">
        <main className="course-detail-content">
          <article className="course-detail-section">
            <p className="eyebrow">About this course</p>
            <h2>Know what you are buying before you enroll.</h2>
            <FormattedText
              value={course.description}
              fallback="This course provides structured lessons from a verified tutor at a clearly stated price."
            />
          </article>

          <article className="course-detail-section">
            <div className="course-detail-section-heading">
              <div>
                <p className="eyebrow">What you will cover</p>
                <h2>A clear checklist of the learning journey.</h2>
              </div>
              <span>{coverageItems.length} topic{coverageItems.length === 1 ? '' : 's'}</span>
            </div>

            {coverageItems.length ? (
              <ul className="course-coverage-list">
                {coverageItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <p className="course-detail-empty">The detailed topic checklist is being prepared.</p>
            )}
          </article>

          <article className="course-detail-section course-buyer-guide">
            <div>
              <p className="eyebrow">Good fit for</p>
              <h2>Learners working at {formatLevel(course.academic_level).toLowerCase()}.</h2>
              <p>This course focuses on {course.subject_name || 'the selected subject'} through an ordered lesson series you can follow from start to finish.</p>
            </div>
            <div>
              <p className="eyebrow">Your purchase includes</p>
              <ul>
                <li>{lessonCount} structured lesson{lessonCount === 1 ? '' : 's'}</li>
                <li>{formatDuration(totalDuration)} of listed learning content</li>
                <li>{previewLessons.length} lesson preview{previewLessons.length === 1 ? '' : 's'} before enrollment</li>
                <li>Course access through your student learning library</li>
              </ul>
            </div>
          </article>

          <article className="course-detail-section">
            <div className="course-detail-section-heading">
              <div>
                <p className="eyebrow">Full curriculum</p>
                <h2>See every lesson included in the course.</h2>
              </div>
              <span>{lessonCount} lesson{lessonCount === 1 ? '' : 's'}</span>
            </div>

            {curriculum.length ? (
              <ol className="course-curriculum-list">
                {curriculum.map((lesson) => (
                  <li key={lesson.id}>
                    <span>{String(lesson.order_number).padStart(2, '0')}</span>
                    <div>
                      <strong>{lesson.title}</strong>
                      <p>{lesson.topic || 'Course lesson'}</p>
                      {lesson.description ? <small>{lesson.description}</small> : null}
                    </div>
                    <div className="course-curriculum-meta">
                      <small>{lesson.duration ? `${Number(lesson.duration)} min` : 'Flexible time'}</small>
                      <em>{lesson.is_preview ? 'Preview available' : 'Included after enrollment'}</em>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="course-detail-empty">The tutor has not published the course outline yet.</p>
            )}
          </article>
        </main>

        <aside className="course-enrollment-card">
          <p className="eyebrow">Course access</p>
          <h2>{formatMoney(course.price)}</h2>
          <p>Review the course information, then enroll securely when it fits your learning goal and budget.</p>
          <div className="course-enrollment-checks">
            <span>Verified tutor</span>
            <span>Clear one-time course price</span>
            <span>{lessonCount} lessons listed before purchase</span>
            <span>Learning access after confirmed payment</span>
          </div>

          {canPurchase && (purchasesQuery.isLoading || (isParent && parentLinksQuery.isLoading)) ? (
            <button type="button" disabled>Checking your access...</button>
          ) : isOwned ? (
            <Link className="course-enrollment-primary" to={`/learning?course=${course.id}`}>Continue learning</Link>
          ) : isParent && !linkedLearners.length ? (
            <Link className="course-enrollment-primary" to="/parent-students">Link a student before purchasing</Link>
          ) : isParent && !eligibleLearners.length ? (
            <p className="course-enrollment-role-note">Every linked student already owns this course.</p>
          ) : canPurchase ? (
            <button type="button" onClick={() => setCheckoutOpen(true)}>
              {Number(course.price) === 0
                ? (isParent ? 'Enroll a linked student' : 'Enroll in this course')
                : (isParent ? 'Buy for a linked student' : 'Buy this course')}
            </button>
          ) : !isAuthenticated ? (
            <Link
              className="course-enrollment-primary"
              to="/sign-in"
              state={{ from: location }}
            >
              Sign in to buy this course
            </Link>
          ) : (
            <p className="course-enrollment-role-note">Course enrollment is available through student and parent accounts.</p>
          )}

          <Link className="course-enrollment-secondary" to={`/tutors/${course.tutor}`}>View tutor profile</Link>
          <small>Checkout is available only after reviewing these course details.</small>
        </aside>
      </section>

      <PaymentCheckoutDialog
        key={checkoutOpen ? course.id : 'course-payment'}
        open={checkoutOpen}
        kind="course"
        itemId={course.id}
        title={course.title}
        amount={course.price}
        currency="RWF"
        initialPhone={user?.profile?.data?.phone_number || ''}
        learnerName={isStudent ? (user?.full_name || user?.first_name || user?.email) : ''}
        learners={isParent ? eligibleLearners : []}
        onClose={() => setCheckoutOpen(false)}
        onSettled={async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.payments.coursePurchases }),
            queryClient.invalidateQueries({ queryKey: queryKeys.learning.library }),
            queryClient.invalidateQueries({ queryKey: queryKeys.catalog.publicCoursesRoot }),
            queryClient.invalidateQueries({ queryKey: queryKeys.catalog.publicCourse(id) }),
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
          ])
        }}
      />
    </div>
  )
}
