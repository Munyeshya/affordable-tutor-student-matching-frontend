import React from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'

import { RouteLoader } from '../components/RouteGuards.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { BookingRequestPage } from '../pages/BookingRequestPage.jsx'

export function BookingRequestRoute() {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const profileId = searchParams.get('profile')
  const hasPublishedSlot = searchParams.has('slot')

  if (loading) return <RouteLoader />
  if (!profileId || !hasPublishedSlot) {
    return <Navigate to={profileId ? `/tutors/${profileId}#availability` : '/tutors'} replace />
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }
  if (!['STUDENT', 'PARENT'].includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <BookingRequestPage />
}
