import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizeListResponse } from '../response'

export function listPayments() {
  return apiClient.get(API_ENDPOINTS.payments.list).then(normalizeListResponse)
}

export function listPaymentProviders() {
  return apiClient.get(API_ENDPOINTS.payments.providers)
}

export function initiateBookingPayment(data, idempotencyKey) {
  return apiClient.post(API_ENDPOINTS.payments.bookingPay, data, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}

export function initiateSchedulePayment(data, idempotencyKey) {
  return apiClient.post(API_ENDPOINTS.payments.schedulePay, data, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}

export function listCoursePurchases() {
  return apiClient.get(API_ENDPOINTS.payments.coursePurchases).then(normalizeListResponse)
}

export function listLearningLibrary() {
  return apiClient.get(API_ENDPOINTS.payments.learningLibrary).then(normalizeListResponse)
}
export function listLessonProgress() {
  return apiClient.get(API_ENDPOINTS.payments.lessonProgress).then(normalizeListResponse)
}

export function listPayouts() {
  return apiClient.get(API_ENDPOINTS.payments.payouts).then(normalizeListResponse)
}

export function requestPayout(data) {
  return apiClient.post(API_ENDPOINTS.payments.payoutRequest, data)
}

export function getTutorEarnings() {
  return apiClient.get(API_ENDPOINTS.payments.earnings)
}

export function createCoursePurchase(data, idempotencyKey) {
  return apiClient.post(API_ENDPOINTS.payments.coursePurchaseCreate, data, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}

export function getPaymentTransaction(kind, id) {
  return apiClient.get(API_ENDPOINTS.payments.transactionStatus(kind, id))
}

export function getPaymentReceipt(number) {
  return apiClient.get(API_ENDPOINTS.payments.receipt(number))
}

export function getPrintablePaymentReceipt(number) {
  return apiClient.get(API_ENDPOINTS.payments.receiptPrint(number), { responseType: 'text' })
}

export function updateLessonProgress(data) {
  return apiClient.post(API_ENDPOINTS.payments.lessonProgressUpdate, data)
}
