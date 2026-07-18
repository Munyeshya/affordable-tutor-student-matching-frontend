import React from 'react'
import { Link } from 'react-router-dom'

import { DashboardIcon } from '../../components/layout/DashboardIcon.jsx'
import { courseCompletion, formatCourseStatus } from './courseHelpers.js'

const STEPS = [
  { key: 'details', number: '01', label: 'Course details', description: 'Offer, audience, price, and image' },
  { key: 'curriculum', number: '02', label: 'Curriculum', description: 'Ordered lessons and learning content' },
  { key: 'assessments', number: '03', label: 'Assessments', description: 'Initial and final knowledge checks' },
  { key: 'review', number: '04', label: 'Review', description: 'Readiness and admin submission' },
]

export function CourseWorkspaceNav({ course, activeSection }) {
  const completion = courseCompletion(course)
  const completeBySection = {
    details: completion.details,
    curriculum: completion.curriculum,
    assessments: completion.assessments,
    review: course.status === 'PENDING_REVIEW' || course.status === 'PUBLISHED',
  }

  return (
    <aside className="course-workspace-nav" aria-label="Course setup">
      <Link className="course-workspace-back" to="/tutor-teaching">
        <span aria-hidden="true">←</span> All courses
      </Link>
      <div className="course-workspace-identity">
        <span><DashboardIcon name="courses" size={20} /></span>
        <div>
          <small>{course.subject_name || 'Course workspace'}</small>
          <strong>{course.title}</strong>
        </div>
      </div>
      <div className="course-workspace-status">
        <span>{formatCourseStatus(course.status)}</span>
        <strong>{completion.percent}% ready</strong>
      </div>
      <nav>
        {STEPS.map((step) => (
          <Link
            key={step.key}
            className={`${activeSection === step.key ? 'is-active' : ''} ${completeBySection[step.key] ? 'is-complete' : ''}`}
            to={`/tutor-teaching/courses/${course.id}/${step.key}`}
            aria-current={activeSection === step.key ? 'step' : undefined}
          >
            <span>{completeBySection[step.key] ? '✓' : step.number}</span>
            <div><strong>{step.label}</strong><small>{step.description}</small></div>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
