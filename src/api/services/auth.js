import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export function login(credentials) {
  return apiClient.post(API_ENDPOINTS.auth.login, credentials)
}

export function register(data) {
  return apiClient.post(API_ENDPOINTS.auth.register, data)
}

export function logout() {
  return apiClient.post(API_ENDPOINTS.auth.logout, {})
}

export function getCurrentUser() {
  return apiClient.get(API_ENDPOINTS.auth.me)
}

export function updateCurrentUser(data) {
  return apiClient.patch(API_ENDPOINTS.auth.me, data)
}

export function uploadProfileImage(file) {
  const formData = new FormData()
  formData.append('profile_image', file)
  return apiClient.patch(API_ENDPOINTS.auth.profileImage, formData)
}

export function removeProfileImage() {
  return apiClient.delete(API_ENDPOINTS.auth.profileImage)
}

export function verifyEmail(data) {
  return apiClient.post(API_ENDPOINTS.auth.verifyEmail, data)
}

export function resendVerification(email) {
  return apiClient.post(API_ENDPOINTS.auth.resendVerification, { email })
}

export function requestPasswordReset(email) {
  return apiClient.post(API_ENDPOINTS.auth.passwordReset, { email })
}

export function confirmPasswordReset(data) {
  return apiClient.post(API_ENDPOINTS.auth.passwordResetConfirm, data)
}
