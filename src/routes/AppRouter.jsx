import React, { Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppErrorBoundary } from '../components/AppErrorBoundary.jsx'
import { RequireAuth, RequireRole } from '../components/RouteGuards.jsx'
import { SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { DashboardLayout } from '../layouts/DashboardLayout.jsx'
import { PublicLayout } from '../layouts/PublicLayout.jsx'
import { adminRoutes } from './adminRoutes.jsx'
import { authRoutes } from './authRoutes.jsx'
import { lazyNamed } from './lazyNamed.jsx'
import { parentRoutes } from './parentRoutes.jsx'
import { participantRoutes } from './participantRoutes.jsx'
import { payerRoutes } from './payerRoutes.jsx'
import { protectedRoutes } from './protectedRoutes.jsx'
import { publicRoutes } from './publicRoutes.jsx'
import { studentRoutes } from './studentRoutes.jsx'
import { tutorRoutes } from './tutorRoutes.jsx'

const PageNotFoundPage = lazyNamed(() => import('../pages/PageNotFoundPage.jsx'), 'PageNotFoundPage')

function RouteLoader() {
  return (
    <main style={{ minHeight: '60vh', padding: 'clamp(1rem, 4vw, 3rem)' }} aria-label="Loading page">
      <SkeletonLoader rows={5} />
    </main>
  )
}

function renderRoutes(routes) {
  return routes.map((route) => (
    <Route
      key={route.key || route.path}
      index={route.index}
      path={route.path}
      element={route.element}
    />
  ))
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route element={<PublicLayout />}>
              {renderRoutes(publicRoutes)}
            </Route>

            <Route element={<AuthLayout />}>
              {renderRoutes(authRoutes)}
            </Route>

            <Route element={<RequireAuth />}>
              <Route element={<DashboardLayout />}>
                {renderRoutes(protectedRoutes)}

                <Route element={<RequireRole roles={['STUDENT', 'TUTOR', 'PARENT']} />}>
                  {renderRoutes(participantRoutes)}
                </Route>

                <Route element={<RequireRole roles={['STUDENT']} />}>
                  {renderRoutes(studentRoutes)}
                </Route>

                <Route element={<RequireRole roles={['STUDENT', 'PARENT']} />}>
                  {renderRoutes(payerRoutes)}
                </Route>

                <Route element={<RequireRole roles={['TUTOR']} />}>
                  {renderRoutes(tutorRoutes)}
                </Route>

                <Route element={<RequireRole roles={['PARENT']} />}>
                  {renderRoutes(parentRoutes)}
                </Route>

                <Route element={<RequireRole roles={['ADMIN']} />}>
                  {renderRoutes(adminRoutes)}
                </Route>
              </Route>
            </Route>

            <Route element={<PublicLayout />}>
              <Route path="*" element={<PageNotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </BrowserRouter>
  )
}
