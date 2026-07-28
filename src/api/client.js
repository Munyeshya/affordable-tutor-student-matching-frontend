import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired'

let refreshPromise = null
let sessionExpiryNotified = false
let accessToken = null

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete?.('Content-Type')
    delete config.headers['Content-Type']
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

async function requestNewAccessToken() {
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh/`,
    {},
    { timeout: 15_000, withCredentials: true },
  )
  setAuthSession({ accessToken: response.data.access })
  return response.data.access
}

function notifySessionExpired() {
  clearAuthSession()

  if (!sessionExpiryNotified) {
    sessionExpiryNotified = true
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const requestUrl = originalRequest?.url || ''
    const isPublicAuthRequest = [
      '/auth/login/',
      '/auth/register/',
      '/auth/refresh/',
      '/auth/email/',
      '/auth/password/',
    ].some((path) => requestUrl.includes(path))

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      isPublicAuthRequest
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = requestNewAccessToken().finally(() => {
          refreshPromise = null
        })
      }

      const accessToken = await refreshPromise
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      notifySessionExpired()
      return Promise.reject(refreshError)
    }
  },
)

export function setAuthSession({ accessToken: nextAccessToken }) {
  sessionExpiryNotified = false
  accessToken = nextAccessToken || null
}

export function clearAuthSession() {
  accessToken = null
}

export function getStoredAccessToken() {
  return accessToken
}

export function hasStoredAccessToken() {
  return Boolean(accessToken)
}

export function bootstrapAuthSession() {
  return requestNewAccessToken()
}

export function getApiBaseUrl() {
  return API_BASE_URL
}
