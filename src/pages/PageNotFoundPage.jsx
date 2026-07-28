import React from 'react'
import { Link } from 'react-router-dom'

import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import './PageNotFoundPage.css'

export function PageNotFoundPage() {
  return (
    <main className="not-found-page">
      <section>
        <div className="not-found-code" aria-hidden="true">404</div>
        <span><DashboardIcon name="search" size={22} /></span>
        <p className="eyebrow">Page not found</p>
        <h1>This learning path does not exist.</h1>
        <p>The address may be incorrect, or the page may have moved. Continue from one of Isomo's main areas.</p>
        <div className="not-found-actions">
          <Link className="primary-button" to="/tutors">Find a tutor</Link>
          <Link className="secondary-button" to="/courses">Browse courses</Link>
          <Link className="text-button" to="/">Return home</Link>
        </div>
      </section>
    </main>
  )
}
