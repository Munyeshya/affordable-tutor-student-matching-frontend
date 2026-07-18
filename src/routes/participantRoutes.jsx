import React from 'react'

import { BookingsPage } from '../pages/BookingsPage.jsx'
import { MessagesPage } from '../pages/MessagesPage.jsx'
import { ScheduleProposalsPage } from '../pages/ScheduleProposalsPage.jsx'
import { BookingRequestRoute } from './BookingRequestRoute.jsx'

export const participantRoutes = [
  { path: '/book', element: <BookingRequestRoute /> },
  { path: '/bookings', element: <BookingsPage /> },
  { path: '/schedule-proposals', element: <ScheduleProposalsPage /> },
  { path: '/messages', element: <MessagesPage /> },
]
