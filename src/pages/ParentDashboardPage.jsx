import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getParentDashboard } from '../api/services/parents'
import { useAuth } from '../context/AuthContext.jsx'

function Stat({ label, value }) {
  return (
    <article className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function StudentBlock({ item }) {
  const { student, booking_stats: bookingStats, learning_stats: learningStats, recent_bookings: recentBookings, link } = item

  return (
    <article className="panel parent-student-card">
      <div className="parent-student-head">
        <div>
          <p className="eyebrow">Linked student</p>
          <h3>{student.full_name}</h3>
          <p className="supporting-text">{student.level || 'Level not set'} · {student.location || 'Location not set'}</p>
        </div>
        <span className="status-pill">{link.is_primary ? 'Primary' : 'Linked'}</span>
      </div>

      <div className="parent-stats-grid">
        <Stat label="Total bookings" value={bookingStats.total_bookings} />
        <Stat label="Confirmed" value={bookingStats.confirmed_bookings} />
        <Stat label="Completed" value={bookingStats.completed_bookings} />
        <Stat label="Pending" value={bookingStats.pending_bookings} />
      </div>

      <div className="parent-learning-grid">
        <Stat label="Confirmed outcomes" value={learningStats.confirmed_results} />
        <Stat label="Avg. improvement" value={`${Number(learningStats.average_improvement || 0).toFixed(1)}%`} />
      </div>

      <div className="parent-recent-list">
        <h4>Recent bookings</h4>
        {recentBookings.length ? recentBookings.map((booking) => (
          <div className="parent-recent-row" key={booking.id}>
            <strong>{booking.subject__name || 'Booking'}</strong>
            <span>{booking.status}</span>
            <span>{booking.mode}</span>
          </div>
        )) : <p className="supporting-text">No bookings yet.</p>}
      </div>
    </article>
  )
}

export function ParentDashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const dashboardQuery = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => getParentDashboard().then((response) => response.data),
    enabled: isAuthenticated && user?.role === 'PARENT',
  })

  if (!isAuthenticated || user?.role !== 'PARENT') {
    return (
      <section className="page-card card">
        <p className="eyebrow">Parent dashboard</p>
        <h1>Only parent accounts can view this dashboard.</h1>
        <p className="supporting-text">
          Sign in with a parent account to review linked students and booking activity.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create account</Link>
        </div>
      </section>
    )
  }

  if (dashboardQuery.isLoading) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Parent dashboard</p>
        <h1>Loading parent overview...</h1>
        <p className="supporting-text">We are collecting your linked students and booking summary.</p>
      </section>
    )
  }

  if (dashboardQuery.isError) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Parent dashboard</p>
        <h1>We could not load your dashboard.</h1>
        <p className="supporting-text">Please refresh and try again.</p>
      </section>
    )
  }

  const dashboard = dashboardQuery.data

  return (
    <section className="dashboard-page">
      <section className="page-card card dashboard-hero">
        <div>
          <p className="eyebrow">Parent dashboard</p>
          <h1>{dashboard.profile.full_name || user.email}</h1>
          <p className="supporting-text">
            Keep track of the students you linked, their lesson bookings, and their learning progress.
          </p>
        </div>
        <div className="dashboard-summary-grid">
          <Stat label="Linked students" value={dashboard.summary.linked_students} />
          <Stat label="Total bookings" value={dashboard.summary.total_bookings} />
          <Stat label="Confirmed outcomes" value={dashboard.summary.confirmed_learning_outcomes} />
        </div>
      </section>

      <section className="dashboard-students-grid">
        {dashboard.linked_students.length ? dashboard.linked_students.map((item) => (
          <StudentBlock key={item.link.id} item={item} />
        )) : (
          <article className="page-card card">
            <p className="eyebrow">Linked students</p>
            <h2>No students linked yet</h2>
            <p className="supporting-text">
              Add a student link from your parent account once the student profile is ready.
            </p>
          </article>
        )}
      </section>
    </section>
  )
}

