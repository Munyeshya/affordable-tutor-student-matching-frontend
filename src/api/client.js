import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
const AUTH_ACCESS_TOKEN_KEY = 'affordable_auth_access_token'
const AUTH_REFRESH_TOKEN_KEY = 'affordable_auth_refresh_token'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export function setAuthSession({ accessToken, refreshToken }) {
  if (accessToken) {
    localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, accessToken)
  } else {
    localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY)
  }

  if (refreshToken) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken)
  } else {
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY)
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
}

export function getStoredRefreshToken() {
  return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)
}

export function hasStoredAccessToken() {
  return Boolean(localStorage.getItem(AUTH_ACCESS_TOKEN_KEY))
}

export function getApiBaseUrl() {
  return API_BASE_URL
}
