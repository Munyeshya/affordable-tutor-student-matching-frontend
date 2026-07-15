import React from 'react'

export function FilterBar({ children, className = '', ariaLabel = 'Filters' }) {
  return <section className={'ui-filter-bar ' + className} aria-label={ariaLabel}>{children}</section>
}
