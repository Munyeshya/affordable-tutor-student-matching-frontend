import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext.jsx'
import { publicNavigation } from '../../routes/publicNavigation.js'
import { getRoleHomePath } from '../../routes/rolePaths.js'
import { ShellIcon } from './ShellIcon.jsx'
import './PublicHeader.css'


function HeaderActions({ dashboardPath, isAuthenticated, loading, onNavigate }) {
  if (loading) {
    return <span className="public-header-loading" role="status">Loading account...</span>
  }

  if (isAuthenticated) {
    return (
      <Link className="primary-button" to={dashboardPath} onClick={onNavigate}>
        Dashboard
      </Link>
    )
  }

  return (
    <>
      <Link className="link-button" to="/sign-in" onClick={onNavigate}>Sign in</Link>
      <Link className="primary-button" to="/join" onClick={onNavigate}>Join now</Link>
    </>
  )
}

export function PublicHeader() {
  const { user, isAuthenticated, loading } = useAuth()
  const dashboardPath = getRoleHomePath(user?.role)
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef(null)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        window.requestAnimationFrame(() => menuButtonRef.current?.focus())
      }
    }
    const closeOutside = (event) => {
      if (!headerRef.current?.contains(event.target)) setMenuOpen(false)
    }
    const closeAtDesktopWidth = () => {
      if (window.innerWidth > 900) setMenuOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOutside)
    window.addEventListener('resize', closeAtDesktopWidth)

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOutside)
      window.removeEventListener('resize', closeAtDesktopWidth)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <div className="top-strip">
        <div className="top-strip-inner">
          <span className="top-strip-text">New tutor applications are open. Verified profiles only.</span>
          <Link to="/join" className="top-strip-link">Apply now</Link>
        </div>
      </div>

      <header className="site-header" ref={headerRef}>
        <div className="header-inner public-header-inner">
          <Link to="/" className="brand-wrap" aria-label="Isomo home" onClick={closeMenu}>
            <img className="brand-logo brand-logo-wide" src="/logo-long-white.png" alt="Isomo" />
          </Link>

          <nav className="public-desktop-nav" aria-label="Primary navigation">
            {publicNavigation.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>
            ))}
          </nav>

          <div className="public-header-actions public-desktop-actions">
            <HeaderActions
              dashboardPath={dashboardPath}
              isAuthenticated={isAuthenticated}
              loading={loading}
              onNavigate={closeMenu}
            />
          </div>

          <button
            ref={menuButtonRef}
            className="public-menu-toggle"
            type="button"
            aria-controls="public-mobile-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <ShellIcon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>

        <div
          id="public-mobile-menu"
          className={`public-mobile-menu${menuOpen ? ' open' : ''}`}
          aria-hidden={!menuOpen}
        >
          <div>
            <nav className="public-mobile-nav" aria-label="Mobile navigation">
              {publicNavigation.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} onClick={closeMenu}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="public-header-actions public-mobile-actions">
              <HeaderActions
                dashboardPath={dashboardPath}
                isAuthenticated={isAuthenticated}
                loading={loading}
                onNavigate={closeMenu}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}