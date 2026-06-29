import React from 'react'
import { useEffect, useState } from 'react'
import './App.css'

const featuredTutors = [
  {
    name: 'Aline M.',
    lesson: 'Mathematics',
    level: 'Upper Secondary',
    rating: '4.9',
    price: 'RWF 4,000 / hr',
    tag: 'Verified',
  },
  {
    name: 'Eric N.',
    lesson: 'English',
    level: 'Primary',
    rating: '4.8',
    price: 'RWF 3,500 / hr',
    tag: 'Affordable',
  },
  {
    name: 'Diane K.',
    lesson: 'Computer Studies',
    level: 'University',
    rating: '5.0',
    price: 'RWF 6,000 / hr',
    tag: 'Top rated',
  },
]

const steps = [
  {
    title: 'Search with confidence',
    description: 'Find tutors by name, lesson, or topic with a clear marketplace view.',
  },
  {
    title: 'Compare the essentials',
    description: 'See ratings, level, lesson focus, and affordability before you decide.',
  },
  {
    title: 'Book and learn',
    description: 'Move from discovery to a lesson request in just a few simple taps.',
  },
]

function SkeletonCard() {
  return (
    <div className="tutor-card skeleton-card" aria-hidden="true">
      <div className="skeleton-line skeleton-avatar" />
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-subtitle" />
      <div className="skeleton-line skeleton-chip" />
      <div className="skeleton-line skeleton-chip short" />
    </div>
  )
}

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand">Affordable Tutor</p>
          <h1>Learning made simple, trusted, and affordable.</h1>
        </div>
        <nav className="topbar-actions" aria-label="Primary">
          <a href="#explore">Find tutors</a>
          <a href="#join">Join as tutor</a>
          <button className="ghost-button" type="button">
            Sign in
          </button>
        </nav>
      </header>

      <main className="page">
        <section className="hero card">
          <div className="hero-copy">
            <p className="eyebrow">Airbnb-style marketplace for learning</p>
            <h2>Discover qualified tutors with a calm, reliable experience.</h2>
            <p className="supporting-text">
              Students can compare tutors by lesson, topic, level, and price. Tutors can present
              their expertise professionally without the interface ever feeling crowded.
            </p>

            <div className="cta-row">
              <button className="primary-button" type="button">
                Start searching
              </button>
              <button className="secondary-button" type="button">
                Explore how it works
              </button>
            </div>

            <div className="mini-metrics" aria-label="Platform highlights">
              <div>
                <strong>100+</strong>
                <span>lesson listings</span>
              </div>
              <div>
                <strong>4.8/5</strong>
                <span>average rating</span>
              </div>
              <div>
                <strong>Affordable</strong>
                <span>price-first matching</span>
              </div>
            </div>
          </div>

          <div className="hero-panel" id="explore">
            <div className="search-box">
              <label className="search-label" htmlFor="search">
                Search by name, lesson, or topic
              </label>
              <div className="search-row">
                <input
                  id="search"
                  type="text"
                  placeholder="e.g. Mathematics, Aline, algebra"
                />
                <button className="primary-button compact" type="button">
                  Search
                </button>
              </div>
            </div>

            <div className="feature-list">
              <div>
                <span className="feature-label">Trusted tutors</span>
                <p>Document-backed tutor profiles and approval-based visibility.</p>
              </div>
              <div>
                <span className="feature-label">Lesson focused</span>
                <p>Each tutor can separate offers by lesson and education level.</p>
              </div>
              <div>
                <span className="feature-label">Simple booking</span>
                <p>Clear pathways for students, tutors, and admins with no clutter.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Featured tutors</p>
              <h3>Profiles that feel professional and easy to compare.</h3>
            </div>
            <a href="#join">Become a tutor</a>
          </div>

          <div className="grid cards-grid">
            {loading
              ? featuredTutors.map((_, index) => <SkeletonCard key={index} />)
              : featuredTutors.map((tutor) => (
                  <article className="tutor-card" key={tutor.name}>
                    <div className="card-topline">
                      <div>
                        <p className="tutor-name">{tutor.name}</p>
                        <p className="tutor-lesson">{tutor.lesson}</p>
                      </div>
                      <span className="badge">{tutor.tag}</span>
                    </div>

                    <div className="meta-row">
                      <span>{tutor.level}</span>
                      <span>{tutor.rating} rating</span>
                    </div>

                    <p className="price">{tutor.price}</p>
                  </article>
                ))}
          </div>
        </section>

        <section className="section-block split">
          <div className="panel card">
            <p className="eyebrow">User flow</p>
            <h3>Three taps or less for the main actions.</h3>
            <div className="steps">
              {steps.map((step, index) => (
                <div className="step" key={step.title}>
                  <span className="step-index">0{index + 1}</span>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel card" id="join">
            <p className="eyebrow">Tutor onboarding</p>
            <h3>A clean space for verified tutors to present lessons.</h3>
            <p className="supporting-text">
              Tutors will be able to upload documents, share the lessons they teach, and remain
              limited until approved by admin. The interface keeps that process calm and simple.
            </p>

            <div className="cta-row">
              <button className="primary-button" type="button">
                Start tutor application
              </button>
              <button className="secondary-button" type="button">
                View requirements
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
