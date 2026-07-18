import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { RequireAuth, RequireRole } from '../components/RouteGuards.jsx'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { DashboardLayout } from '../layouts/DashboardLayout.jsx'
import { PublicLayout } from '../layouts/PublicLayout.jsx'
import { adminRoutes } from './adminRoutes.jsx'
import { authRoutes } from './authRoutes.jsx'
import { parentRoutes } from './parentRoutes.jsx'
import { participantRoutes } from './participantRoutes.jsx'
import { protectedRoutes } from './protectedRoutes.jsx'
import { publicRoutes } from './publicRoutes.jsx'
import { studentRoutes } from './studentRoutes.jsx'
import { tutorRoutes } from './tutorRoutes.jsx'

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
      </Routes>
    </BrowserRouter>
  )
}
