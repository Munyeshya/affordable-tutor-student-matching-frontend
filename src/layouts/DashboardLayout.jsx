import React, { useEffect, useRef, useState } from 'react'
import { queryKeys } from '../api/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { getUnreadNotificationCount } from '../api/services/notifications.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { DashboardRoleGuide } from '../components/layout/DashboardRoleGuide.jsx'
import { DashboardSidebar } from '../components/layout/DashboardSidebar.jsx'
import { SkipLink } from '../components/layout/SkipLink.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getDashboardNavigation, getDashboardPageTitle } from '../routes/dashboardNavigation.js'
import { getRoleHomePath } from '../routes/rolePaths.js'
import './DashboardLayout.css'


function getDisplayName(user) {
  return user?.full_name
    || [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()
    || user?.username
    || user?.email
    || 'Isomo member'
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'IM'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}


export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const accountRef = useRef(null)
  const accountButtonRef = useRef(null)
  const menuButtonRef = useRef(null)
  const sidebarRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  const displayName = getDisplayName(user)
  const initials = getInitials(displayName)
  const role = String(user?.role || 'member').toLowerCase()
  const homePath = getRoleHomePath(user?.role)
  const navigation = getDashboardNavigation(user?.role)
  const pageTitle = getDashboardPageTitle(user?.role, location.pathname)

  const unreadQuery = useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => getUnreadNotificationCount().then((response) => response.data),
    enabled: Boolean(user),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })
  const unreadCount = Number(unreadQuery.data?.unread_count) || 0

  useEffect(() => {
    function handlePointerDown(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && accountRef.current?.contains(document.activeElement)) {
        setAccountOpen(false)
        window.requestAnimationFrame(() => accountButtonRef.current?.focus())
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!sidebarOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const menuButton = menuButtonRef.current
    const sidebar = sidebarRef.current
    const desktopMedia = window.matchMedia('(min-width: 961px)')
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const getFocusableElements = () => Array.from(sidebar?.querySelectorAll(focusableSelector) || [])
    const focusFrame = window.requestAnimationFrame(() => getFocusableElements()[0]?.focus())
    const handleDrawerKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
        return
      }

      if (event.key !== 'Tab') return
      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
    const closeOnDesktop = (event) => {
      if (event.matches) setSidebarOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleDrawerKeyDown)
    desktopMedia.addEventListener('change', closeOnDesktop)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleDrawerKeyDown)
      desktopMedia.removeEventListener('change', closeOnDesktop)
      if (!desktopMedia.matches) menuButton?.focus()
    }
  }, [sidebarOpen])

  async function handleSignOut() {
    setSigningOut(true)
    setAccountOpen(false)
    await signOut()
    navigate('/sign-in', { replace: true })
  }

  return (
    <div className="dashboard-shell">
      <SkipLink />
      <button
        className={`dashboard-sidebar-backdrop${sidebarOpen ? ' open' : ''}`}
        type="button"
        aria-label="Close dashboard navigation"
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        ref={sidebarRef}
        id="dashboard-sidebar"
        className={`dashboard-sidebar${sidebarOpen ? ' open' : ''}`}
        aria-label="Dashboard sidebar"
        aria-modal={sidebarOpen || undefined}
        role={sidebarOpen ? 'dialog' : undefined}
      >
        <DashboardSidebar
          displayName={displayName}
          homePath={homePath}
          navigation={navigation}
          role={role}
          onNavigate={() => setSidebarOpen(false)}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-leading">
            <button
              ref={menuButtonRef}
              className="dashboard-mobile-menu"
              type="button"
              aria-label="Open dashboard navigation"
              aria-controls="dashboard-sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <DashboardIcon name="menu" />
            </button>
            <div className="dashboard-header-copy">
              <strong>{pageTitle}</strong>
              <span>{role} workspace</span>
            </div>
          </div>

          <div className="dashboard-header-actions">
            <button
              className="dashboard-guide-trigger"
              type="button"
              aria-haspopup="dialog"
              onClick={() => setGuideOpen(true)}
            >
              <DashboardIcon name="help" />
              <span>Role guide</span>
            </button>
            <Link className="dashboard-notification-link" to="/notifications" aria-label={`${unreadCount} unread notifications`}>
              <DashboardIcon name="bell" />
              {unreadCount > 0 ? (
                <span className="dashboard-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              ) : null}
            </Link>

            <div className="dashboard-account" ref={accountRef}>
              <button
                ref={accountButtonRef}
                className="dashboard-account-trigger"
                type="button"
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((current) => !current)}
              >
                <span className="dashboard-account-avatar">{initials}</span>
                <span>{displayName}</span>
              </button>

              {accountOpen ? (
                <div className="dashboard-account-menu" role="menu">
                  <div className="dashboard-account-summary">
                    <strong>{displayName}</strong>
                    <span>{user?.email || `${role} account`}</span>
                  </div>
                  <Link to="/account" role="menuitem" onClick={() => setAccountOpen(false)}>
                    <DashboardIcon name="account" size={18} />
                    Account settings
                  </Link>
                  <button type="button" role="menuitem" onClick={() => {
                    setAccountOpen(false)
                    setGuideOpen(true)
                  }}>
                    <DashboardIcon name="help" size={18} />
                    Role guide
                  </button>
                  <Link to="/" role="menuitem" onClick={() => setAccountOpen(false)}>
                    <DashboardIcon name="site" size={18} />
                    Public site
                  </Link>
                  <button type="button" role="menuitem" onClick={handleSignOut} disabled={signingOut}>
                    <DashboardIcon name="logout" size={18} />
                    {signingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main id="main-content" className="dashboard-content" tabIndex="-1">
          <Outlet />
        </main>
      </div>
      <DashboardRoleGuide open={guideOpen} role={user?.role} onClose={() => setGuideOpen(false)} />
    </div>
  )
}




