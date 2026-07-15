import React from 'react'

function visiblePages(currentPage, totalPages) {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export function Pagination({ currentPage, totalPages, onPageChange, disabled, hasPrevious, hasNext, className = '' }) {
  if (totalPages <= 1) return null

  return (
    <nav className={'ui-pagination ' + className} aria-label="Result pages">
      <button type="button" disabled={!hasPrevious || disabled} onClick={() => onPageChange(Math.max(1, currentPage - 1))}>Previous</button>
      {visiblePages(currentPage, totalPages).map((page) => (
        <button key={page} type="button" className={page === currentPage ? 'active' : ''} aria-current={page === currentPage ? 'page' : undefined} disabled={disabled} onClick={() => onPageChange(page)}>{page}</button>
      ))}
      <button type="button" disabled={!hasNext || disabled} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}>Next</button>
    </nav>
  )
}
