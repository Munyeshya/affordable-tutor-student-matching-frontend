import React from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { BookingRequestPage } from '../pages/BookingRequestPage.jsx'

export function BookingRequestRoute() {
  const [searchParams] = useSearchParams()
  const hasTutorSelection = searchParams.has('tutor') || searchParams.has('profile')
  return hasTutorSelection ? <BookingRequestPage /> : <Navigate to="/tutors" replace />
}
