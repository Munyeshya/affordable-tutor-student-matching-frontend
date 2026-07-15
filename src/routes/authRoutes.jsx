import React from 'react'

import { JoinPage } from '../pages/JoinPage.jsx'
import { SignInPage } from '../pages/SignInPage.jsx'

export const authRoutes = [
  { path: '/sign-in', element: <SignInPage /> },
  { path: '/join', element: <JoinPage /> },
]
