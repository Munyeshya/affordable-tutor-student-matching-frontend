import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizeListResponse } from '../response'

export function listAssessments() {
  return apiClient.get(API_ENDPOINTS.assessments.list).then(normalizeListResponse)
}

export function createAssessment(payload) {
  return apiClient.post(API_ENDPOINTS.assessments.create, payload)
}

export function createAssessmentQuestion(payload) {
  return apiClient.post(API_ENDPOINTS.assessments.questionCreate, payload)
}

export function listAssessmentAttempts() {
  return apiClient.get(API_ENDPOINTS.assessments.attempts).then(normalizeListResponse)
}

export function submitAssessmentAttempt(payload) {
  return apiClient.post(API_ENDPOINTS.assessments.attemptCreate, payload)
}

export function listAssessmentConfirmations() {
  return apiClient.get(API_ENDPOINTS.assessments.confirmations).then(normalizeListResponse)
}

export function submitAssessmentConfirmation(payload) {
  return apiClient.post(API_ENDPOINTS.assessments.confirmationCreate, payload)
}

export function getLearningImpact() {
  return apiClient.get(API_ENDPOINTS.assessments.impact)
}
