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
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-hero-kicker">
            <span aria-hidden="true" /> Rwanda&apos;s learning marketplace
          </p>
          <h1>
            Find the right tutor for the lesson <em>and your budget.</em>
          </h1>
          <p className="home-hero-intro">
            Compare verified tutors by subject, education level, availability, and price before
            you make a request.
          </p>

          <form className="home-hero-search" action="/tutors" method="get" role="search">
            <span className="home-hero-search-icon" aria-hidden="true">
              <ShellIcon name="search" />
            </span>
            <input
              aria-label="Search tutors by name, lesson, or topic"
              name="q"
              placeholder="Tutor name, lesson, or topic"
              type="search"
            />
            <button className="home-hero-search-button" type="submit">
              Find a tutor <ShellIcon name="arrow" />
            </button>
          </form>

          <div className="home-hero-popular" aria-label="Popular tutor searches">
            <span>Popular:</span>
            <Link to="/tutors?q=Mathematics">Mathematics</Link>
            <Link to="/tutors?q=English">English</Link>
            <Link to="/tutors?q=Physics">Physics</Link>
          </div>

          <div className="home-hero-trust" aria-label="YigaReach marketplace benefits">
            <span><ShellIcon name="shield" /> Document-checked tutors</span>
            <span><ShellIcon name="book" /> Primary to university</span>
            <span><ShellIcon name="star" /> Lesson-specific reviews</span>
          </div>
        </div>

        <aside className="home-hero-preview" aria-label="How YigaReach tutor matching works">
          <div className="home-hero-preview-rail" aria-hidden="true">
            <strong>01</strong>
            <span>Discover</span>
          </div>

          <div className="home-hero-preview-main">
            <div className="home-hero-preview-heading">
              <span><ShellIcon name="shield" /> Verified profiles</span>
              <small>Rates shown upfront</small>
            </div>

            <div className="home-hero-illustration">
              <img
                src="/aking-notes.svg"
                alt="Student taking notes while learning with YigaReach"
              />
            </div>

            <div className="home-hero-match-card">
              <p>Your learning need</p>
              <h2>Matched by subject, level, price, and time.</h2>
              <div>
                <span><ShellIcon name="book" /> Curriculum fit</span>
                <span><ShellIcon name="users" /> Tutor choice</span>
              </div>
              <Link to="/how-it-works">
                See how matching works <ShellIcon name="arrow" />
              </Link>
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






















