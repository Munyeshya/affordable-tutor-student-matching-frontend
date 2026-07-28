import React from 'react'

import { lazyNamed } from './lazyNamed.jsx'

const HomePage = lazyNamed(() => import('../App.jsx'), 'HomePage')
const AboutPage = lazyNamed(() => import('../pages/AboutPage.jsx'), 'AboutPage')
const ContactPage = lazyNamed(() => import('../pages/ContactPage.jsx'), 'ContactPage')
const HowItWorksPage = lazyNamed(() => import('../pages/HowItWorksPage.jsx'), 'HowItWorksPage')
const CoursesPage = lazyNamed(() => import('../pages/CoursesPage.jsx'), 'CoursesPage')
const CourseDetailPage = lazyNamed(() => import('../pages/CourseDetailPage.jsx'), 'CourseDetailPage')
const TutorsPage = lazyNamed(() => import('../pages/public/TutorsPage.jsx'), 'TutorsPage')
const TutorDetailPage = lazyNamed(() => import('../pages/TutorDetailPage.jsx'), 'TutorDetailPage')
const ScheduleProposalBuilderPage = lazyNamed(() => import('../pages/ScheduleProposalBuilderPage.jsx'), 'ScheduleProposalBuilderPage')
const UnauthorizedPage = lazyNamed(() => import('../pages/UnauthorizedPage.jsx'), 'UnauthorizedPage')
const BookingRequestRoute = lazyNamed(() => import('./BookingRequestRoute.jsx'), 'BookingRequestRoute')

export const publicRoutes = [
  { key: 'home', index: true, element: <HomePage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/tutors', element: <TutorsPage /> },
  { path: '/tutors/:id', element: <TutorDetailPage /> },
  { path: '/tutors/:id/propose', element: <ScheduleProposalBuilderPage /> },
  { path: '/book', element: <BookingRequestRoute /> },
  { path: '/courses', element: <CoursesPage /> },
  { path: '/courses/:id', element: <CourseDetailPage /> },
  { path: '/how-it-works', element: <HowItWorksPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
]
