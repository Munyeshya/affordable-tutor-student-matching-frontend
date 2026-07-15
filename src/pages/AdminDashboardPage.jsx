import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import { listDisputes } from '../api/services/bookings'
import { getAdminDashboard } from '../api/services/reports'
import { listTutorVerifications } from '../api/services/tutors'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { queryKeys } from '../api/queryKeys'
import { DashboardPanelHeading, DashboardStatCard, EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './AdminDashboardPage.css'

function formatMoney(value, currency = 'RWF') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return `${currency} 0`
  return `${currency} ${new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 }).format(amount)}`
}

function formatStatus(value) {
  if (!value) return 'Unknown'
  return String(value).toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function formatDate(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return new Intl.DateTimeFormat('en-RW', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function AdminSkeleton({ rows = 3 }) {
  return <SkeletonLoader rows={rows} className="admin-dashboard-skeleton" />
}
function SectionHeading(props) {
  return <DashboardPanelHeading className="admin-panel-heading" {...props} />
}
export function AdminDashboardPage() {
  const { user } = useAuth()
  const analyticsQuery = useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: () => getAdminDashboard().then((response) => response.data),
    staleTime: 30_000,
  })
  const verificationsQuery = useQuery({
    queryKey: queryKeys.admin.tutorVerifications('PENDING'),
    queryFn: () => listTutorVerifications({ status: 'PENDING' }).then((response) => response.data),
    staleTime: 30_000,
  })
  const disputesQuery = useQuery({
    queryKey: queryKeys.admin.disputes,
    queryFn: () => listDisputes().then((response) => response.data),
    staleTime: 30_000,
  })

  const analytics = analyticsQuery.data || {}
  const users = analytics.users || {}
  const tutoring = analytics.tutoring || {}
  const pipeline = analytics.tutor_pipeline || {}
  const impact = analytics.educational_impact || {}
  const courses = analytics.courses || {}
  const revenue = analytics.revenue || {}
  const health = analytics.platform_health || {}
  const leaderboards = analytics.leaderboards || {}
  const trends = analytics.trends || {}
  const verifications = Array.isArray(verificationsQuery.data) ? verificationsQuery.data : []
  const disputes = Array.isArray(disputesQuery.data) ? disputesQuery.data : []
  const openDisputes = disputes.filter((dispute) => ['OPEN', 'UNDER_REVIEW'].includes(dispute.status))
  const totalUsers = ['total_students', 'total_tutors', 'total_parents', 'total_admins']
    .reduce((total, key) => total + Number(users[key] || 0), 0)
  const monthlyBookings = Array.isArray(trends.monthly_bookings) ? trends.monthly_bookings.slice(-6) : []
  const highestBookingMonth = Math.max(...monthlyBookings.map((item) => Number(item.count || 0)), 1)
  const topSubjects = Array.isArray(leaderboards.top_subjects_by_bookings)
    ? leaderboards.top_subjects_by_bookings.slice(0, 5)
    : []
  const firstName = (user?.first_name || user?.username || user?.email || 'Admin').split(/\s|@/)[0]
  const failedQuery = [analyticsQuery, verificationsQuery, disputesQuery].find((query) => query.isError)

  function refreshDashboard() {
    analyticsQuery.refetch()
    verificationsQuery.refetch()
    disputesQuery.refetch()
  }

  return (
    <section className="admin-overview">
      <header className="admin-overview-header">
        <div>
          <p className="admin-overview-eyebrow">Administration</p>
          <h1>Welcome back, {firstName}</h1>
          <p>Monitor platform health, approve qualified tutors, and protect affordable learning operations.</p>
        </div>
        <div className="admin-overview-actions">
          <Link className="secondary-button" to="/reports">Printable report</Link>
          <Link className="primary-button" to="/admin/tutor-reviews">Review tutors</Link>
        </div>
      </header>

      {failedQuery ? (
        <ErrorState
          className="admin-overview-error"
          title="Some administration data could not be loaded."
          message={getApiErrorMessage(failedQuery.error)}
          onRetry={refreshDashboard}
          retryLabel="Refresh overview"
        />
      ) : null}

      <section className="admin-overview-stats" aria-label="Platform summary">
        <DashboardStatCard icon={<DashboardIcon name="students" />} label="Platform users" value={analyticsQuery.isLoading ? '--' : totalUsers} detail={(users.new_registrations || 0) + ' new today'} />
        <DashboardStatCard icon={<DashboardIcon name="bookings" />} label="Total bookings" value={analyticsQuery.isLoading ? '--' : tutoring.total_bookings || 0} detail={(tutoring.completed_bookings || 0) + ' completed'} />
        <DashboardStatCard icon={<DashboardIcon name="verification" />} label="Marketplace-ready tutors" value={analyticsQuery.isLoading ? '--' : pipeline.marketplace_ready_tutors || 0} detail={(pipeline.pending_verifications || 0) + ' awaiting review'} />
        <DashboardStatCard icon={<DashboardIcon name="earnings" />} label="Course revenue" value={analyticsQuery.isLoading ? '--' : formatMoney(revenue.platform_revenue)} detail={(courses.course_purchases || 0) + ' purchases'} />
      </section>

      <section className="admin-health-strip" aria-label="Administration queues">
        <Link to="/admin/tutor-reviews"><span><DashboardIcon name="verification" /></span><div><small>Tutor reviews</small><strong>{health.pending_verifications || 0}</strong></div></Link>
        <Link to="/admin/disputes"><span><DashboardIcon name="disputes" /></span><div><small>Open disputes</small><strong>{health.open_disputes || 0}</strong></div></Link>
        <Link to="/bookings"><span><DashboardIcon name="bookings" /></span><div><small>Open bookings</small><strong>{health.open_bookings || 0}</strong></div></Link>
        <Link to="/reports"><span><DashboardIcon name="courses" /></span><div><small>Course reviews</small><strong>{health.pending_course_reviews || 0}</strong></div></Link>
        <Link to="/notifications"><span><DashboardIcon name="bell" /></span><div><small>Unread notices</small><strong>{health.unread_notifications || 0}</strong></div></Link>
      </section>

      <div className="admin-overview-grid">
        <div className="admin-overview-main">
          <section className="admin-overview-panel admin-trend-panel">
            <SectionHeading eyebrow="Activity" title="Booking trend" to="/reports" action="Full report" />
            {analyticsQuery.isLoading ? <AdminSkeleton rows={4} /> : monthlyBookings.length ? (
              <div className="admin-booking-chart" role="img" aria-label="Booking totals for the last six recorded months">
                {monthlyBookings.map((item) => {
                  const count = Number(item.count || 0)
                  const month = new Intl.DateTimeFormat('en-RW', { month: 'short' }).format(new Date(item.month))
                  return (
                    <div key={item.month}>
                      <strong>{count}</strong>
                      <span><i style={{ height: `${Math.max(6, (count / highestBookingMonth) * 100)}%` }} /></span>
                      <small>{month}</small>
                    </div>
                  )
                })}
              </div>
            ) : <p className="admin-panel-message">Monthly booking activity will appear as the platform grows.</p>}
            <dl className="admin-booking-breakdown">
              <div><dt>Pending</dt><dd>{tutoring.pending_bookings || 0}</dd></div>
              <div><dt>Confirmed</dt><dd>{tutoring.confirmed_bookings || 0}</dd></div>
              <div><dt>Completed</dt><dd>{tutoring.completed_bookings || 0}</dd></div>
              <div><dt>Cancelled</dt><dd>{tutoring.cancelled_bookings || 0}</dd></div>
            </dl>
          </section>

          <section className="admin-overview-panel">
            <SectionHeading eyebrow="Approval queue" title="Tutor verifications" to="/admin/tutor-reviews" action="Review all" />
            {verificationsQuery.isLoading ? <AdminSkeleton /> : verifications.length ? (
              <div className="admin-verification-list">
                {verifications.slice(0, 4).map((verification) => {
                  const missing = Array.isArray(verification.missing_required_documents) ? verification.missing_required_documents : []
                  return (
                    <article key={verification.id}>
                      <span>{verification.tutor_name?.slice(0, 2).toUpperCase() || 'TU'}</span>
                      <div><h3>{verification.tutor_name || verification.tutor_email}</h3><p>{verification.documents?.length || 0} documents / Submitted {formatDate(verification.created_at)}</p></div>
                      <b className={missing.length ? 'is-warning' : 'is-ready'}>{missing.length ? `${missing.length} missing` : 'Ready'}</b>
                      <Link to="/admin/tutor-reviews">Review</Link>
                    </article>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                className="admin-panel-empty"
                icon={<DashboardIcon name="verification" size={26} />}
                title="Verification queue is clear"
                description="New tutor applications will appear here for document and agreement review."
              />
            )}
          </section>

          <section className="admin-overview-panel">
            <SectionHeading eyebrow="Trust and safety" title="Open disputes" to="/admin/disputes" action="Manage" />
            {disputesQuery.isLoading ? <AdminSkeleton /> : openDisputes.length ? (
              <div className="admin-dispute-list">
                {openDisputes.slice(0, 4).map((dispute) => (
                  <article key={dispute.id}>
                    <span><DashboardIcon name="disputes" /></span>
                    <div><h3>Booking #{dispute.booking_id}</h3><p>{dispute.reported_by_email} reported {dispute.reported_against_email}</p><small>{dispute.reason}</small></div>
                    <b>{formatStatus(dispute.status)}</b>
                    <Link to="/admin/disputes">Open</Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-panel-empty"><DashboardIcon name="disputes" size={26} /><h3>No open disputes</h3><p>Reported booking issues requiring an admin decision will appear here.</p></div>
            )}
          </section>
        </div>

        <aside className="admin-overview-side" aria-label="Platform impact and shortcuts">
          <section className="admin-overview-panel admin-impact-panel">
            <SectionHeading eyebrow="Learning impact" title="Verified outcomes" to="/reports" action="Details" />
            {analyticsQuery.isLoading ? <AdminSkeleton rows={2} /> : (
              <><div className="admin-impact-total"><strong>{Number(impact.average_improvement || 0).toFixed(1)}%</strong><span>average confirmed improvement</span></div><dl><div><dt>Students helped</dt><dd>{impact.students_helped || 0}</dd></div><div><dt>Confirmed outcomes</dt><dd>{impact.confirmed_improvements || 0}</dd></div><div><dt>Highest improvement</dt><dd>{Number(impact.highest_improvement || 0).toFixed(1)}%</dd></div></dl></>
            )}
          </section>

          <section className="admin-overview-panel">
            <SectionHeading eyebrow="Marketplace" title="Courses and tutors" />
            <dl className="admin-marketplace-list">
              <div><dt>Published courses</dt><dd>{courses.published_courses || 0}</dd></div>
              <div><dt>Pending courses</dt><dd>{courses.pending_courses || 0}</dd></div>
              <div><dt>Total lessons</dt><dd>{courses.total_lessons || 0}</dd></div>
              <div><dt>Verified tutors</dt><dd>{users.verified_tutors || 0}</dd></div>
              <div><dt>Signed agreements</dt><dd>{pipeline.tutors_with_signed_agreements || 0}</dd></div>
            </dl>
          </section>

          <section className="admin-overview-panel">
            <SectionHeading eyebrow="Demand" title="Top subjects" />
            {analyticsQuery.isLoading ? <AdminSkeleton /> : topSubjects.length ? (
              <DataTable
                className="admin-subject-table"
                caption="Top subjects by booking demand"
                rows={topSubjects}
                rowKey={(subject) => subject.subject__id || subject.subject__name}
                columns={[
                  { key: 'rank', header: 'Rank', render: (_, index) => String(index + 1).padStart(2, '0') },
                  { key: 'subject', header: 'Subject', render: (subject) => subject.subject__name || 'Unassigned' },
                  { key: 'bookings', header: 'Bookings', render: (subject) => subject.total || 0 },
                ]}
              />
            ) : <p className="admin-panel-message">Subject demand will appear after bookings are created.</p>}
          </section>

          <section className="admin-overview-panel">
            <SectionHeading eyebrow="Quick access" title="Administration" />
            <nav className="admin-quick-links" aria-label="Admin shortcuts">
              <Link to="/admin/tutor-reviews"><DashboardIcon name="verification" /><span><strong>Tutor verification</strong><small>Review documents and agreements</small></span></Link>
              <Link to="/admin/disputes"><DashboardIcon name="disputes" /><span><strong>Dispute management</strong><small>Resolve reported booking issues</small></span></Link>
              <Link to="/bookings"><DashboardIcon name="bookings" /><span><strong>All bookings</strong><small>Monitor platform tutoring activity</small></span></Link>
              <Link to="/reports"><DashboardIcon name="reports" /><span><strong>Printable reports</strong><small>Open the complete platform report</small></span></Link>
            </nav>
          </section>
        </aside>
      </div>
    </section>
  )
}
