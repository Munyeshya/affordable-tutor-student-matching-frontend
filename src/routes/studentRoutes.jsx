import React from 'react'

import { LearningPage } from '../pages/LearningPage.jsx'
import { StudentDashboardPage } from '../pages/StudentDashboardPage.jsx'

export const studentRoutes = [
  { path: '/student', element: <StudentDashboardPage /> },
  { path: '/learning', element: <LearningPage /> },
]

