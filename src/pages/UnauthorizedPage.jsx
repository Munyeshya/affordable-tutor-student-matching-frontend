import React from 'react'
import { Link } from 'react-router-dom'

export function UnauthorizedPage() {
  return (
    <section className="page-card card access-state-page" role="alert">
      <p className="eyebrow">Access restricted</p>
      <h1>You do not have permission to open this page.</h1>
      <p className="supporting-text">
        Your account is active, but this feature belongs to a different ISOMO role.
      </p>
      <div className="hero-actions">
        <Link className="primary-button" to="/account">Go to your account</Link>
        <Link className="secondary-button" to="/">Return to the marketplace</Link>
      </div>
    </section>
  )
}
