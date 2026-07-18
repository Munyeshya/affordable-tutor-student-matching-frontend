import React from 'react'

import { ReportsPage } from '../pages/ReportsPage.jsx'
import { AccountPage } from '../pages/AccountPage.jsx'
import { AssessmentsPage } from '../pages/AssessmentsPage.jsx'
import { NotificationsPage } from '../pages/NotificationsPage.jsx'
import { ReviewsPage } from '../pages/ReviewsPage.jsx'

export const protectedRoutes = [
  { path: '/reports', element: <ReportsPage /> },
  { path: '/account', element: <AccountPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/reviews', element: <ReviewsPage /> },
  { path: '/assessments', element: <AssessmentsPage /> },
]
