import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import './App.css'

function ShellIcon({ name }) {
  const paths = {
    search:
      'M21 21l-4.2-4.2m1.2-5.3a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z',
    shield:
      'M12 3l7 3v5c0 4.9-3.1 9.4-7 10.9C8.1 20.4 5 15.9 5 11V6l7-3z',
    star:
      'M12 17.3l-5.5 3 1.1-6.2L3 9.7l6.2-.9L12 3.2l2.8 5.6 6.2.9-4.6 4.4 1.1 6.2-5.5-3z',
    users:
      'M7.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm9 0a3 3 0 100-6 3 3 0 000 6zM3.5 19c0-2.5 2.3-4.5 5-4.5h1m2 4.5c0-2.7 2.5-4.5 5.5-4.5h1',
    book: 'M6 4.5h11a2 2 0 012 2V19a2 2 0 01-2 2H6a2 2 0 01-2-2V6.5a2 2 0 012-2zm0 0v13m2-9h9m-9 3h9',
    arrow:
      'M5 12h12m0 0-5-5m5 5-5 5',
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}

function Layout() {
  return (
    <div className="site-shell">
      <div className="top-strip">
        <div className="top-strip-inner">
          <span className="top-strip-text">New tutor applications are open. Verified profiles only.</span>
          <Link to="/join" className="top-strip-link">
            Apply now
          </Link>
        </div>
      </div>

      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand-wrap" aria-label="Isomo home">
            <img className="brand-logo brand-logo-wide" src="/logo-long-white.png" alt="Isomo" />
          </Link>

          <nav className="main-nav" aria-label="Primary">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/tutors">Tutors</NavLink>
            <NavLink to="/how-it-works">How it works</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>

          <div className="header-actions">
            <Link className="link-button" to="/sign-in">
              Sign in
            </Link>
            <Link className="primary-button" to="/join">
              Join now
            </Link>
          </div>
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

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
    </div>
  )
}

function HomePage() {
  const platformMetrics = [
    { value: '2K+', label: 'Verified tutors' },
    { value: '46+', label: 'Lessons covered' },
    { value: '4.9', label: 'Average satisfaction' },
    { value: '3 taps', label: 'To request a tutor' },
  ]

  const impactStats = [
    { value: '2K+', label: 'Verified tutors' },
    { value: '46+', label: 'Lessons covered' },
    { value: '4.9', label: 'Average satisfaction' },
    { value: '3 taps', label: 'To request a tutor' },
  ]

  return (
    <>
      <section className="hero-section card">
        <div className="hero-copy">
          <p className="hero-greeting">Hi, there!</p>
          <p className="eyebrow">Trusted learning marketplace</p>
          <h1>
            <span>ISOMO</span> is here to make tutor matching clear, premium, and affordable.
          </h1>
          <p className="supporting-text">
            Search by tutor name, lesson, or topic. Compare verified tutors, lesson-specific
            pricing, and level-based expertise in one place.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" to="/tutors">
              Search tutors
            </Link>
            <Link className="secondary-button" to="/join">
              Become a tutor
            </Link>
          </div>
        </div>

        <aside className="hero-visual" aria-label="Platform preview">
          <div className="hero-image-wrap">
            <img
              className="hero-image"
              src="/aking-notes.svg"
              alt="Stylized tutor illustration for the Isomo homepage hero"
            />
          </div>

          <div className="hero-floating-card hero-floating-card-top">
            <span className="hero-floating-figure">2K+</span>
            <span className="hero-floating-label">Verified tutors</span>
          </div>

          <div className="hero-floating-card hero-floating-card-side">
            <span className="hero-floating-figure">4.9</span>
            <span className="hero-floating-label">Satisfaction</span>
          </div>

          <div className="hero-floating-card hero-floating-card-bottom">
            <div className="icon-chip">
              <ShellIcon name="users" />
            </div>
            <div>
              <strong>Productive matching</strong>
              <span>By lesson, topic, or level</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="stats-band card" aria-label="Platform highlights">
        <div className="stats-band-copy">
          <p className="eyebrow">Helping learning stay affordable</p>
          <h2>Connecting students with trusted tutors in one simple system.</h2>
          <p className="supporting-text">
            The platform keeps discovery fast, tutor verification clear, and lesson pricing easy
            to compare.
          </p>
        </div>

        <div className="stats-band-grid">
          {platformMetrics.map((metric) => (
            <article className="stats-band-item" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section showcase-section card" id="about">
        <div className="showcase-visual">
          <img
            className="showcase-image"
            src="/researcher.svg"
            alt="Illustration of a researcher representing the Isomo platform"
          />
        </div>

        <div className="showcase-copy">
          <p className="eyebrow">Why Isomo</p>
          <h2>Affordable tutor matching built around trust and speed.</h2>
          <p className="supporting-text">
            Students can search by tutor name, lesson, topic, or level. Tutors can present their
            lessons professionally, while admins keep quality high through document-backed
            approval.
          </p>

          <div className="impact-stats">
            {impactStats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>

          <div className="hero-actions">
            <Link className="primary-button" to="/tutors">
              Browse tutors
            </Link>
            <Link className="secondary-button" to="/join">
              Start tutoring
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function Page({ title, text, action, secondary }) {
  return (
    <section className="page-card card">
      <p className="eyebrow">{title}</p>
      <h1>{text}</h1>
      <div className="hero-actions">
        <Link className="primary-button" to="/join">
          {action}
        </Link>
        {secondary ? (
          <Link className="secondary-button" to={secondary.to}>
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </section>
  )
}

export { Layout, HomePage, Page }



