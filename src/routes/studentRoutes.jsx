import React from 'react'

import { LearningPage } from '../pages/LearningPage.jsx'
import { StudentDashboardPage } from '../pages/StudentDashboardPage.jsx'

export const studentRoutes = [
  { path: '/student', element: <StudentDashboardPage /> },
  { path: '/my-courses', element: <LearningPage /> },
  { path: '/my-courses/:courseId', element: <LearningPage /> },
  { path: '/my-courses/:courseId/lessons/:lessonId', element: <LearningPage /> },
  { path: '/learning', element: <LearningPage /> },
]

