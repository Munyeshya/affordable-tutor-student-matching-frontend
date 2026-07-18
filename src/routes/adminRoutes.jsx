import React from 'react'

import { AdminDisputesPage } from '../pages/AdminDisputesPage.jsx'
import { AdminAuditPage } from '../pages/AdminAuditPage.jsx'
import { AdminCoursesPage } from '../pages/AdminCoursesPage.jsx'
import { AdminReviewModerationPage } from '../pages/AdminReviewModerationPage.jsx'
import { AdminUsersPage } from '../pages/AdminUsersPage.jsx'
import { AdminTutorReviewsPage } from '../pages/AdminTutorReviewsPage.jsx'
import { AdminDashboardPage } from '../pages/AdminDashboardPage.jsx'
import { AdminPayoutsPage } from '../pages/AdminPayoutsPage.jsx'

export const adminRoutes = [
  { path: '/admin', element: <AdminDashboardPage /> },
  { path: '/admin/audit', element: <AdminAuditPage /> },
  { path: '/admin/courses', element: <AdminCoursesPage /> },
  { path: '/admin/reviews', element: <AdminReviewModerationPage /> },
  { path: '/admin/users', element: <AdminUsersPage /> },
  { path: '/admin/disputes', element: <AdminDisputesPage /> },
  { path: '/admin/tutor-reviews', element: <AdminTutorReviewsPage /> },
  { path: '/admin/payouts', element: <AdminPayoutsPage /> },
]
