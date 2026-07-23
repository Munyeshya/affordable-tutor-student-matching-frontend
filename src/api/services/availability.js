import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizeListResponse } from '../response'

export function listMyAvailability() {
  return apiClient.get(API_ENDPOINTS.availability.mine).then(normalizeListResponse)
}

export function createAvailability(payload) {
  return apiClient.post(API_ENDPOINTS.availability.mine, payload)
}

export function deleteAvailability(id) {
  return apiClient.delete(API_ENDPOINTS.availability.detail(id))
}
