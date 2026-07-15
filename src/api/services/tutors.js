import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizeListResponse, normalizePaginatedResponse } from '../response'

export function listTutors(params = {}) {
  return apiClient.get(API_ENDPOINTS.tutors.list, { params }).then(normalizePaginatedResponse)
}

export function getTutor(id) {
  return apiClient.get(API_ENDPOINTS.tutors.detail(id))
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
  return apiClient.get(API_ENDPOINTS.tutors.documents).then(normalizeListResponse)
}

export function uploadTutorDocument(payload) {
  return apiClient.post(API_ENDPOINTS.tutors.documents, payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function reviewTutorDocument(id, payload) {
  return apiClient.patch(API_ENDPOINTS.tutors.documentReview(id), payload)
}

export function getTutorAgreementDetails() {
  return apiClient.get(API_ENDPOINTS.tutors.agreement)
}

export function uploadTutorAgreement(payload) {
  return apiClient.post(API_ENDPOINTS.tutors.agreement, payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function listTutorVerifications(params = {}) {
  return apiClient.get(API_ENDPOINTS.tutors.verifications, { params }).then(normalizeListResponse)
}

export function decideTutorVerification(id, payload) {
  return apiClient.patch(API_ENDPOINTS.tutors.verificationDecision(id), payload)
}
