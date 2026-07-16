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
  listPaymentProviders,
} from '../../api/services/payments'
import { ConfirmationDialog } from '../ui/ConfirmationDialog.jsx'
import './PaymentCheckoutDialog.css'

const FINAL_STATUSES = new Set(['PAID', 'FAILED', 'EXPIRED', 'REFUNDED'])
const EMPTY_PROVIDERS = []

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatMoney(value, currency = 'RWF') {
  return `${new Intl.NumberFormat('en-RW').format(Number(value || 0))} ${currency}`
}

function statusCopy(status) {
  const copy = {
    PENDING: ['Waiting for approval', 'Approve the payment prompt on your phone. We will confirm it securely with the provider.'],
    PAID: ['Payment confirmed', 'Your payment was verified by the provider and your access is ready.'],
    FAILED: ['Payment failed', 'The provider did not complete this payment. You can safely try again.'],
    EXPIRED: ['Payment expired', 'The approval window closed before payment completed. Start a new request to continue.'],
    REFUNDED: ['Payment refunded', 'The payment has been returned through the provider.'],
  }
  return copy[status] || ['Payment update', 'Check the latest status before continuing.']
}

export function PaymentCheckoutDialog({
  open,
  kind,
  itemId,
  title,
  amount,
  currency = 'RWF',
  initialPhone = '',
  onClose,
  onSettled,
}) {
  const queryClient = useQueryClient()
  const [provider, setProvider] = useState('')
  const [network, setNetwork] = useState('MTN')
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '')
  const [transaction, setTransaction] = useState(null)
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey)
  const settledIdRef = useRef(null)

  const providersQuery = useQuery({
    queryKey: queryKeys.payments.providers,
    queryFn: () => listPaymentProviders().then((response) => response.data),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })
  const availableProviders = providersQuery.data?.providers || EMPTY_PROVIDERS
  const activeProvider = provider || providersQuery.data?.default || availableProviders[0]?.code || ''

  const statusQuery = useQuery({
    queryKey: queryKeys.payments.transaction(kind, transaction?.id),
    queryFn: () => getPaymentTransaction(kind, transaction.id).then((response) => response.data),
    enabled: Boolean(open && transaction?.id && transaction.status === 'PENDING'),
    refetchInterval: (query) => (
      query.state.data?.status === 'PENDING' ? 4000 : false
    ),
  })

  const currentTransaction = statusQuery.data || transaction

  useEffect(() => {
    if (currentTransaction?.status !== 'PAID' || settledIdRef.current === currentTransaction.id) return
    settledIdRef.current = currentTransaction.id
    toast.success('Payment confirmed securely.')
    onSettled?.(currentTransaction)
  }, [currentTransaction, onSettled])

  const initiateMutation = useMutation({
    mutationFn: () => {
      const payload = {
        provider: activeProvider,
        phone_number: activeProvider === 'FLUTTERWAVE' ? phoneNumber.trim() : '',
        network: activeProvider === 'SIMULATED' ? 'SIMULATED' : network,
      }
      if (kind === 'booking') {
        return initiateBookingPayment({ ...payload, booking_id: itemId }, idempotencyKey)
      }
      return createCoursePurchase({ ...payload, course_id: itemId }, idempotencyKey)
    },
    onSuccess: (response) => {
      setTransaction(response.data)
      if (response.data.status === 'PENDING') {
        toast.info('Payment request sent. Approve it on your phone.')
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not start this payment.')),
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

  const selectedProvider = availableProviders.find((item) => item.code === activeProvider)
  const [statusTitle, statusDetail] = statusCopy(currentTransaction?.status)
  const isFinal = FINAL_STATUSES.has(currentTransaction?.status)

  function resetAttempt() {
    setTransaction(null)
    setIdempotencyKey(createIdempotencyKey())
    settledIdRef.current = null
    queryClient.removeQueries({ queryKey: queryKeys.payments.transaction(kind, currentTransaction?.id) })
  }

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      labelledBy="payment-checkout-title"
      backdropClassName="payment-dialog-backdrop"
      dialogClassName="payment-checkout-dialog"
    >
      <header className="payment-dialog-head">
        <div>
          <p className="eyebrow">Secure checkout</p>
          <h2 id="payment-checkout-title">{title}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close payment dialog">Close</button>
      </header>

      <div className="payment-order-summary">
        <span>Total</span>
        <strong>{formatMoney(amount, currency)}</strong>
      </div>

      {currentTransaction ? (
        <section className={`payment-state payment-state-${currentTransaction.status.toLowerCase()}`} aria-live="polite">
          <span>{currentTransaction.status}</span>
          <h3>{statusTitle}</h3>
          <p>{statusDetail}</p>
          {currentTransaction.failure_reason ? <small>{currentTransaction.failure_reason}</small> : null}
          {currentTransaction.checkout_url && currentTransaction.status === 'PENDING' ? (
            <a href={currentTransaction.checkout_url} target="_blank" rel="noreferrer">Continue provider approval</a>
          ) : null}
          {statusQuery.isFetching ? <small>Checking with the payment provider...</small> : null}
          <div className="payment-dialog-actions">
            {['FAILED', 'EXPIRED'].includes(currentTransaction.status) ? (
              <button type="button" className="primary-button" onClick={resetAttempt}>Try again</button>
            ) : null}
            {currentTransaction.status === 'PENDING' ? (
              <button type="button" className="secondary-button" onClick={() => statusQuery.refetch()} disabled={statusQuery.isFetching}>
                {statusQuery.isFetching ? 'Checking...' : 'Check status'}
              </button>
            ) : null}
            {currentTransaction.status === 'PAID' && currentTransaction.receipt_number ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  const receiptWindow = window.open('', '_blank')
                  if (!receiptWindow) {
                    toast.info('Allow pop-ups to print your receipt.')
                    return
                  }
                  printMutation.mutate({
                    receiptNumber: currentTransaction.receipt_number,
                    receiptWindow,
                  })
                }}
                disabled={printMutation.isPending}
              >
                {printMutation.isPending ? 'Opening...' : 'Print receipt'}
              </button>
            ) : null}
            {isFinal ? <button type="button" className="primary-button" onClick={onClose}>Close</button> : null}
          </div>
        </section>
      ) : (
        <>
          {providersQuery.isLoading ? (
            <div className="payment-provider-skeleton" aria-busy="true"><span /><span /></div>
          ) : providersQuery.isError ? (
            <div className="payment-provider-error">
              <p>{getApiErrorMessage(providersQuery.error, 'Could not load payment methods.')}</p>
              <button type="button" onClick={() => providersQuery.refetch()}>Try again</button>
            </div>
          ) : availableProviders.length ? (
            <div className="payment-fields">
              <label>
                <span>Payment method</span>
                <select value={activeProvider} onChange={(event) => setProvider(event.target.value)}>
                  {availableProviders.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}
                </select>
                <small>{selectedProvider?.description}</small>
              </label>
              {activeProvider === 'FLUTTERWAVE' ? (
                <>
                  <label>
                    <span>Mobile money network</span>
                    <select value={network} onChange={(event) => setNetwork(event.target.value)}>
                      {(selectedProvider?.networks || ['MTN', 'AIRTEL']).map((item) => <option value={item} key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Mobile money number</span>
                    <input
                      type="tel"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="e.g. 2507XXXXXXXX"
                    />
                  </label>
                </>
              ) : (
                <p className="payment-development-note">Development mode: this confirms immediately without charging money.</p>
              )}
            </div>
          ) : (
            <p className="payment-provider-error">No payment provider is configured. Contact the Isomo administrator.</p>
          )}

          <div className="payment-dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={initiateMutation.isPending}>Not now</button>
            <button
              type="button"
              className="primary-button"
              onClick={() => initiateMutation.mutate()}
              disabled={
                initiateMutation.isPending ||
                !activeProvider ||
                (activeProvider === 'FLUTTERWAVE' && !phoneNumber.trim())
              }
            >
              {initiateMutation.isPending ? 'Starting payment...' : 'Continue to payment'}
            </button>
          </div>
        </>
      )}
    </ConfirmationDialog>
  )
}
