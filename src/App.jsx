import React from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import { ShellIcon } from './components/layout/ShellIcon.jsx'

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

export { HomePage, Page }






















