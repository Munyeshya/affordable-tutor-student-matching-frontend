import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizeListResponse } from '../response'

export function listPayments() {
  return apiClient.get(API_ENDPOINTS.payments.list).then(normalizeListResponse)
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

export function createCoursePurchase(data) {
  return apiClient.post(API_ENDPOINTS.payments.coursePurchaseCreate, data)
}

export function updateLessonProgress(data) {
  return apiClient.post(API_ENDPOINTS.payments.lessonProgressUpdate, data)
}
