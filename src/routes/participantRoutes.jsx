import React from 'react'

import { BookingsPage } from '../pages/BookingsPage.jsx'
import { MessagesPage } from '../pages/MessagesPage.jsx'
import { ScheduleProposalsPage } from '../pages/ScheduleProposalsPage.jsx'

export const participantRoutes = [
  { path: '/bookings', element: <BookingsPage /> },
  { path: '/bookings/:bookingId', element: <BookingsPage /> },
  { path: '/schedule-proposals', element: <ScheduleProposalsPage /> },
  { path: '/messages', element: <MessagesPage /> },
]
