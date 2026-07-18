import React from 'react'

import { BookingRequestPage } from '../pages/BookingRequestPage.jsx'
import { BookingsPage } from '../pages/BookingsPage.jsx'
import { MessagesPage } from '../pages/MessagesPage.jsx'
import { ScheduleProposalsPage } from '../pages/ScheduleProposalsPage.jsx'

export const participantRoutes = [
  { path: '/book', element: <BookingRequestPage /> },
  { path: '/bookings', element: <BookingsPage /> },
  { path: '/schedule-proposals', element: <ScheduleProposalsPage /> },
  { path: '/messages', element: <MessagesPage /> },
]
