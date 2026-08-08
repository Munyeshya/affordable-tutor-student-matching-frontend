import React from 'react'
import { Link } from 'react-router-dom'
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
      <section className="learning-hero">
        <img
          className="learning-hero-image"
          src="/yigareach-learners.webp"
          alt="Three learners ready to study with support from YigaReach tutors"
        />
        <div className="learning-hero-scrim" aria-hidden="true" />

        <span className="learning-hero-mark learning-hero-mark-book" aria-hidden="true">
          <ShellIcon name="book" />
        </span>
        <span className="learning-hero-mark learning-hero-mark-star" aria-hidden="true">
          <ShellIcon name="star" />
        </span>
        <span className="learning-hero-mark learning-hero-mark-shield" aria-hidden="true">
          <ShellIcon name="shield" />
        </span>

        <div className="learning-hero-content">
          <p className="learning-hero-kicker">
            <span aria-hidden="true" /> Rwanda&apos;s trusted learning marketplace
          </p>
          <h1>
            Master every lesson with the <em>right tutor beside you.</em>
          </h1>
          <p className="learning-hero-intro">
            Compare verified tutors by subject, level, availability, and price, then learn at a
            pace that works for you and your budget.
          </p>

          <div className="learning-hero-actions">
            <Link className="learning-hero-primary" to="/tutors">
              Find a tutor <ShellIcon name="arrow" />
            </Link>
            <Link className="learning-hero-secondary" to="/courses">
              <span><ShellIcon name="book" /></span> Explore courses
            </Link>
          </div>

          <div className="learning-hero-proof" aria-label="YigaReach community and trust">
            <div className="learning-hero-avatars" aria-hidden="true">
              <span>Y</span>
              <span>R</span>
              <span>W</span>
              <span>+</span>
            </div>
            <p><strong>2K+ learners and tutors</strong><small>Growing together on YigaReach</small></p>
            <span className="learning-hero-verified"><ShellIcon name="shield" /> Verified profiles</span>
          </div>
        </div>
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
            alt="Illustration of a researcher representing the YigaReach platform"
          />
        </div>

        <div className="showcase-copy">
          <p className="eyebrow">Why YigaReach</p>
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






















