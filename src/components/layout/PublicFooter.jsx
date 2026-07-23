import React from 'react'
import { Link } from 'react-router-dom'

import { ShellIcon } from './ShellIcon.jsx'
import './PublicFooter.css'

const footerGroups = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Find tutors', to: '/tutors' },
      { label: 'Browse courses', to: '/courses' },
      { label: 'How it works', to: '/how-it-works' },
    ],
  },
  {
    title: 'Isomo',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Contact and support', to: '/contact' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', to: '/sign-in' },
      { label: 'Create an account', to: '/join' },
    ],
  },
]

export function PublicFooter() {
  return (
    <footer className="isomo-footer">
      <section className="isomo-footer-cta" aria-labelledby="footer-cta-title">
        <div>
          <p>Start with what you need</p>
          <h2 id="footer-cta-title">Find learning support that fits your goals and budget.</h2>
        </div>
        <div className="isomo-footer-actions">
          <Link to="/tutors">Find a tutor <ShellIcon name="arrow" /></Link>
          <Link to="/join">Join Isomo <ShellIcon name="arrow" /></Link>
        </div>
      </section>

      <div className="isomo-footer-main">
        <div className="isomo-footer-brand">
          <Link to="/" aria-label="Isomo home">
            <img src="/logo-small-white.png" alt="" />
          </Link>
          <div>
            <strong>Affordable learning, built for trust.</strong>
            <p>Discover verified tutors, structured courses, and progress you can understand.</p>
          </div>
          <p className="isomo-footer-promise"><span aria-hidden="true" /> Verified support. Visible pricing. Clear outcomes.</p>
        </div>

        <nav className="isomo-footer-nav" aria-label="Footer navigation">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map((link) => <Link to={link.to} key={link.to}>{link.label}</Link>)}
            </div>
          ))}
        </nav>
      </div>

      <div className="isomo-footer-bottom">
        <p>Copyright &copy; 2026 Isomo. All rights reserved.</p>
        <p>Connecting students, parents, and tutors across Rwanda.</p>
      </div>
    </footer>
  )
}
