import React, { Component } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { DashboardIcon } from './layout/DashboardIcon.jsx'
import './AppErrorBoundary.css'

class Boundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="app-error-page">
        <section>
          <span><DashboardIcon name="warning" size={24} /></span>
          <p className="eyebrow">Something went wrong</p>
          <h1>This page could not be displayed.</h1>
          <p>Your account and saved work are safe. Reload this page or return to a stable starting point.</p>
          <div>
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <Link className="secondary-button" to="/">Return home</Link>
          </div>
        </section>
      </main>
    )
  }
}

export function AppErrorBoundary({ children }) {
  const location = useLocation()
  return <Boundary resetKey={location.key}>{children}</Boundary>
}
