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

export function getTutorDashboard() {
  return apiClient.get(API_ENDPOINTS.tutors.dashboard)
}

export function getTutorChecklist() {
  return apiClient.get(API_ENDPOINTS.tutors.checklist)
}

export function getTutorCompletion() {
  return apiClient.get(API_ENDPOINTS.tutors.completion)
}

export function getTutorAgreement() {
  return apiClient.get(API_ENDPOINTS.tutors.agreement)
}

export function downloadTutorAgreement() {
  return apiClient.get(API_ENDPOINTS.tutors.agreementDownload, {
    responseType: 'blob',
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

