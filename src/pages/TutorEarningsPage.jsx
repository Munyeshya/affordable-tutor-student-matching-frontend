import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors.js'
import { queryKeys } from '../api/queryKeys.js'
import { getTutorEarnings, listPayouts, requestPayout } from '../api/services/payments.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './TutorEarningsPage.css'

function formatMoney(value, currency = 'RWF') {
  const amount = Number(value || 0)
  return `${new Intl.NumberFormat('en-RW', {
    minimumFractionDigits: amount % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)} ${currency}`
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-RW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMonth(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-RW', { month: 'short', year: '2-digit' }).format(new Date(value))
}

function payoutTone(status) {
  if (['PAID', 'APPROVED'].includes(status)) return 'success'
  if (status === 'REJECTED') return 'danger'
  return 'warning'
}

function SummaryCard({ icon, label, value, detail, emphasis = false }) {
  return (
    <article className={emphasis ? 'is-emphasis' : ''}>
      <span><DashboardIcon name={icon} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </div>
    </article>
  )
}

function PayoutRow({ payout }) {
  return (
    <article className="tutor-payout-row">
      <span><DashboardIcon name="earnings" /></span>
      <div>
        <strong>Payout request #{payout.id}</strong>
        <small>Submitted {formatDate(payout.created_at)}</small>
      </div>
      <div>
        <strong>{formatMoney(payout.amount)}</strong>
        <small>{payout.paid_at ? `Paid ${formatDate(payout.paid_at)}` : 'Awaiting final processing'}</small>
      </div>
      <StatusBadge tone={payoutTone(payout.status)}>
        {String(payout.status || 'REQUESTED').toLowerCase()}
      </StatusBadge>
    </article>
  )
}

export function TutorEarningsPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [payoutAmount, setPayoutAmount] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [reportPeriod, setReportPeriod] = useState('90')

  const isTutor = isAuthenticated && user?.role === 'TUTOR'
  const earningsQuery = useQuery({
    queryKey: queryKeys.payments.tutorEarnings(reportPeriod),
    queryFn: () => getTutorEarnings(reportPeriod).then((response) => response.data),
    enabled: isTutor,
  })
  const payoutsQuery = useQuery({
    queryKey: queryKeys.payments.tutorPayouts,
    queryFn: () => listPayouts().then((response) => response.data),
    enabled: isTutor,
  })

  const payoutMutation = useMutation({
    mutationFn: requestPayout,
    onSuccess: async () => {
      setPayoutAmount('')
      setFormMessage('Your payout was completed and added to your withdrawal history.')
      toast.success('Payout completed.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payments.tutorPayouts }),
        queryClient.invalidateQueries({ queryKey: ['payments', 'tutor-earnings'] }),
      ])
    },
    onError: (error) => {
      const message = getApiErrorMessage(
        error,
        'We could not submit the payout request. Please try again.',
      )
      setFormMessage(message)
      toast.error(message)
    },
  })

  if (!isTutor) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Tutor earnings</p>
        <h1>Only tutor accounts can view earnings.</h1>
        <p className="supporting-text">Sign in with a tutor account to manage income and payouts.</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create account</Link>
        </div>
      </section>
    )
  }

  const summary = earningsQuery.data || {}
  const availableBalance = Number(summary.available_balance || 0)
  const recentEarnings = Array.isArray(summary.recent_earnings) ? summary.recent_earnings : []
  const payouts = Array.isArray(payoutsQuery.data) ? payoutsQuery.data : []
  const monthlyTrend = Array.isArray(summary.monthly_trend) ? summary.monthly_trend : []
  const largestMonth = Math.max(...monthlyTrend.map((item) => Number(item.total || 0)), 1)

  function handleSubmit(event) {
    event.preventDefault()
    setFormMessage('')
    const amount = Number(payoutAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      const message = 'Enter a payout amount greater than zero.'
      setFormMessage(message)
      toast.error(message)
      return
    }
    if (amount > availableBalance) {
      const message = `You can request up to ${formatMoney(availableBalance)}.`
      setFormMessage(message)
      toast.error(message)
      return
    }
    payoutMutation.mutate({ amount: payoutAmount })
  }

  return (
    <section className="tutor-earnings-page">
      <header className="tutor-earnings-header">
        <div>
          <p className="eyebrow">Tutor earnings</p>
          <h1>Your teaching income, in one clear view.</h1>
          <p>Review lesson and course revenue, understand reserved funds, and request only what is available.</p>
        </div>
        <div className="tutor-earnings-report-actions">
          <label>
            <span>Report period</span>
            <select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)}>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 12 months</option>
              <option value="all">All time</option>
            </select>
          </label>
          <button type="button" onClick={() => window.print()}>
            <DashboardIcon name="reports" size={17} /> Print report
          </button>
        </div>
      </header>

      {earningsQuery.isError ? (
        <ErrorState
          className="tutor-earnings-error"
          title="Your earnings could not be loaded."
          message={getApiErrorMessage(earningsQuery.error)}
          onRetry={() => earningsQuery.refetch()}
          retryLabel="Refresh earnings"
        />
      ) : null}

      <section className="tutor-earnings-summary" aria-label="Earnings summary">
        <SummaryCard
          icon="earnings"
          label="Withdrawable now"
          value={earningsQuery.isLoading ? '--' : formatMoney(summary.available_balance)}
          detail="Available for a new request"
          emphasis
        />
        <SummaryCard
          icon="reports"
          label="Total earned"
          value={earningsQuery.isLoading ? '--' : formatMoney(summary.total_earnings)}
          detail="Paid lessons and courses"
        />
        <SummaryCard
          icon="schedule"
          label="Reserved"
          value={earningsQuery.isLoading ? '--' : formatMoney(summary.reserved_payouts)}
          detail="Requested or approved"
        />
        <SummaryCard
          icon="verification"
          label="Paid out"
          value={earningsQuery.isLoading ? '--' : formatMoney(summary.paid_payouts)}
          detail="Completed withdrawals"
        />
      </section>

      <section className="tutor-earnings-panel tutor-earnings-report">
        <header>
          <div>
            <p className="eyebrow">Income report</p>
            <h2>{summary.report_period?.label || 'Selected period'}</h2>
          </div>
          <small>Generated {new Intl.DateTimeFormat('en-RW', { dateStyle: 'medium' }).format(new Date())}</small>
        </header>
        <div className="tutor-report-metrics">
          <article><small>Period income</small><strong>{formatMoney(summary.period_total_earnings)}</strong></article>
          <article><small>Transactions</small><strong>{summary.period_transaction_count || 0}</strong></article>
          <article><small>Average transaction</small><strong>{formatMoney(summary.average_transaction_value)}</strong></article>
          <article><small>Confirmed, awaiting payment</small><strong>{formatMoney(summary.outstanding_confirmed_value)}</strong><em>{summary.outstanding_confirmed_count || 0} bookings</em></article>
          <article><small>Successful refunds</small><strong>{formatMoney(summary.successful_refunds_total)}</strong><em>{summary.successful_refunds_count || 0} refunds</em></article>
        </div>
        <div className="tutor-income-trend" aria-label="Monthly income trend">
          <div className="tutor-income-trend-legend"><span>Bookings</span><span>Courses</span></div>
          {monthlyTrend.length ? monthlyTrend.map((item) => (
            <article key={item.month}>
              <small>{formatMonth(item.month)}</small>
              <div>
                <i style={{ width: `${(Number(item.booking_revenue || 0) / largestMonth) * 100}%` }} />
                <b style={{ width: `${(Number(item.course_revenue || 0) / largestMonth) * 100}%` }} />
              </div>
              <strong>{formatMoney(item.total)}</strong>
            </article>
          )) : <p>No successful income was recorded in the last 12 months.</p>}
        </div>
      </section>

      <section className="tutor-earnings-main-grid">
        <section className="tutor-earnings-panel tutor-income-panel">
          <header>
            <div><p className="eyebrow">Income sources</p><h2>Where your earnings came from</h2></div>
            <small>Only successful payments are counted.</small>
          </header>
          {earningsQuery.isLoading ? <SkeletonLoader className="tutor-earnings-skeleton" rows={2} /> : (
            <div className="tutor-income-sources">
              <article>
                <span><DashboardIcon name="bookings" /></span>
                <div><strong>Lesson bookings</strong><small>{summary.paid_bookings_count || 0} paid bookings</small></div>
                <b>{formatMoney(summary.booking_revenue)}</b>
              </article>
              <article>
                <span><DashboardIcon name="courses" /></span>
                <div><strong>Course purchases</strong><small>{summary.paid_course_purchases_count || 0} paid purchases</small></div>
                <b>{formatMoney(summary.course_revenue)}</b>
              </article>
            </div>
          )}
        </section>

        <form className="tutor-earnings-panel tutor-payout-form" onSubmit={handleSubmit} noValidate>
          <header>
            <div><p className="eyebrow">Withdraw funds</p><h2>Request a payout</h2></div>
            <span><DashboardIcon name="payments" /></span>
          </header>
          <p>Active tutor accounts can withdraw any available balance immediately. Suspended or deactivated accounts cannot withdraw.</p>
          <label>
            <span>Payout amount (RWF)</span>
            <div>
              <input
                aria-label="Payout amount"
                type="number"
                step="0.01"
                min="0.01"
                max={availableBalance}
                value={payoutAmount}
                onChange={(event) => setPayoutAmount(event.target.value)}
                placeholder="0"
                disabled={payoutMutation.isPending || availableBalance <= 0}
                required
              />
              <button
                type="button"
                onClick={() => setPayoutAmount(String(availableBalance))}
                disabled={availableBalance <= 0 || payoutMutation.isPending}
              >
                Use full balance
              </button>
            </div>
          </label>
          <div className="tutor-payout-available">
            <span>Maximum available</span>
            <strong>{formatMoney(availableBalance)}</strong>
          </div>
          <button
            className="primary-button"
            type="submit"
            disabled={payoutMutation.isPending || availableBalance <= 0}
          >
            {payoutMutation.isPending ? 'Processing payout...' : 'Withdraw funds'}
          </button>
          {availableBalance <= 0 && !earningsQuery.isLoading ? (
            <small>There is no withdrawable balance yet. Completed lesson and course payments will appear here.</small>
          ) : null}
          <p className="tutor-payout-message" aria-live="polite">{formMessage}</p>
        </form>
      </section>

      <section className="tutor-earnings-panel">
        <header>
          <div><p className="eyebrow">Recent income</p><h2>Latest successful earnings</h2></div>
          <small>Lesson bookings and course sales together.</small>
        </header>
        {earningsQuery.isLoading ? (
          <SkeletonLoader className="tutor-earnings-skeleton" rows={3} />
        ) : recentEarnings.length ? (
          <div className="tutor-income-list">
            {recentEarnings.map((earning) => (
              <article key={`${earning.kind}-${earning.id}`}>
                <span><DashboardIcon name={earning.kind === 'COURSE' ? 'courses' : 'bookings'} /></span>
                <div>
                  <strong>{earning.title}</strong>
                  <small>{earning.kind === 'COURSE' ? 'Course purchase' : 'Lesson booking'} / {formatDate(earning.earned_at)}</small>
                </div>
                <b>+ {formatMoney(earning.amount, earning.currency)}</b>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            className="tutor-earnings-empty"
            icon={<DashboardIcon name="earnings" size={26} />}
            title="No completed earnings yet"
            description="Income will appear after a lesson or course payment succeeds."
          />
        )}
      </section>

      <section className="tutor-earnings-panel">
        <header>
          <div><p className="eyebrow">Payout history</p><h2>Requests and decisions</h2></div>
          <small>{payouts.length} total requests</small>
        </header>
        {payoutsQuery.isError ? (
          <ErrorState
            className="tutor-earnings-error"
            title="Payout history could not be loaded."
            message={getApiErrorMessage(payoutsQuery.error)}
            onRetry={() => payoutsQuery.refetch()}
          />
        ) : payoutsQuery.isLoading ? (
          <SkeletonLoader className="tutor-earnings-skeleton" rows={3} />
        ) : payouts.length ? (
          <div className="tutor-payout-list">
            {payouts.map((payout) => <PayoutRow key={payout.id} payout={payout} />)}
          </div>
        ) : (
          <EmptyState
            className="tutor-earnings-empty"
            title="No payout requests yet"
            description="Your submitted requests and administrator decisions will be recorded here."
          />
        )}
      </section>
    </section>
  )
}
