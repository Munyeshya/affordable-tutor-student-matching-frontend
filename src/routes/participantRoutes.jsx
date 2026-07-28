import React from 'react'

import { lazyNamed } from './lazyNamed.jsx'

const BookingsPage = lazyNamed(() => import('../pages/BookingsPage.jsx'), 'BookingsPage')
const MessagesPage = lazyNamed(() => import('../pages/MessagesPage.jsx'), 'MessagesPage')
const ScheduleProposalsPage = lazyNamed(() => import('../pages/ScheduleProposalsPage.jsx'), 'ScheduleProposalsPage')

export const participantRoutes = [
  { path: '/bookings', element: <BookingsPage /> },
  { path: '/bookings/:bookingId', element: <BookingsPage /> },
  { path: '/schedule-proposals', element: <ScheduleProposalsPage /> },
  { path: '/messages', element: <MessagesPage /> },
]
