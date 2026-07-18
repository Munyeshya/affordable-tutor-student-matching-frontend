import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

import { DashboardIcon } from './DashboardIcon.jsx'
import './DashboardRoleGuide.css'

const guides = {
  STUDENT: {
    name: 'Student',
    summary: 'Find affordable tutors, manage your lessons, and keep track of your learning progress.',
    actions: [
      ['Find a tutor', 'Search by tutor name, subject, lesson, topic, level, location, price, or teaching mode.', '/tutors'],
      ['Request lessons', 'Book an approved tutor and choose a suitable schedule and learning mode.', '/book'],
      ['Manage learning', 'Follow bookings, complete assessments, access purchased courses, and review completed lessons.', '/bookings'],
      ['Communicate safely', 'Message tutors connected to your bookings and receive account notifications.', '/messages'],
    ],
    limits: [
      'You can only review a tutor or lesson after an eligible completed learning activity.',
      'You cannot approve tutors, publish tutor courses, manage payouts, or access another learner\'s private records.',
      'Payments and booking changes must follow the status and eligibility shown in your dashboard.',
    ],
  },
  PARENT: {
    name: 'Parent or guardian',
    summary: 'Coordinate affordable tutoring and monitor learning for students linked to your account.',
    actions: [
      ['Manage linked students', 'Link student accounts and identify the learner for whom you are arranging support.', '/parent-students'],
      ['Find and request tutors', 'Compare approved tutors and request lessons for a linked student.', '/tutors'],
      ['Monitor progress', 'View family bookings, completed learning outcomes, and printable reports.', '/reports'],
      ['Communicate', 'Message tutors involved in your linked students\' bookings.', '/messages'],
    ],
    limits: [
      'You can only view learning information for students formally linked to your account.',
      'You cannot submit assessments, reviews, or confirmations on behalf of a student unless the workflow explicitly permits it.',
      'You cannot approve tutors, moderate courses, resolve disputes, or manage tutor earnings.',
    ],
  },
  TUTOR: {
    name: 'Tutor',
    summary: 'Build a trusted teaching profile, offer lessons and courses, and manage your tutoring work.',
    actions: [
      ['Complete verification', 'Upload identity and qualification documents, sign the integrity agreement, and follow admin feedback.', '/tutor-documents'],
      ['Manage teaching', 'Declare subjects and levels, create courses, organize lessons by topic, and submit content for review.', '/tutor-teaching'],
      ['Handle bookings', 'Review student requests, manage lesson status, availability, and booking communication.', '/bookings'],
      ['Track income and feedback', 'View earnings, payout history, and ratings attached to completed lessons.', '/tutor-earnings'],
    ],
    limits: [
      'Your public visibility and teaching operations remain restricted until required documents, agreement, and admin approval are complete.',
      'You cannot approve your own profile or course, alter student payments, or access bookings assigned to another tutor.',
      'Ratings and earnings are generated only from eligible completed and paid learning activities.',
    ],
  },
  ADMIN: {
    name: 'Administrator',
    summary: 'Protect platform trust, oversee affordable learning operations, and make auditable moderation decisions.',
    actions: [
      ['Manage user access', 'Search users and apply reasoned, audited activation, deactivation, suspension, or restoration actions.', '/admin/users'],
      ['Verify tutors', 'Review identity, qualifications, signed agreements, teaching subjects, and requested education levels.', '/admin/tutor-reviews'],
      ['Moderate courses', 'Preview submitted course and lesson content, then publish it, request changes, or reject it with an auditable decision.', '/admin/courses'],
      ['Moderate reviews', 'Investigate reported feedback, hide policy violations, restore safe reviews, or dismiss unsupported reports without editing the original review.', '/admin/reviews'],
      ['Monitor operations', 'View aggregate tutoring activity, users, learning impact, course activity, and financial summaries.', '/reports'],
      ['Resolve safety issues', 'Investigate disputes and record clear decisions and comments.', '/admin/disputes'],
      ['Produce reports', 'Generate printable operational and role-based reports without exposing unnecessary private data.', '/reports'],
    ],
    limits: [
      'Approval decisions must be based on submitted evidence and should include a clear reason when changes are required or rejected.',
      'Administrative access must not be used to disclose private documents, messages, or payment information without an operational need.',
      'Private lesson schedules and schedule proposals remain visible only to the tutor, learner, and linked parent involved.',
      'Admins oversee records but should not impersonate users or silently alter the history of bookings, reviews, and decisions.',
      'Account deletion is not available; deactivation and suspension preserve records and must only be used for their documented purposes.',
    ],
  },
}

export function DashboardRoleGuide({ open, role, onClose }) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const guide = guides[String(role || '').toUpperCase()] || guides.STUDENT

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = Array.from(dialogRef.current?.querySelectorAll('a[href], button:not([disabled])') || [])
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="dashboard-guide-layer" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        ref={dialogRef}
        className="dashboard-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-guide-title"
      >
        <header className="dashboard-guide-header">
          <div>
            <span>{guide.name} manual</span>
            <h2 id="dashboard-guide-title">What you can do in Isomo</h2>
            <p>{guide.summary}</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close role guide">
            <DashboardIcon name="close" />
          </button>
        </header>

        <div className="dashboard-guide-body">
          <section aria-labelledby="guide-actions-title">
            <h3 id="guide-actions-title">Your main actions</h3>
            <div className="dashboard-guide-actions">
              {guide.actions.map(([title, description, to], index) => (
                <article key={title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h4>{title}</h4>
                    <p>{description}</p>
                    <Link to={to} onClick={onClose}>Open this area</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside aria-labelledby="guide-limits-title">
            <h3 id="guide-limits-title">Access and responsibilities</h3>
            <ul>
              {guide.limits.map((limit) => <li key={limit}>{limit}</li>)}
            </ul>
            <p>If an action is unavailable, check your account status and the instructions shown on that page before contacting support.</p>
          </aside>
        </div>
      </section>
    </div>
  )
}
