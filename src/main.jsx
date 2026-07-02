import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { Layout, HomePage } from './App.jsx'
import {
  AboutPage,
  AdminTutorReviewsPage,
  BookingRequestPage,
  BookingsPage,
  ContactPage,
  HowItWorksPage,
  JoinPage,
  SignInPage,
  TutorsPage,
  TutorDashboardPage,
  TutorDocumentsPage,
  TutorTeachingPage,
  AdminDisputesPage,
  ReportsPage,
} from './pages.jsx'
import { AccountPage } from './pages/AccountPage.jsx'
import { ParentDashboardPage } from './pages/ParentDashboardPage.jsx'
import { CoursesPage } from './pages/CoursesPage.jsx'
import { ParentStudentsPage } from './pages/ParentStudentsPage.jsx'
import { NotificationsPage } from './pages/NotificationsPage.jsx'
import { MessagesPage } from './pages/MessagesPage.jsx'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/tutors" element={<TutorsPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/tutor-dashboard" element={<TutorDashboardPage />} />
              <Route path="/tutor-documents" element={<TutorDocumentsPage />} />
              <Route path="/tutor-teaching" element={<TutorTeachingPage />} />
              <Route path="/tutor-earnings" element={<TutorEarningsPage />} />
              <Route path="/book" element={<BookingRequestPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/admin/disputes" element={<AdminDisputesPage />} />
              <Route path="/admin/tutor-reviews" element={<AdminTutorReviewsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/parent-dashboard" element={<ParentDashboardPage />} />
              <Route path="/parent-students" element={<ParentStudentsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/join" element={<JoinPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
















