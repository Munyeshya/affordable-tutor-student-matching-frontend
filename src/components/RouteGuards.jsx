import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../context/AuthContext.jsx'

export function RouteLoader() {
  return (
    <section className="page-card card access-route-loader" aria-busy="true" aria-live="polite">
      <p className="eyebrow">Isomo</p>
      <h1>Loading your account...</h1>
      <div className="skeleton skeleton-line skeleton-title" />
      <div className="skeleton skeleton-line" />
    </section>
  )
}

export function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <RouteLoader />

  if (!isAuthenticated || !user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export function RequireAuth() {
  return <ProtectedRoute />
}

export function RequireRole({ roles }) {
  return <ProtectedRoute allowedRoles={roles} />
}