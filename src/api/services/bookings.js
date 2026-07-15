import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizeListResponse } from '../response'

export function createBooking(payload) {
  return apiClient.post(API_ENDPOINTS.bookings.create, payload)
}

export function listBookings() {
  return apiClient.get(API_ENDPOINTS.bookings.list).then(normalizeListResponse)
}

export function updateBookingAction(id, payload) {
  return apiClient.patch(API_ENDPOINTS.bookings.action(id), payload)
}

export function listDisputes() {
  return apiClient.get(API_ENDPOINTS.bookings.disputes).then(normalizeListResponse)
}

export function decideDispute(id, payload) {
  return apiClient.patch(API_ENDPOINTS.bookings.disputeDecision(id), payload)
}
