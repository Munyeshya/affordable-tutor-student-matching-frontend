import React from 'react'

import { TutorCoursePage } from '../pages/TutorCoursePage.jsx'
import { TutorDashboardPage } from '../pages/TutorDashboardPage.jsx'
import { TutorDocumentsPage } from '../pages/TutorDocumentsPage.jsx'
import { TutorEarningsPage } from '../pages/TutorEarningsPage.jsx'
import { TutorLessonPage } from '../pages/TutorLessonPage.jsx'
import { TutorTeachingPage } from '../pages/TutorTeachingPage.jsx'

export const tutorRoutes = [
  { path: '/tutor', element: <TutorDashboardPage /> },
  { path: '/tutor-dashboard', element: <TutorDashboardPage /> },
  { path: '/tutor-documents', element: <TutorDocumentsPage /> },
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
