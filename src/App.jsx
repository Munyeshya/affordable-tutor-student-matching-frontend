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
      <div className="top-strip" />

      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand-wrap" aria-label="Affordable Tutor home">
            <div className="brand-mark" aria-hidden="true">
              AT
            </div>
            <div>
              <p className="brand-kicker">Affordable Tutor</p>
              <p className="brand-subtitle">Tutor-student marketplace</p>
            </div>
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
        <p>Affordable Tutor</p>
        <p>Affordable learning, built for trust.</p>
      </footer>
    </div>
  )
}

function HomePage() {
  const featuredTutors = [
    {
      name: 'Aline M.',
      lesson: 'Mathematics',
      level: 'Upper Secondary',
      rating: '4.9',
      price: 'RWF 4,000 / hr',
    },
    {
      name: 'Eric N.',
      lesson: 'English',
      level: 'Primary',
      rating: '4.8',
      price: 'RWF 3,500 / hr',
    },
    {
      name: 'Diane K.',
      lesson: 'Computer Studies',
      level: 'University',
      rating: '5.0',
      price: 'RWF 6,000 / hr',
    },
  ]

  const benefits = [
    {
      title: 'Vetted tutors',
      description: 'Approved profiles, uploaded qualifications, and visible trust markers.',
    },
    {
      title: 'Affordable options',
      description: 'Students can filter by budget and compare lesson-specific pricing.',
    },
    {
      title: 'Lesson-level matching',
      description: 'Tutors can separate offers by subject, topic, and education level.',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Search tutors',
      text: 'Find by name, lesson, or topic from a focused, easy-to-scan directory.',
    },
    {
      number: '02',
      title: 'Review details',
      text: 'Check lessons, ratings, documents, level, and affordability in one place.',
    },
    {
      number: '03',
      title: 'Request a lesson',
      text: 'Send a simple request and continue inside the right role dashboard.',
    },
  ]

  return (
    <>
      <section className="hero-section card">
        <div className="hero-copy">
          <p className="eyebrow">Trusted learning marketplace</p>
          <h1>Find qualified tutors without losing simplicity or affordability.</h1>
          <p className="supporting-text">
            Students can search by tutor name, lesson, or topic. Tutors can showcase verified
            documents, lesson-specific offers, and level-based expertise. The experience stays
            calm, clear, and professional.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" to="/tutors">
              Search tutors
            </Link>
            <Link className="secondary-button" to="/join">
              Become a tutor
            </Link>
          </div>

          <div className="hero-stats" aria-label="Platform highlights">
            <div>
              <strong>Fast</strong>
              <span>3-tap main journeys</span>
            </div>
            <div>
              <strong>Verified</strong>
              <span>Document-backed profiles</span>
            </div>
            <div>
              <strong>Affordable</strong>
              <span>Price-first matching</span>
            </div>
          </div>
        </div>

        <aside className="hero-visual" aria-label="Platform preview">
          <div className="visual-card visual-card-hero">
            <div className="visual-topline">
              <span className="visual-pill">Recommended</span>
              <span className="rating-pill">
                <ShellIcon name="star" />
                4.9
              </span>
            </div>
            <h2>Mathematics tutor in Kigali</h2>
            <p>Upper secondary, affordable hourly rate, verified qualification documents.</p>
          </div>

          <div className="visual-card visual-card-small">
            <div className="icon-chip">
              <ShellIcon name="search" />
            </div>
            <div>
              <h3>Search by lesson</h3>
              <p>Discover tutors by subject, topic, or level.</p>
            </div>
          </div>

          <div className="visual-card visual-card-small">
            <div className="icon-chip">
              <ShellIcon name="shield" />
            </div>
            <div>
              <h3>Approval flow</h3>
              <p>Visibility stays restricted until admin approval.</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="content-section" id="about">
        <div className="section-heading">
          <div>
            <p className="eyebrow">About the platform</p>
            <h2>A trusted marketplace for learning.</h2>
          </div>
          <p className="section-text">
            Built for students, tutors, and admins with a clean hierarchy and predictable paths.
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <article className="info-card" key={benefit.title}>
              <div className="icon-chip">
                <ShellIcon
                  name={
                    benefit.title === 'Vetted tutors'
                      ? 'shield'
                      : benefit.title === 'Affordable options'
                        ? 'book'
                        : 'users'
                  }
                />
              </div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section" id="tutors">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured tutors</p>
            <h2>Profiles that are easy to compare.</h2>
          </div>
          <Link to="/tutors" className="section-link">
            View all <ShellIcon name="arrow" />
          </Link>
        </div>

        <div className="cards-grid">
          {featuredTutors.map((tutor) => (
            <article className="tutor-card" key={tutor.name}>
              <div className="tutor-card-top">
                <div>
                  <h3>{tutor.name}</h3>
                  <p>{tutor.lesson}</p>
                </div>
                <span className="rating-pill">
                  <ShellIcon name="star" />
                  {tutor.rating}
                </span>
              </div>

              <div className="chip-row">
                <span className="soft-chip">{tutor.level}</span>
                <span className="soft-chip">Verified</span>
              </div>

              <p className="tutor-price">{tutor.price}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section split-layout" id="how-it-works">
        <article className="panel card">
          <p className="eyebrow">How it works</p>
          <h2>Simple from first search to lesson request.</h2>

          <div className="steps-list">
            {steps.map((step) => (
              <div className="step-item" key={step.number}>
                <span className="step-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel card">
          <p className="eyebrow">Tutor onboarding</p>
          <h2>Professional, but not complicated.</h2>
          <p className="supporting-text">
            Tutors upload documents, choose the lessons they teach, and remain limited until the
            admin approves their account. The flow is kept inside the tutor dashboard so the signup
            path stays easy.
          </p>

          <div className="mini-list">
            <div>
              <ShellIcon name="shield" />
              <span>Upload qualification documents</span>
            </div>
            <div>
              <ShellIcon name="book" />
              <span>Set lessons and levels</span>
            </div>
            <div>
              <ShellIcon name="users" />
              <span>Gain visibility after approval</span>
            </div>
          </div>

          <div className="hero-actions">
            <Link className="primary-button" to="/join">
              Start application
            </Link>
            <Link className="secondary-button" to="/contact">
              See requirements
            </Link>
          </div>
        </article>
      </section>

      <section className="content-section contact-card card" id="contact">
        <div>
          <p className="eyebrow">Need help?</p>
          <h2>Reach support, request tutoring, or continue as an admin.</h2>
          <p className="supporting-text">
            Everything stays accessible, responsive, and consistent on mobile and desktop.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="primary-button" to="/contact">
            Contact support
          </Link>
          <Link className="secondary-button" to="/about">
            Read more
          </Link>
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
