import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'


export function listAdminCourses(params = {}) {
  return apiClient.get(API_ENDPOINTS.adminCourses.list, { params })
}

export function getAdminCourse(id) {
  return apiClient.get(API_ENDPOINTS.adminCourses.detail(id))
}

export function moderateAdminCourse(id, payload) {
  return apiClient.patch(API_ENDPOINTS.adminCourses.moderate(id), payload)
}
