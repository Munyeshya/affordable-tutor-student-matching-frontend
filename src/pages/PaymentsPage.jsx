import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors.js'
import { queryKeys } from '../api/queryKeys.js'
import {
  getPrintablePaymentReceipt,
  listCoursePurchases,
  listPayments,
} from '../api/services/payments.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { PaymentCheckoutDialog } from '../components/payments/PaymentCheckoutDialog.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useBookingsQuery } from '../hooks/useCommonQueries.js'
import './PaymentsPage.css'

const HISTORY_FILTERS = ['ALL', 'PAID', 'PENDING', 'FAILED', 'REFUNDED']

function formatMoney(value, currency = 'RWF') {
  return `${new Intl.NumberFormat('en-RW', { maximumFractionDigits: 2 }).format(Number(value || 0))} ${currency}`
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

function transactionDate(item) {
  return item.paid_at || item.purchased_at || item.created_at
}

export function PaymentsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [checkoutItem, setCheckoutItem] = useState(null)

  const bookingsQuery = useBookingsQuery({ staleTime: 30_000 })
  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments.bookings,
    queryFn: () => listPayments().then((response) => response.data),
    staleTime: 30_000,
  })
  const purchasesQuery = useQuery({
    queryKey: queryKeys.payments.coursePurchases,
    queryFn: () => listCoursePurchases().then((response) => response.data),
    staleTime: 30_000,
  })

  const printMutation = useMutation({
    mutationFn: ({ receiptNumber }) => getPrintablePaymentReceipt(receiptNumber),
    onSuccess: (response, { receiptWindow }) => {
      receiptWindow.document.open()
      receiptWindow.document.write(response.data)
      receiptWindow.document.close()
      receiptWindow.opener = null
    },
    onError: (error, { receiptWindow }) => {
      receiptWindow.close()
      toast.error(getApiErrorMessage(error, 'Could not open this receipt.'))
    },
  })

  const bookings = Array.isArray(bookingsQuery.data) ? bookingsQuery.data : []
  const bookingPayments = Array.isArray(paymentsQuery.data) ? paymentsQuery.data : []
  const coursePurchases = Array.isArray(purchasesQuery.data) ? purchasesQuery.data : []
  const paymentsByBooking = new Map(bookingPayments.map((item) => [String(item.booking_id), item]))
  const outstandingBookings = bookings.filter((booking) => {
    const payment = paymentsByBooking.get(String(booking.id))
    return ['CONFIRMED', 'COMPLETED'].includes(booking.status)
      && !['PAID', 'REFUNDED'].includes(payment?.status)
  })
  const outstandingTotal = outstandingBookings.reduce(
    (total, booking) => total + Number(booking.total_amount || 0),
    0,
  )
  const paidTransactions = [
    ...bookingPayments.filter((item) => item.status === 'PAID'),
    ...coursePurchases.filter((item) => item.status === 'PAID'),
  ]
  const paidTotal = paidTransactions.reduce((total, item) => total + Number(item.amount || 0), 0)
  const history = [
    ...bookingPayments.map((item) => ({ ...item, kind: 'booking', label: `Booking #${item.booking_id}` })),
    ...coursePurchases.map((item) => ({ ...item, kind: 'course', label: item.course_title || 'Course purchase' })),
  ].sort((left, right) => String(transactionDate(right)).localeCompare(String(transactionDate(left))))
  const visibleHistory = activeFilter === 'ALL'
    ? history
    : history.filter((item) => item.status === activeFilter)
  const failedQuery = [bookingsQuery, paymentsQuery, purchasesQuery].find((query) => query.isError)
  const isLoading = bookingsQuery.isLoading || paymentsQuery.isLoading || purchasesQuery.isLoading

  function printReceipt(receiptNumber) {
    const receiptWindow = window.open('', '_blank')
    if (!receiptWindow) {
      toast.info('Allow pop-ups to print your receipt.')
      return
    }
    printMutation.mutate({ receiptNumber, receiptWindow })
  }

  function openBookingCheckout(booking) {
    setCheckoutItem({
      kind: 'booking',
      id: booking.id,
      title: `${booking.subject_name || 'Lesson'} booking #${booking.id}`,
      amount: booking.total_amount,
      currency: booking.currency,
      learnerName: booking.student_name,
    })
  }

  function retryCoursePurchase(purchase) {
    setCheckoutItem({
      kind: 'course',
      id: purchase.course,
      title: purchase.course_title,
      amount: purchase.amount,
      currency: purchase.currency,
      learnerName: purchase.learner_name,
      learners: user?.role === 'PARENT'
        ? [{ id: purchase.student, name: purchase.learner_name }]
        : [],
      initialLearnerId: purchase.student,
    })
  }

  async function refreshPayments() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.bookings }),
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.coursePurchases }),
      queryClient.invalidateQueries({ queryKey: queryKeys.learning.library }),
      queryClient.invalidateQueries({ queryKey: queryKeys.parents.dashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    ])
  }

  return (
    <section className="payments-page">
      <header className="payments-page-header">
        <div>
          <p className="eyebrow">Payments</p>
          <h1>Learning payments, clearly recorded.</h1>
          <p>Complete simulated payments, track who received the learning, and print every available receipt.</p>
        </div>
        <span><DashboardIcon name="payments" size={24} /></span>
      </header>

      {failedQuery ? (
        <ErrorState
          className="payments-error"
          title="Some payment information could not be loaded."
          message={getApiErrorMessage(failedQuery.error)}
          onRetry={() => {
            bookingsQuery.refetch()
            paymentsQuery.refetch()
            purchasesQuery.refetch()
          }}
          retryLabel="Refresh payments"
        />
      ) : null}

      <section className="payments-summary" aria-label="Payment summary">
        <article><span><DashboardIcon name="bookings" /></span><div><small>Lessons awaiting payment</small><strong>{isLoading ? '--' : outstandingBookings.length}</strong></div></article>
        <article><span><DashboardIcon name="payments" /></span><div><small>Outstanding lesson value</small><strong>{isLoading ? '--' : formatMoney(outstandingTotal)}</strong></div></article>
        <article><span><DashboardIcon name="verification" /></span><div><small>Completed transactions</small><strong>{isLoading ? '--' : paidTransactions.length}</strong></div></article>
        <article><span><DashboardIcon name="reports" /></span><div><small>Total simulated payments</small><strong>{isLoading ? '--' : formatMoney(paidTotal)}</strong></div></article>
      </section>

      <section className="payments-panel">
        <header><div><p className="eyebrow">Action required</p><h2>Outstanding lesson payments</h2></div><small>Payment appears after tutor confirmation.</small></header>
        {isLoading ? <SkeletonLoader rows={2} /> : outstandingBookings.length ? (
          <div className="payments-outstanding-list">
            {outstandingBookings.map((booking) => (
              <article key={booking.id}>
                <span><DashboardIcon name="bookings" /></span>
                <div><strong>{booking.subject_name || 'Tutoring lesson'}</strong><small>{booking.student_name} with {booking.tutor_name}</small></div>
                <div><strong>{formatMoney(booking.total_amount, booking.currency)}</strong><small>{formatDate(booking.start_datetime)}</small></div>
                <button type="button" className="primary-button" onClick={() => openBookingCheckout(booking)}>Pay now</button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            className="payments-empty"
            icon={<DashboardIcon name="verification" size={26} />}
            title="No lesson payments are due"
            description="Confirmed lessons that need payment will appear here."
          />
        )}
      </section>

      <section className="payments-panel">
        <header><div><p className="eyebrow">Records</p><h2>Transaction history</h2></div><small>Booking and course payments in one list.</small></header>
        <nav className="payments-filters" aria-label="Filter payment history">
          {HISTORY_FILTERS.map((filter) => (
            <button className={filter === activeFilter ? 'is-active' : ''} type="button" key={filter} onClick={() => setActiveFilter(filter)}>
              {filter.toLowerCase()} <span>{filter === 'ALL' ? history.length : history.filter((item) => item.status === filter).length}</span>
            </button>
          ))}
        </nav>
        {isLoading ? <SkeletonLoader rows={4} /> : visibleHistory.length ? (
          <div className="payments-history-list">
            {visibleHistory.map((item) => (
              <article key={`${item.kind}-${item.id}`}>
                <span><DashboardIcon name={item.kind === 'course' ? 'courses' : 'bookings'} /></span>
                <div>
                  <strong>{item.label}</strong>
                  <small>For {item.learner_name || item.student_name || 'learner'} / Paid by {item.payer_name || 'account holder'}</small>
                </div>
                <div><strong>{formatMoney(item.amount, item.currency)}</strong><small>{formatDate(transactionDate(item))}</small></div>
                <b className={`payment-history-status is-${String(item.status).toLowerCase()}`}>{item.status}</b>
                {item.receipt_number ? (
                  <button type="button" className="secondary-button" onClick={() => printReceipt(item.receipt_number)} disabled={printMutation.isPending}>Receipt</button>
                ) : item.kind === 'course' && ['FAILED', 'EXPIRED'].includes(item.status) ? (
                  <button type="button" className="secondary-button" onClick={() => retryCoursePurchase(item)}>Try again</button>
                ) : <span className="payments-no-receipt">No receipt yet</span>}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState className="payments-empty" title="No transactions in this view" description="Choose another status to review more payment records." />
        )}
      </section>

      <PaymentCheckoutDialog
        key={checkoutItem ? `${checkoutItem.kind}-${checkoutItem.id}` : 'payments-checkout'}
        open={Boolean(checkoutItem)}
        kind={checkoutItem?.kind}
        itemId={checkoutItem?.id}
        title={checkoutItem?.title}
        amount={checkoutItem?.amount}
        currency={checkoutItem?.currency || 'RWF'}
        learnerName={checkoutItem?.learnerName}
        learners={checkoutItem?.learners || []}
        initialLearnerId={checkoutItem?.initialLearnerId || ''}
        initialPhone={user?.profile?.data?.phone_number || ''}
        onClose={() => setCheckoutItem(null)}
        onSettled={refreshPayments}
      />
    </section>
  )
}
