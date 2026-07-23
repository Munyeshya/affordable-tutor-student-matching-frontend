import React, { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getApiErrorMessage } from '../../api/errors'
import { queryKeys } from '../../api/queryKeys'
import {
  createCoursePurchase,
  getPaymentTransaction,
  getPrintablePaymentReceipt,
  initiateBookingPayment,
  initiateSchedulePayment,
  listPaymentProviders,
} from '../../api/services/payments'
import { ConfirmationDialog } from '../ui/ConfirmationDialog.jsx'
import './PaymentCheckoutDialog.css'

const FINAL_STATUSES = new Set(['PAID', 'FAILED', 'EXPIRED', 'REFUNDED'])
const METHOD_COPY = {
  MTN: ['MTN Mobile Money', 'Simulate approval from an MTN MoMo wallet.'],
  AIRTEL: ['Airtel Money', 'Simulate approval from an Airtel Money wallet.'],
  CARD: ['Debit or credit card', 'Simulate a card checkout without storing card details.'],
  BANK: ['Bank transfer', 'Simulate a confirmed bank transfer reference.'],
}

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatMoney(value, currency = 'RWF') {
  return `${new Intl.NumberFormat('en-RW').format(Number(value || 0))} ${currency}`
}

function paymentErrorMessage(error) {
  if (error?.code === 'ERR_NETWORK' || (!error?.response && error?.request)) {
    return 'The Isomo payment service is not reachable. Confirm the backend service is running, then retry. No payment or course access was recorded.'
  }
  return getApiErrorMessage(error, 'Could not complete this payment simulation.')
}

function statusCopy(status) {
  const copy = {
    PENDING: ['Waiting for approval', 'Approve the payment prompt, then check the status again.'],
    PAID: ['Payment completed', 'The simulated transaction was confirmed and the learning access is ready.'],
    FAILED: ['Payment failed', 'No access was granted. Review the details and safely try again.'],
    EXPIRED: ['Payment expired', 'The approval window closed. Start a fresh attempt to continue.'],
    REFUNDED: ['Payment refunded', 'The payment has been returned and recorded in the transaction history.'],
  }
  return copy[status] || ['Payment update', 'Review the latest transaction status.']
}

function CheckoutSteps({ step }) {
  const steps = ['Review', 'Method', 'Confirm']
  return (
    <ol className="payment-stepper" aria-label="Checkout progress">
      {steps.map((label, index) => (
        <li className={index + 1 <= step ? 'is-active' : ''} key={label}>
          <span>{index + 1}</span><small>{label}</small>
        </li>
      ))}
    </ol>
  )
}

