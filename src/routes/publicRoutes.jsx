import React from 'react'

import { HomePage } from '../App.jsx'
import { AboutPage } from '../pages/AboutPage.jsx'
import { ContactPage } from '../pages/ContactPage.jsx'
import { HowItWorksPage } from '../pages/HowItWorksPage.jsx'
import { CoursesPage } from '../pages/CoursesPage.jsx'
import { CourseDetailPage } from '../pages/CourseDetailPage.jsx'
import { TutorsPage } from '../pages/public/TutorsPage.jsx'
import { TutorDetailPage } from '../pages/TutorDetailPage.jsx'
import { UnauthorizedPage } from '../pages/UnauthorizedPage.jsx'

export const publicRoutes = [
  { key: 'home', index: true, element: <HomePage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/tutors', element: <TutorsPage /> },
  { path: '/tutors/:id', element: <TutorDetailPage /> },
  { path: '/courses', element: <CoursesPage /> },
  { path: '/courses/:id', element: <CourseDetailPage /> },
  { path: '/how-it-works', element: <HowItWorksPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
]
