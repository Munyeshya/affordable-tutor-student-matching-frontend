import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTutorEarnings, listPayouts, requestPayout } from '../api/services/payments'
import { useAuth } from '../context/AuthContext.jsx'

function SummaryCard({ label, value }) {
  return (
    <article className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function PayoutCard({ payout }) {
  return (
    <article className="panel payout-card">
      <div className="review-head">
        <div>
          <p className="eyebrow">Payout</p>
          <h3>{payout.amount} {payout.status}</h3>
          <p className="supporting-text">Requested on {payout.created_at ? new Date(payout.created_at).toLocaleString() : 'unknown date'}</p>
        </div>
        <span className="status-pill">{payout.status}</span>
      </div>
      <div className="review-meta">
        <span>{payout.paid_at ? `Paid ${new Date(payout.paid_at).toLocaleDateString()}` : 'Not paid yet'}</span>
        <span>{payout.decisions?.length || 0} decisions</span>
      </div>
    </article>
  )
}

export function TutorEarningsPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [payoutAmount, setPayoutAmount] = useState('')
  const [message, setMessage] = useState('')

  const earningsQuery = useQuery({
    queryKey: ['tutor-earnings'],
    queryFn: () => getTutorEarnings().then((response) => response.data),
    enabled: isAuthenticated && user?.role === 'TUTOR',
  })

  const payoutsQuery = useQuery({
    queryKey: ['tutor-payouts'],
    queryFn: () => listPayouts().then((response) => response.data),
    enabled: isAuthenticated && user?.role === 'TUTOR',
  })

  const payoutMutation = useMutation({
    mutationFn: requestPayout,
    onSuccess: async () => {
      setPayoutAmount('')
      setMessage('Payout request submitted.')
      await queryClient.invalidateQueries({ queryKey: ['tutor-payouts'] })
      await queryClient.invalidateQueries({ queryKey: ['tutor-earnings'] })
    },
    onError: () => {
      setMessage('We could not submit the payout request. Please try again.')
    },
  })

  const summary = useMemo(() => ({
    bookingRevenue: earningsQuery.data?.booking_revenue ?? 0,
    courseRevenue: earningsQuery.data?.course_revenue ?? 0,
    totalEarnings: earningsQuery.data?.total_earnings ?? 0,
    availableBalance: earningsQuery.data?.available_balance ?? 0,
    pendingPayouts: earningsQuery.data?.pending_payouts ?? 0,
    approvedPayouts: earningsQuery.data?.approved_payouts ?? 0,
    paidPayouts: earningsQuery.data?.paid_payouts ?? 0,
  }), [earningsQuery.data])

  if (!isAuthenticated || user?.role !== 'TUTOR') {
    return (
      <section className="page-card card">
        <p className="eyebrow">Earnings</p>
        <h1>Only tutor accounts can view earnings.</h1>
        <p className="supporting-text">Sign in with a tutor account to manage payouts and earnings.</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create account</Link>
        </div>
      </section>
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    payoutMutation.mutate({ amount: payoutAmount })
  }

  return (
    <section className="earnings-page">
      <section className="page-card card earnings-hero">
        <div>
          <p className="eyebrow">Tutor earnings</p>
          <h1>Track your revenue and payout requests</h1>
          <p className="supporting-text">
            Keep an eye on booking revenue, course revenue, and the balance available for payout.
          </p>
        </div>

        <div className="earnings-summary-grid">
          <SummaryCard label="Booking revenue" value={summary.bookingRevenue} />
          <SummaryCard label="Course revenue" value={summary.courseRevenue} />
          <SummaryCard label="Total earnings" value={summary.totalEarnings} />
          <SummaryCard label="Available balance" value={summary.availableBalance} />
        </div>
      </section>

      <section className="earnings-actions-grid">
        <form className="page-card card payout-form" onSubmit={handleSubmit}>
          <p className="eyebrow">Request payout</p>
          <label className="account-field">
            <span>Amount</span>
            <input type="number" step="0.01" min="0" value={payoutAmount} onChange={(event) => setPayoutAmount(event.target.value)} placeholder="Enter amount" required />
          </label>
          <button className="primary-button" type="submit" disabled={payoutMutation.isPending}>
            {payoutMutation.isPending ? 'Submitting...' : 'Request payout'}
          </button>
          <p className="account-status" aria-live="polite">{message}</p>
        </form>

        <div className="earnings-stats-grid">
          <SummaryCard label="Pending payouts" value={summary.pendingPayouts} />
          <SummaryCard label="Approved payouts" value={summary.approvedPayouts} />
          <SummaryCard label="Paid payouts" value={summary.paidPayouts} />
        </div>
      </section>

      <section className="page-card card">
        <p className="eyebrow">Payout history</p>
        {payoutsQuery.isLoading ? (
          <p className="supporting-text">Loading payouts...</p>
        ) : payoutsQuery.data?.length ? (
          <div className="payout-list">
            {payoutsQuery.data.map((payout) => (
              <PayoutCard key={payout.id} payout={payout} />
            ))}
          </div>
        ) : (
          <p className="supporting-text">No payout requests yet.</p>
        )}
      </section>
    </section>
  )
}
