import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizePaginatedResponse } from '../response'


export function listAdminUsers(params = {}) {
  return apiClient.get(API_ENDPOINTS.adminUsers.list, { params }).then(normalizePaginatedResponse)
}

export function getAdminUser(id) {
  return apiClient.get(API_ENDPOINTS.adminUsers.detail(id))
}

export function changeAdminUserStatus(id, payload) {
  return apiClient.patch(API_ENDPOINTS.adminUsers.status(id), payload)
}
