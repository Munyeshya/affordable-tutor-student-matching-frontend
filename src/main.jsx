import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { Layout, HomePage } from './App.jsx'
import {
  AboutPage,
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
} from './pages.jsx'
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
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/tutor-dashboard" element={<TutorDashboardPage />} />
              <Route path="/tutor-documents" element={<TutorDocumentsPage />} />
              <Route path="/tutor-teaching" element={<TutorTeachingPage />} />
              <Route path="/book" element={<BookingRequestPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/join" element={<JoinPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
