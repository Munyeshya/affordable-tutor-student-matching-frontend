import React from 'react'

import { ReportsPage } from '../pages/ReportsPage.jsx'
import { AccountPage } from '../pages/AccountPage.jsx'
import { AssessmentsPage } from '../pages/AssessmentsPage.jsx'
import { BookingRequestPage } from '../pages/BookingRequestPage.jsx'
import { BookingsPage } from '../pages/BookingsPage.jsx'
import { MessagesPage } from '../pages/MessagesPage.jsx'
import { NotificationsPage } from '../pages/NotificationsPage.jsx'
import { ReviewsPage } from '../pages/ReviewsPage.jsx'
import { ScheduleProposalsPage } from '../pages/ScheduleProposalsPage.jsx'

export const protectedRoutes = [
  { path: '/book', element: <BookingRequestPage /> },
  { path: '/bookings', element: <BookingsPage /> },
  { path: '/schedule-proposals', element: <ScheduleProposalsPage /> },
  { path: '/reports', element: <ReportsPage /> },
  { path: '/account', element: <AccountPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/messages', element: <MessagesPage /> },
  { path: '/reviews', element: <ReviewsPage /> },
  { path: '/assessments', element: <AssessmentsPage /> },
]
