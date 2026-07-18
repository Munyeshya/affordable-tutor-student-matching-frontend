import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizeListResponse } from '../response'

export function getParentDashboard() {
  return apiClient.get(API_ENDPOINTS.parents.dashboard)
}

export function getParentProfile() {
  return apiClient.get(API_ENDPOINTS.parents.profile)
}

export function updateParentProfile(data) {
  return apiClient.patch(API_ENDPOINTS.parents.profile, data)
}

export function listParentLinks() {
  return apiClient.get(API_ENDPOINTS.parents.links).then(normalizeListResponse)
}

export function getParentStudent(id) {
  return apiClient.get(API_ENDPOINTS.parents.studentDetail(id))
}
