import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired'
const AUTH_SESSION_KEY_STORAGE = 'isomo.auth.session-key'

function readSessionKey() {
  try {
    return window.sessionStorage.getItem(AUTH_SESSION_KEY_STORAGE) || null
  } catch {
    return null
  }
}

let refreshPromise = null
let sessionExpiryNotified = false
let accessToken = null
let sessionKey = readSessionKey()

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
  if (sessionKey) {
    config.headers['X-Isomo-Session-Key'] = sessionKey
  }

  return config
})

async function requestNewAccessToken() {
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh/`,
    {},
    {
      timeout: 15_000,
      withCredentials: true,
      headers: sessionKey ? { 'X-Isomo-Session-Key': sessionKey } : {},
    },
  )
  setAuthSession({ accessToken: response.data.access })
  return response.data.access
}

function getOrCreateRefreshPromise() {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
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
      const accessToken = await getOrCreateRefreshPromise()
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      notifySessionExpired()
      return Promise.reject(refreshError)
    }
  },
)

export function setAuthSession({ accessToken: nextAccessToken, sessionKey: nextSessionKey }) {
  sessionExpiryNotified = false
  accessToken = nextAccessToken || null
  if (nextSessionKey) {
    sessionKey = nextSessionKey
    try {
      window.sessionStorage.setItem(AUTH_SESSION_KEY_STORAGE, nextSessionKey)
    } catch {
      // The in-memory access token still supports the current page session.
    }
  }
}

export function clearAuthSession() {
  accessToken = null
  sessionKey = null
  try {
    window.sessionStorage.removeItem(AUTH_SESSION_KEY_STORAGE)
  } catch {
    // Storage may be unavailable in hardened browser modes.
  }
}

export function getStoredAccessToken() {
  return accessToken
}

export function hasStoredAccessToken() {
  return Boolean(accessToken)
}

export function getStoredSessionKey() {
  return sessionKey
}

export function bootstrapAuthSession() {
  return getOrCreateRefreshPromise()
}

export function getApiBaseUrl() {
  return API_BASE_URL
}
