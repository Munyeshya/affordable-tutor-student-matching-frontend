import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export function listBookingReviews() {
  return apiClient.get(API_ENDPOINTS.reviews.bookingList)
}

export function createBookingReview(payload) {
  return apiClient.post(API_ENDPOINTS.reviews.bookingCreate, payload)
}

export function listLessonReviews() {
  return apiClient.get(API_ENDPOINTS.reviews.lessonList)
}

export function createLessonReview(payload) {
  return apiClient.post(API_ENDPOINTS.reviews.lessonCreate, payload)
}
