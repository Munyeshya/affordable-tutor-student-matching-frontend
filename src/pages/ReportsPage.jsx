import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import { openAdminPrintableReport, openMyPrintableReport } from '../api/services/reports.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { UserAvatar } from '../components/ui/UserAvatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './ReportsPage.css'

const reportDetailsByRole = {
  STUDENT: {
    eyebrow: 'Student productivity report card',
    title: 'Your learning progress, ready to present.',
    description: 'Open a branded A4 report card with productivity, tutoring attendance, course completion, tutor notes, and student-confirmed assessment growth.',
    sections: [
      ['Productivity score', 'A clear engagement score based on completed tutoring, course lessons, and confirmed assessments.', 'reports'],
      ['Report-card results', 'Initial scores, final scores, growth, course completion, and tutor progress notes.', 'assessments'],
      ['Student context', 'Academic level, school, learning goals, and recorded learning investment.', 'account'],
    ],
    privacy: 'This report contains only your own learning and account information.',
  },
  TUTOR: {
    eyebrow: 'Tutor performance report',
    title: 'A professional record of your tutoring work.',
    description: 'Present your marketplace readiness, completed teaching activity, course work, earnings, and learner feedback.',
    sections: [
      ['Professional readiness', 'Verification, agreement, teaching subjects, and marketplace status.', 'verification'],
      ['Teaching performance', 'Completed bookings, courses, lessons, reviews, and average rating.', 'courses'],
      ['Income summary', 'Paid lesson and course earnings shown separately and together.', 'earnings'],
    ],
    privacy: 'Only your own tutoring records are included. Other tutors’ and learners’ private schedules are excluded.',
  },
  PARENT: {
    eyebrow: 'Family learning report',
    title: 'Understand the support your learners receive.',
    description: 'See linked students, tutoring activity, completed support, and confirmed learning outcomes without unnecessary complexity.',
    sections: [
      ['Linked learners', 'The students formally connected to your parent account.', 'students'],
      ['Tutoring support', 'Booking totals and completed learning support across your family.', 'bookings'],
      ['Learning outcomes', 'Student-confirmed assessment improvement and recent results.', 'reports'],
    ],
    privacy: 'The report is limited to students formally linked to your parent account.',
  },
  ADMIN: {
    eyebrow: 'Platform impact report',
    title: 'Measure reach, quality, and platform health.',
    description: 'Use aggregate operational, educational, marketplace, and financial indicators to understand ISOMO without browsing private schedules.',
    sections: [
      ['Educational impact', 'Students reached, verified initial and final scores, and positive outcomes.', 'assessments'],
      ['Marketplace health', 'Users, verified tutors, courses, moderation queues, and demand trends.', 'verification'],
      ['Sustainable access', 'Aggregate revenue, tutor employment impact, and affordability activity.', 'reports'],
    ],
    privacy: 'Tutor-client schedules and custom schedule proposals are excluded. Disputes remain available only for case resolution.',
  },
}

export function ReportsPage() {
  const { user, isAuthenticated } = useAuth()
  const [opening, setOpening] = useState(false)
  const [notice, setNotice] = useState('')

  if (!isAuthenticated) {
    return (
      <section className="reports-page reports-signin">
        <p className="eyebrow">Reports</p>
        <h1>Sign in to open your role-based report.</h1>
        <p>Reports only include information your account is permitted to access.</p>
        <div>
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create account</Link>
        </div>
      </section>
    )
  }

  const role = String(user?.role || 'STUDENT').toUpperCase()
  const details = reportDetailsByRole[role] || reportDetailsByRole.STUDENT
  const displayName = user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || user?.email || 'ISOMO user'
  const isAdmin = role === 'ADMIN'

  async function openReport() {
    setOpening(true)
    setNotice('')
    try {
      if (isAdmin) {
        await openAdminPrintableReport()
      } else {
        await openMyPrintableReport()
      }
      const message = 'Your report opened in a new tab and is ready to print or save as PDF.'
      setNotice(message)
      toast.success(message)
    } catch (error) {
      const message = getApiErrorMessage(error)
      setNotice(message)
      toast.error(message)
    } finally {
      setOpening(false)
    }
  }

  return (
    <section className="reports-page">
      <header className="reports-header">
        <div>
          <p>{details.eyebrow}</p>
          <h1>{details.title}</h1>
          <span>{details.description}</span>
        </div>
        <div className="reports-identity">
          <UserAvatar
            src={user?.profile_image_url}
            name={displayName}
            fallback="IS"
            alt={`${displayName} profile`}
          />
          <div>
            <small>Report prepared for</small>
            <strong>{displayName}</strong>
            <span>{role.toLowerCase().replace(/^./, (letter) => letter.toUpperCase())} account</span>
          </div>
        </div>
      </header>

      {notice ? <p className="reports-notice" role="status">{notice}</p> : null}

      <div className="reports-layout">
        <article className="reports-preview">
          <div className="reports-preview-heading">
            <span><DashboardIcon name="reports" size={22} /></span>
            <div>
              <p>Included information</p>
              <h2>A comprehensive summary that stays easy to scan.</h2>
            </div>
          </div>
          <div className="reports-section-list">
            {details.sections.map(([title, description, icon], index) => (
              <div key={title}>
                <span><DashboardIcon name={icon} size={19} /></span>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <div><h3>{title}</h3><p>{description}</p></div>
              </div>
            ))}
          </div>
        </article>

        <aside className="reports-action-card">
          <span className="reports-document-icon"><DashboardIcon name="documents" size={28} /></span>
          <p>Print-ready A4 report</p>
          <h2>Open your {isAdmin ? 'platform impact' : 'personal'} report</h2>
          <span>The report opens in a new tab with a profile image or initials, organized metrics, readable activity tables, and print-safe page breaks.</span>
          <button className="primary-button" type="button" onClick={openReport} disabled={opening}>
            <DashboardIcon name="reports" size={18} />
            {opening ? 'Preparing report...' : 'Open report'}
          </button>
          <div className="reports-privacy">
            <DashboardIcon name="verification" size={18} />
            <p><strong>Privacy boundary</strong><span>{details.privacy}</span></p>
          </div>
        </aside>
      </div>
    </section>
  )
}
