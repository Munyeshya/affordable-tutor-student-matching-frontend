import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { AUTH_SESSION_EXPIRED_EVENT, clearAuthSession, getStoredRefreshToken, hasStoredAccessToken, setAuthSession } from '../api/client'
import { getApiErrorMessage } from '../api/errors'
import { getCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/services/auth'

const AuthContext = createContext(null)


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function handleSessionExpired() {
      setUser(null)
      setLoading(false)
      setError('')
      toast.info('Your session expired. Please sign in again.')
    }

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired)
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function hydrateUser() {
      if (!hasStoredAccessToken()) {
        if (!ignore) {
          setLoading(false)
        }
        return
      }

      try {
        const response = await getCurrentUser()
        if (!ignore) {
          setUser(response.data)
        }
      } catch {
        clearAuthSession()
        if (!ignore) {
          setUser(null)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    hydrateUser()

    return () => {
      ignore = true
    }
  }, [])

  async function refreshUser() {
    if (!hasStoredAccessToken()) {
      setUser(null)
      return null
    }

    try {
      const response = await getCurrentUser()
      setUser(response.data)
      return response.data
    } catch {
      clearAuthSession()
      setUser(null)
      toast.info('You have been signed out.')
      return null
    }
  }

  async function signIn(credentials) {
    setSubmitting(true)
    setError('')

    try {
      const response = await loginRequest(credentials)
      const { access, refresh, user: nextUser } = response.data
      setAuthSession({ accessToken: access, refreshToken: refresh })
      setUser(nextUser)
      toast.success(`Welcome back, ${nextUser?.full_name || nextUser?.email || 'user'}.`)
      return nextUser
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      toast.error(message)
      throw new Error(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function signUp(payload) {
    setSubmitting(true)
    setError('')

    try {
      const response = await registerRequest(payload)
      toast.success('Account created successfully. You can sign in now.')
      return response.data
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      toast.error(message)
      throw new Error(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function signOut() {
    const refreshToken = getStoredRefreshToken()

    try {
      if (refreshToken) {
        await logoutRequest({ refresh: refreshToken })
      }
    } catch {
      // Clear local session even if logout is already expired on the server.
    } finally {
      clearAuthSession()
      setUser(null)
      toast.info('You have been signed out.')
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      submitting,
      error,
      signIn,
      signUp,
      signOut,
      refreshUser,
      setError,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, submitting, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The hook intentionally shares this module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

