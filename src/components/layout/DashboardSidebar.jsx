import React from 'react'
import { Link, NavLink } from 'react-router-dom'

import { DashboardIcon } from './DashboardIcon.jsx'

export function DashboardSidebar({ displayName, homePath, navigation, role, onNavigate, onClose }) {
  return (
    <div className="dashboard-sidebar-inner">
      <div className="dashboard-sidebar-brand">
        <Link to={homePath} onClick={onNavigate} aria-label="Isomo dashboard home">
          <img src="/logo-long-white.png" alt="Isomo" />
        </Link>
        <button className="dashboard-sidebar-close" type="button" onClick={onClose} aria-label="Close dashboard navigation">
          <DashboardIcon name="close" />
        </button>
      </div>

      <div className="dashboard-sidebar-portal">
        <span>{role} portal</span>
        <strong>{displayName}</strong>
      </div>

      <nav className="dashboard-sidebar-nav" aria-label="Dashboard navigation">
        {navigation.map((group) => (
          <div className="dashboard-sidebar-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                <DashboardIcon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="dashboard-sidebar-footer">
        <Link to="/" onClick={onNavigate}>
          <DashboardIcon name="site" />
          <span>Back to public site</span>
        </Link>
      </div>
    </div>
  )
}
