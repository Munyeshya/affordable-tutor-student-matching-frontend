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

export function updateBookingProgress(id, payload) {
  return apiClient.patch(API_ENDPOINTS.bookings.progress(id), payload)
}

export function updateOnlineLessonSession(id, payload) {
  return apiClient.patch(API_ENDPOINTS.bookings.onlineSession(id), payload)
}

export function createScheduleProposal(payload) {
  return apiClient.post(API_ENDPOINTS.bookings.proposalCreate, payload)
}

export function listScheduleProposals() {
  return apiClient.get(API_ENDPOINTS.bookings.proposals).then(normalizeListResponse)
}

export function updateScheduleProposal(id, payload) {
  return apiClient.patch(API_ENDPOINTS.bookings.proposalAction(id), payload)
}

export function listDisputes() {
  return apiClient.get(API_ENDPOINTS.bookings.disputes).then(normalizeListResponse)
}

export function createDispute(payload) {
  return apiClient.post(API_ENDPOINTS.bookings.disputeCreate, payload)
}

export function getDispute(id) {
  return apiClient.get(API_ENDPOINTS.bookings.disputeDetail(id))
}

export function decideDispute(id, payload) {
  return apiClient.patch(API_ENDPOINTS.bookings.disputeDecision(id), payload)
}
