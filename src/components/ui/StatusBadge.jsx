import React from 'react'

export function StatusBadge({ children, tone = 'neutral', className = '' }) {
  return <span className={'ui-status-badge ui-status-badge-' + tone + ' ' + className}>{children}</span>
}
