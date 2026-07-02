import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export function listPayments() {
  return apiClient.get(API_ENDPOINTS.payments.list)
}

export function listCoursePurchases() {
  return apiClient.get(API_ENDPOINTS.payments.coursePurchases)
}

export function listLessonProgress() {
  return apiClient.get(API_ENDPOINTS.payments.lessonProgress)
}

export function listPayouts() {
  return apiClient.get(API_ENDPOINTS.payments.payouts)
}

export function requestPayout(data) {
  return apiClient.post(API_ENDPOINTS.payments.payoutRequest, data)
}

export function getTutorEarnings() {
  return apiClient.get(API_ENDPOINTS.payments.earnings)
}
