import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export function listSubjects() {
  return apiClient.get(API_ENDPOINTS.catalog.subjects)
}

export function listTutorSubjects() {
  return apiClient.get(API_ENDPOINTS.catalog.tutorSubjects)
}

export function createTutorSubject(payload) {
  return apiClient.post(API_ENDPOINTS.catalog.tutorSubjects, payload)
}

export function deleteTutorSubject(id) {
  return apiClient.delete(API_ENDPOINTS.catalog.tutorSubjectDetail(id))
}

export function listMyCourses() {
  return apiClient.get(API_ENDPOINTS.catalog.myCourses)
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
  return apiClient.get(API_ENDPOINTS.catalog.lessons(courseId))
}
