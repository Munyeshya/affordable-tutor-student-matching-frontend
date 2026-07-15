import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
const AUTH_ACCESS_TOKEN_KEY = 'affordable_auth_access_token'
const AUTH_REFRESH_TOKEN_KEY = 'affordable_auth_refresh_token'
export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired'

let refreshPromise = null
let sessionExpiryNotified = false

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

async function requestNewAccessToken() {
  const refresh = getStoredRefreshToken()
  if (!refresh) {
    throw new Error('No refresh token is available.')
  }

  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh/`,
    { refresh },
    { timeout: 15_000 },
  )
  const accessToken = response.data.access
  setAuthSession({
    accessToken,
    refreshToken: response.data.refresh || refresh,
  })
  return accessToken
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

export function setAuthSession({ accessToken, refreshToken }) {
  sessionExpiryNotified = false

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