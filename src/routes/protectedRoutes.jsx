import React from 'react'

import { lazyNamed } from './lazyNamed.jsx'

const ReportsPage = lazyNamed(() => import('../pages/ReportsPage.jsx'), 'ReportsPage')
const AccountPage = lazyNamed(() => import('../pages/AccountPage.jsx'), 'AccountPage')
const NotificationsPage = lazyNamed(() => import('../pages/NotificationsPage.jsx'), 'NotificationsPage')
const ReviewsPage = lazyNamed(() => import('../pages/ReviewsPage.jsx'), 'ReviewsPage')

export const protectedRoutes = [
  { path: '/reports', element: <ReportsPage /> },
  { path: '/account', element: <AccountPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/reviews', element: <ReviewsPage /> },
]
