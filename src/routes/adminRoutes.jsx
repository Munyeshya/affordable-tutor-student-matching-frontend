import React from 'react'

import { AdminDisputesPage } from '../pages/AdminDisputesPage.jsx'
import { AdminTutorReviewsPage } from '../pages/AdminTutorReviewsPage.jsx'
import { AdminDashboardPage } from '../pages/AdminDashboardPage.jsx'

export const adminRoutes = [
  { path: '/admin', element: <AdminDashboardPage /> },
  { path: '/admin/disputes', element: <AdminDisputesPage /> },
  { path: '/admin/tutor-reviews', element: <AdminTutorReviewsPage /> },
]
