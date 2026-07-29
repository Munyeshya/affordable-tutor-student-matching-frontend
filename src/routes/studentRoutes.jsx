import React from 'react'

import { lazyNamed } from './lazyNamed.jsx'

const LearningPage = lazyNamed(() => import('../pages/LearningPage.jsx'), 'LearningPage')
const StudentDashboardPage = lazyNamed(() => import('../pages/StudentDashboardPage.jsx'), 'StudentDashboardPage')
const StudentFamilyLinksPage = lazyNamed(() => import('../pages/StudentFamilyLinksPage.jsx'), 'StudentFamilyLinksPage')

export const studentRoutes = [
  { path: '/student', element: <StudentDashboardPage /> },
  { path: '/my-courses', element: <LearningPage /> },
  { path: '/my-courses/:courseId', element: <LearningPage /> },
  { path: '/my-courses/:courseId/lessons/:lessonId', element: <LearningPage /> },
  { path: '/learning', element: <LearningPage /> },
  { path: '/family-links', element: <StudentFamilyLinksPage /> },
]
