import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { SkipLink } from '../components/layout/SkipLink.jsx'
import { publicNavigation } from '../routes/publicNavigation.js'

export function AuthLayout() {
  return (
    <div className="site-shell auth-layout">
      <SkipLink />
      <div className="top-strip">
        <div className="top-strip-inner">
          <span className="top-strip-text">New tutor applications are open. Verified profiles only.</span>
          <Link to="/join" className="top-strip-link">Apply now</Link>
        </div>
      </div>

      <header className="auth-layout-header">
        <Link to="/" className="brand-wrap" aria-label="Return to Isomo home">
          <img className="brand-logo brand-logo-wide" src="/logo-long-white.png" alt="Isomo" />
        </Link>

        <nav className="auth-layout-nav" aria-label="Public navigation">
          {publicNavigation.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>
          ))}
        </nav>

        <div className="auth-layout-actions">
          <NavLink className="link-button" to="/sign-in">Sign in</NavLink>
          <NavLink className="primary-button" to="/join">Join now</NavLink>
        </div>
      </header>
      <main id="main-content" className="page-content auth-layout-content" tabIndex="-1">
        <Outlet />
      </main>
    </div>
  )
}
