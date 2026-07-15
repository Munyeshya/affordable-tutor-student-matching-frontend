import React from 'react'

import { TutorDocumentsPage } from '../pages/TutorDocumentsPage.jsx'
import { TutorTeachingPage } from '../pages/TutorTeachingPage.jsx'
import { TutorDashboardPage } from '../pages/TutorDashboardPage.jsx'
import { TutorEarningsPage } from '../pages/TutorEarningsPage.jsx'

export const tutorRoutes = [
  { path: '/tutor', element: <TutorDashboardPage /> },
  { path: '/tutor-dashboard', element: <TutorDashboardPage /> },
  { path: '/tutor-documents', element: <TutorDocumentsPage /> },
  { path: '/tutor-teaching', element: <TutorTeachingPage /> },
  { path: '/tutor-earnings', element: <TutorEarningsPage /> },
]
