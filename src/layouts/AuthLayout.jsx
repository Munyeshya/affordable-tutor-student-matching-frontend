import React from 'react'
import { Outlet } from 'react-router-dom'

import { PublicHeader } from '../components/layout/PublicHeader.jsx'
import { SkipLink } from '../components/layout/SkipLink.jsx'

export function AuthLayout() {
  return (
    <div className="site-shell public-layout auth-layout">
      <SkipLink />
      <PublicHeader />
      <main id="main-content" className="page-content auth-layout-content" tabIndex="-1">
        <Outlet />
      </main>
    </div>
  )
}
