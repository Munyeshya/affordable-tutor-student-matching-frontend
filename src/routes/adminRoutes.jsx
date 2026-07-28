import React from 'react'

import { lazyNamed } from './lazyNamed.jsx'

const AdminDisputesPage = lazyNamed(() => import('../pages/AdminDisputesPage.jsx'), 'AdminDisputesPage')
const AdminAuditPage = lazyNamed(() => import('../pages/AdminAuditPage.jsx'), 'AdminAuditPage')
const AdminCoursesPage = lazyNamed(() => import('../pages/AdminCoursesPage.jsx'), 'AdminCoursesPage')
const AdminReviewModerationPage = lazyNamed(() => import('../pages/AdminReviewModerationPage.jsx'), 'AdminReviewModerationPage')
const AdminUsersPage = lazyNamed(() => import('../pages/AdminUsersPage.jsx'), 'AdminUsersPage')
const AdminTutorReviewsPage = lazyNamed(() => import('../pages/AdminTutorReviewsPage.jsx'), 'AdminTutorReviewsPage')
const AdminDashboardPage = lazyNamed(() => import('../pages/AdminDashboardPage.jsx'), 'AdminDashboardPage')
const AdminPayoutsPage = lazyNamed(() => import('../pages/AdminPayoutsPage.jsx'), 'AdminPayoutsPage')

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
