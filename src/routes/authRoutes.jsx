import React from 'react'

import { lazyNamed } from './lazyNamed.jsx'

const JoinPage = lazyNamed(() => import('../pages/JoinPage.jsx'), 'JoinPage')
const SignInPage = lazyNamed(() => import('../pages/SignInPage.jsx'), 'SignInPage')
const ForgotPasswordPage = lazyNamed(() => import('../pages/AccountAccessPages.jsx'), 'ForgotPasswordPage')
const ResendVerificationPage = lazyNamed(() => import('../pages/AccountAccessPages.jsx'), 'ResendVerificationPage')
const VerifyEmailPage = lazyNamed(() => import('../pages/AccountAccessPages.jsx'), 'VerifyEmailPage')
const ResetPasswordPage = lazyNamed(() => import('../pages/AccountAccessPages.jsx'), 'ResetPasswordPage')

export const authRoutes = [
  { path: '/sign-in', element: <SignInPage /> },
  { path: '/join', element: <JoinPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/resend-verification', element: <ResendVerificationPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
]
