import React from 'react'

import { ParentDashboardPage } from '../pages/ParentDashboardPage.jsx'
import { ParentStudentDetailPage } from '../pages/ParentStudentDetailPage.jsx'
import { ParentStudentsPage } from '../pages/ParentStudentsPage.jsx'

export const parentRoutes = [
  { path: '/parent', element: <ParentDashboardPage /> },
  { path: '/parent-dashboard', element: <ParentDashboardPage /> },
  { path: '/parent-students', element: <ParentStudentsPage /> },
  { path: '/parent-students/:studentId', element: <ParentStudentDetailPage /> },
]
