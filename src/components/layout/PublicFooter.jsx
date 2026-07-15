import React from 'react'
import { Link } from 'react-router-dom'

import { ShellIcon } from './ShellIcon.jsx'

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img className="footer-logo" src="/logo-small-white.png" alt="Isomo" />
        <p>Affordable learning, built for trust.</p>
        <p>Copyright © 2026 Isomo. All rights reserved.</p>
      </div>

      <div className="footer-links">
        <div>
          <h3>Company</h3>
          <Link to="/about">About us</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/contact">Contact us</Link>
        </div>

        <div>
          <h3>Support</h3>
          <Link to="/contact">Help center</Link>
          <Link to="/contact">Terms of service</Link>
          <Link to="/contact">Privacy policy</Link>
        </div>
      </div>

      <div className="footer-newsletter">
        <h3>Stay up to date</h3>
        <p>Get the latest tutor updates and platform news.</p>
        <form className="footer-form">
          <input type="email" placeholder="Your email address" aria-label="Email address" />
          <button type="submit" aria-label="Subscribe to updates">
            <ShellIcon name="arrow" />
          </button>
        </form>
      </div>
    </footer>
  )
}
