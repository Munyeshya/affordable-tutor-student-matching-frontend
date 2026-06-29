import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export function login(credentials) {
  return apiClient.post(API_ENDPOINTS.auth.login, credentials)
}

export function register(data) {
  return apiClient.post(API_ENDPOINTS.auth.register, data)
}

export function logout() {
  return apiClient.post(API_ENDPOINTS.auth.logout)
}

export function getCurrentUser() {
  return apiClient.get(API_ENDPOINTS.auth.me)
}

export function refreshToken(refresh) {
  return apiClient.post(API_ENDPOINTS.auth.refresh, { refresh })
}
