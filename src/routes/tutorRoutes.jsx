import React from 'react'

import { lazyNamed } from './lazyNamed.jsx'

const TutorCoursePage = lazyNamed(() => import('../pages/TutorCoursePage.jsx'), 'TutorCoursePage')
const TutorDashboardPage = lazyNamed(() => import('../pages/TutorDashboardPage.jsx'), 'TutorDashboardPage')
const TutorDocumentsPage = lazyNamed(() => import('../pages/TutorDocumentsPage.jsx'), 'TutorDocumentsPage')
const TutorEarningsPage = lazyNamed(() => import('../pages/TutorEarningsPage.jsx'), 'TutorEarningsPage')
const TutorLessonPage = lazyNamed(() => import('../pages/TutorLessonPage.jsx'), 'TutorLessonPage')
const TutorTeachingPage = lazyNamed(() => import('../pages/TutorTeachingPage.jsx'), 'TutorTeachingPage')
const TutorAvailabilityPage = lazyNamed(() => import('../pages/TutorAvailabilityPage.jsx'), 'TutorAvailabilityPage')

export const tutorRoutes = [
  { path: '/tutor', element: <TutorDashboardPage /> },
  { path: '/tutor-dashboard', element: <TutorDashboardPage /> },
  { path: '/tutor-documents', element: <TutorDocumentsPage /> },
  { path: '/tutor-availability', element: <TutorAvailabilityPage /> },
  { path: '/tutor-teaching', element: <TutorTeachingPage /> },
  { path: '/tutor-teaching/courses/new', element: <TutorCoursePage isNew /> },
  { path: '/tutor-teaching/courses/:courseId', element: <TutorCoursePage /> },
  { path: '/tutor-teaching/courses/:courseId/details', element: <TutorCoursePage /> },
  { path: '/tutor-teaching/courses/:courseId/curriculum', element: <TutorCoursePage section="curriculum" /> },
  { path: '/tutor-teaching/courses/:courseId/assessments', element: <TutorCoursePage section="assessments" /> },
  { path: '/tutor-teaching/courses/:courseId/review', element: <TutorCoursePage section="review" /> },
  { path: '/tutor-teaching/courses/:courseId/lessons/new', element: <TutorLessonPage isNew /> },
  { path: '/tutor-teaching/courses/:courseId/lessons/:lessonId', element: <TutorLessonPage /> },
  { path: '/tutor-earnings', element: <TutorEarningsPage /> },
]
