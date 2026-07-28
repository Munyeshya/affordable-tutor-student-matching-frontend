import React from 'react'

import { lazyNamed } from './lazyNamed.jsx'

const ParentDashboardPage = lazyNamed(() => import('../pages/ParentDashboardPage.jsx'), 'ParentDashboardPage')
const ParentStudentDetailPage = lazyNamed(() => import('../pages/ParentStudentDetailPage.jsx'), 'ParentStudentDetailPage')
const ParentStudentsPage = lazyNamed(() => import('../pages/ParentStudentsPage.jsx'), 'ParentStudentsPage')

export const parentRoutes = [
  { path: '/parent', element: <ParentDashboardPage /> },
  { path: '/parent-dashboard', element: <ParentDashboardPage /> },
  { path: '/parent-students', element: <ParentStudentsPage /> },
  { path: '/parent-students/:studentId', element: <ParentStudentDetailPage /> },
]
