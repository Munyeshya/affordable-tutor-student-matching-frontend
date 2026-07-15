import React from 'react'
import { Link } from 'react-router-dom'

export function DashboardStatCard({ icon, iconClassName, label, value, detail, className }) {
  return (
    <article className={className}>
      {icon ? <span className={iconClassName}>{icon}</span> : null}
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        {detail ? <em>{detail}</em> : null}
      </div>
    </article>
  )
}

export function DashboardPanelHeading({ className, eyebrow, title, to, action }) {
  return (
    <header className={className}>
      <div><p>{eyebrow}</p><h2>{title}</h2></div>
      {to ? <Link to={to}>{action}</Link> : null}
    </header>
  )
}

export function SkeletonLoader({ rows = 3, className }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => <span key={index} />)}
    </div>
  )
}

export function ErrorState({ className, title, message, onRetry, retryLabel = 'Try again' }) {
  return (
    <div className={className} role="alert">
      <div><strong>{title}</strong>{message ? <span>{message}</span> : null}</div>
      {onRetry ? <button type="button" onClick={onRetry}>{retryLabel}</button> : null}
    </div>
  )
}

export function EmptyState({ className, icon, title, description, actionTo, actionLabel, children }) {
  return (
    <div className={className}>
      {icon || null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {actionTo && actionLabel ? <Link to={actionTo}>{actionLabel}</Link> : null}
      {children}
    </div>
  )
}
