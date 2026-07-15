import React from 'react'
import { Outlet } from 'react-router-dom'

import { PublicFooter } from '../components/layout/PublicFooter.jsx'
import { PublicHeader } from '../components/layout/PublicHeader.jsx'
import { SkipLink } from '../components/layout/SkipLink.jsx'

export function PublicLayout() {
  return (
    <div className="site-shell public-layout">
      <SkipLink />
      <PublicHeader />
      <main id="main-content" className="page-content" tabIndex="-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
