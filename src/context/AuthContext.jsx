import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearAuthSession, getStoredRefreshToken, hasStoredAccessToken, setAuthSession } from '../api/client'
import { getCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/services/auth'

const AuthContext = createContext(null)

function extractErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.non_field_errors?.[0] ||
    'Something went wrong. Please try again.'
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
      return nextUser
    } catch (requestError) {
      const message = extractErrorMessage(requestError)
      setError(message)
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
      return response.data
    } catch (requestError) {
      const message = extractErrorMessage(requestError)
      setError(message)
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

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

