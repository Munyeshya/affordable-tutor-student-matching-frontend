import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export function createBooking(payload) {
  return apiClient.post(API_ENDPOINTS.bookings.create, payload)
}

export function listBookings() {
  return apiClient.get(API_ENDPOINTS.bookings.list)
}