export function PaymentCheckoutDialog({
  open,
  kind,
  itemId,
  title,
  amount,
  currency = 'RWF',
  initialPhone = '',
  learnerName = '',
  learners = [],
  initialLearnerId = '',
  onClose,
  onSettled,
}) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [provider, setProvider] = useState('')
  const [network, setNetwork] = useState('MTN')
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '')
  const [selectedLearnerId, setSelectedLearnerId] = useState(String(initialLearnerId || learners[0]?.id || ''))
  const [confirmed, setConfirmed] = useState(false)
  const [transaction, setTransaction] = useState(null)
  const [requestError, setRequestError] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey)
  const settledIdRef = useRef(null)

  const providersQuery = useQuery({
    queryKey: queryKeys.payments.providers,
    queryFn: () => listPaymentProviders().then((response) => response.data),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })
  const availableProviders = providersQuery.data?.providers || []
  const activeProvider = provider || providersQuery.data?.default || availableProviders[0]?.code || ''
  const selectedProvider = availableProviders.find((item) => item.code === activeProvider)
  const providerMethods = selectedProvider?.networks || []
  const activeNetwork = providerMethods.includes(network) ? network : providerMethods[0] || network
  const selectedLearner = learners.find((item) => String(item.id) === selectedLearnerId)
  const displayedLearnerName = selectedLearner?.name || learnerName || 'Your student account'

  const statusQuery = useQuery({
    queryKey: queryKeys.payments.transaction(kind, transaction?.id),
    queryFn: () => getPaymentTransaction(kind, transaction.id).then((response) => response.data),
    enabled: Boolean(open && ['booking', 'course'].includes(kind) && transaction?.id && transaction.status === 'PENDING'),
    refetchInterval: (query) => query.state.data?.status === 'PENDING' ? 4000 : false,
  })
  const currentTransaction = statusQuery.data || transaction

  useEffect(() => {
    if (currentTransaction?.status !== 'PAID' || settledIdRef.current === currentTransaction.id) return
    settledIdRef.current = currentTransaction.id
    toast.success('Payment simulation completed successfully.')
    onSettled?.(currentTransaction)
  }, [currentTransaction, onSettled])

  const initiateMutation = useMutation({
    onMutate: () => setRequestError(''),
    mutationFn: () => {
      const payload = {
        provider: activeProvider,
        phone_number: activeProvider === 'FLUTTERWAVE' ? phoneNumber.trim() : '',
        network: activeNetwork,
      }
      if (kind === 'booking') {
        return initiateBookingPayment({ ...payload, booking_id: itemId }, idempotencyKey)
      }
      if (kind === 'schedule') {
        return initiateSchedulePayment({ ...payload, proposal_id: itemId }, idempotencyKey)
      }
      return createCoursePurchase({
        ...payload,
        course_id: itemId,
        ...(selectedLearnerId ? { student_id: Number(selectedLearnerId) } : {}),
      }, idempotencyKey)
    },
    onSuccess: (response) => {
      setTransaction(response.data)
      if (response.data.status === 'PENDING') toast.info('Payment request sent for approval.')
    },
    onError: (error) => {
      const message = paymentErrorMessage(error)
      setRequestError(message)
      toast.error(message)
    },
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
      toast.error(getApiErrorMessage(error, 'Could not open the receipt.'))
    },
  })

  if (!open) return null

  const [statusTitle, statusDetail] = statusCopy(currentTransaction?.status)
  const receiptNumbers = currentTransaction?.receipt_numbers
    || (currentTransaction?.receipt_number ? [currentTransaction.receipt_number] : [])

  function resetAttempt() {
    setTransaction(null)
    setStep(1)
    setConfirmed(false)
    setIdempotencyKey(createIdempotencyKey())
    settledIdRef.current = null
    queryClient.removeQueries({ queryKey: queryKeys.payments.transaction(kind, currentTransaction?.id) })
  }

  function closeDialog() {
    setRequestError('')
    onClose()
  }

  function openReceipt(receiptNumber) {
    const receiptWindow = window.open('', '_blank')
    if (!receiptWindow) {
      toast.info('Allow pop-ups to print your receipt.')
      return
    }
    printMutation.mutate({ receiptNumber, receiptWindow })
  }

  return (
    <ConfirmationDialog open={open} onClose={closeDialog} labelledBy="payment-checkout-title" backdropClassName="payment-dialog-backdrop" dialogClassName="payment-checkout-dialog">
      <header className="payment-dialog-head">
        <div><p className="eyebrow">Isomo checkout</p><h2 id="payment-checkout-title">{title}</h2></div>
        <button type="button" onClick={closeDialog} aria-label="Close payment dialog">Close</button>
      </header>

      {!currentTransaction ? <CheckoutSteps step={step} /> : null}

      <div className="payment-order-summary">
        <div><span>Total to simulate</span><strong>{formatMoney(amount, currency)}</strong></div>
        <dl>
          <div><dt>For</dt><dd>{displayedLearnerName}</dd></div>
          <div><dt>Purchase</dt><dd>{kind === 'course' ? 'Course access' : kind === 'schedule' ? 'Accepted lesson schedule' : 'Confirmed lesson'}</dd></div>
        </dl>
      </div>

      {currentTransaction ? (
        <section className={`payment-state payment-state-${currentTransaction.status.toLowerCase()}`} aria-live="polite">
          <span>{currentTransaction.status}</span>
          <h3>{statusTitle}</h3>
          <p>{statusDetail}</p>
          {kind === 'schedule' && currentTransaction.payments?.length ? <small>{currentTransaction.payments.length} lesson payments and receipts were recorded.</small> : null}
          {currentTransaction.failure_reason ? <small>{currentTransaction.failure_reason}</small> : null}
          {statusQuery.isFetching ? <small>Checking the payment status...</small> : null}
          <div className="payment-receipt-actions">
            {receiptNumbers.map((number, index) => (
              <button type="button" className="secondary-button" onClick={() => openReceipt(number)} disabled={printMutation.isPending} key={number}>
                {receiptNumbers.length > 1 ? `Receipt ${index + 1}` : 'Print receipt'}
              </button>
            ))}
          </div>
          <div className="payment-dialog-actions">
            {['FAILED', 'EXPIRED'].includes(currentTransaction.status) ? <button type="button" className="primary-button" onClick={resetAttempt}>Try again</button> : null}
            {currentTransaction.status === 'PENDING' ? <button type="button" className="secondary-button" onClick={() => statusQuery.refetch()} disabled={statusQuery.isFetching}>{statusQuery.isFetching ? 'Checking...' : 'Check status'}</button> : null}
            {FINAL_STATUSES.has(currentTransaction.status) ? <button type="button" className="primary-button" onClick={closeDialog}>Finish</button> : null}
          </div>
        </section>
      ) : step === 1 ? (
        <section className="payment-review-step">
          {learners.length ? (
            <label>
              <span>Choose the learner receiving access</span>
              <select value={selectedLearnerId} onChange={(event) => setSelectedLearnerId(event.target.value)} required>
                <option value="">Select linked student</option>
                {learners.map((learner) => <option value={learner.id} key={learner.id}>{learner.name}</option>)}
              </select>
            </label>
          ) : null}
          <ul>
            <li>No real money will be charged.</li>
            <li>Access is granted only after the simulation completes.</li>
            <li>A traceable transaction reference and receipt will be generated.</li>
          </ul>
          <div className="payment-dialog-actions"><button type="button" className="secondary-button" onClick={closeDialog}>Not now</button><button type="button" className="primary-button" onClick={() => setStep(2)} disabled={learners.length > 0 && !selectedLearnerId}>Choose payment method</button></div>
        </section>
      ) : step === 2 ? (
        <section className="payment-method-step">
          {providersQuery.isLoading ? <div className="payment-provider-skeleton" aria-busy="true"><span /><span /></div> : providersQuery.isError ? (
            <div className="payment-provider-error" role="alert"><strong>Payment service unavailable</strong><p>{paymentErrorMessage(providersQuery.error)}</p><button type="button" onClick={() => providersQuery.refetch()}>Retry connection</button></div>
          ) : !availableProviders.length ? (
            <div className="payment-provider-error"><p>No payment simulation is configured. Contact the Isomo administrator.</p></div>
          ) : (
            <>
              <div className="payment-provider-options">
                {availableProviders.map((item) => <button className={activeProvider === item.code ? 'is-selected' : ''} type="button" onClick={() => setProvider(item.code)} key={item.code}><strong>{item.name}</strong><span>{item.description}</span></button>)}
              </div>
              <fieldset className="payment-method-options">
                <legend>{activeProvider === 'SIMULATED' ? 'Simulation method' : 'Mobile money network'}</legend>
                {(selectedProvider?.networks || ['MTN', 'AIRTEL']).map((method) => (
                  <label className={network === method ? 'is-selected' : ''} key={method}>
                    <input type="radio" name="payment-method" value={method} checked={activeNetwork === method} onChange={() => setNetwork(method)} />
                    <span><strong>{METHOD_COPY[method]?.[0] || method}</strong><small>{METHOD_COPY[method]?.[1]}</small></span>
                  </label>
                ))}
              </fieldset>
              {activeProvider === 'FLUTTERWAVE' ? <label className="payment-phone-field"><span>Mobile money number</span><input type="tel" autoComplete="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="2507XXXXXXXX" /></label> : null}
            </>
          )}
          <div className="payment-dialog-actions"><button type="button" className="secondary-button" onClick={() => setStep(1)}>Back</button><button type="button" className="primary-button" onClick={() => setStep(3)} disabled={!activeProvider || (activeProvider === 'FLUTTERWAVE' && !phoneNumber.trim())}>Review payment</button></div>
        </section>
      ) : (
        <section className="payment-confirm-step">
          <div><span>Payment method</span><strong>{METHOD_COPY[activeNetwork]?.[0] || selectedProvider?.name}</strong></div>
          <div><span>Learner</span><strong>{displayedLearnerName}</strong></div>
          <div><span>Amount</span><strong>{formatMoney(amount, currency)}</strong></div>
          {requestError ? <div className="payment-request-error" role="alert"><strong>Payment was not completed</strong><p>{requestError}</p></div> : null}
          <label><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I confirm these details and understand this is a payment simulation.</span></label>
          <div className="payment-dialog-actions"><button type="button" className="secondary-button" onClick={() => setStep(2)} disabled={initiateMutation.isPending}>Back</button><button type="button" className="primary-button" onClick={() => initiateMutation.mutate()} disabled={!confirmed || initiateMutation.isPending}>{initiateMutation.isPending ? 'Processing simulation...' : 'Complete payment simulation'}</button></div>
        </section>
      )}
    </ConfirmationDialog>
  )
}
