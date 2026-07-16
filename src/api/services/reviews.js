import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizeListResponse } from '../response'

export function listEligibleReviews() {
  return apiClient.get(API_ENDPOINTS.reviews.eligible).then((response) => response.data)
}
export function listBookingReviews() {
  return apiClient.get(API_ENDPOINTS.reviews.bookingList).then(normalizeListResponse)
}

export function createBookingReview(payload) {
  return apiClient.post(API_ENDPOINTS.reviews.bookingCreate, payload)
}

export function listLessonReviews() {
  return apiClient.get(API_ENDPOINTS.reviews.lessonList).then(normalizeListResponse)
}

export function createLessonReview(payload) {
  return apiClient.post(API_ENDPOINTS.reviews.lessonCreate, payload)
}

export function createReviewReport(payload) {
  return apiClient.post(API_ENDPOINTS.reviews.reportCreate, payload)
}

export function listAdminReviewReports(params = {}) {
  return apiClient.get(API_ENDPOINTS.reviews.adminReports, { params })
}

export function getAdminReviewReport(id) {
  return apiClient.get(API_ENDPOINTS.reviews.adminReportDetail(id))
}

export function decideAdminReviewReport(id, payload) {
  return apiClient.patch(API_ENDPOINTS.reviews.adminReportDecision(id), payload)
}
