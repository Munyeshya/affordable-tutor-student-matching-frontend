import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export function listTutors(params = {}) {
  return apiClient.get(API_ENDPOINTS.tutors.list, { params })
}

export function getTutor(id) {
  return apiClient.get(API_ENDPOINTS.tutors.detail(id))
}

export function searchTutors(query) {
  return apiClient.get(API_ENDPOINTS.tutors.search, {
    params: { q: query },
  })
}

export function getTutorDocuments() {
  return apiClient.get(API_ENDPOINTS.tutors.documents)
}

export function getTutorLessons() {
  return apiClient.get(API_ENDPOINTS.tutors.lessons)
}

export function rateTutorLesson(payload) {
  return apiClient.post(API_ENDPOINTS.tutors.ratings, payload)
}
