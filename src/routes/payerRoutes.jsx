import React from 'react'

import { lazyNamed } from './lazyNamed.jsx'

const PaymentsPage = lazyNamed(() => import('../pages/PaymentsPage.jsx'), 'PaymentsPage')

export const payerRoutes = [
  { path: '/payments', element: <PaymentsPage /> },
]
