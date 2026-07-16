import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizeListResponse, normalizePaginatedResponse } from '../response'

export function listSubjects() {
  return apiClient.get(API_ENDPOINTS.catalog.subjects).then(normalizeListResponse)
}

export function listTutorSubjects() {
  return apiClient.get(API_ENDPOINTS.catalog.tutorSubjects).then(normalizeListResponse)
}

export function createTutorSubject(payload) {
  return apiClient.post(API_ENDPOINTS.catalog.tutorSubjects, payload)
}

export function deleteTutorSubject(id) {
  return apiClient.delete(API_ENDPOINTS.catalog.tutorSubjectDetail(id))
}

export function listMyCourses() {
  return apiClient.get(API_ENDPOINTS.catalog.myCourses).then(normalizeListResponse)
}

export function createCourse(payload) {
  return apiClient.post(API_ENDPOINTS.catalog.courseCreate, payload)
}

export function submitCourseForReview(id) {
  return apiClient.patch(API_ENDPOINTS.catalog.courseSubmit(id))
}

export function createLesson(courseId, payload) {
  return apiClient.post(API_ENDPOINTS.catalog.lessons(courseId), payload)
}

export function listLessons(courseId) {
  return apiClient.get(API_ENDPOINTS.catalog.lessons(courseId)).then(normalizeListResponse)
}

export function listPublicCourses(params = {}) {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null),
  )

  return apiClient.get(API_ENDPOINTS.catalog.courses, { params: queryParams }).then(normalizePaginatedResponse)
}

export function getPublicCourse(id) {
  return apiClient.get(API_ENDPOINTS.catalog.publicCourseDetail(id))
}
