import React, { useEffect, useState } from 'react'
import './UserAvatar.css'

export function getInitials(name, fallback = 'IS') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fallback
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function UserAvatar({
  src,
  name,
  alt,
  className = '',
  fallback = 'IS',
  loading = 'lazy',
}) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [src])

  return (
    <span className={`user-avatar ${className}`.trim()}>
      {src && !imageFailed ? (
        <img
          src={src}
          alt={alt ?? `${name || 'User'} profile`}
          loading={loading}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{getInitials(name, fallback)}</span>
      )}
    </span>
  )
}
