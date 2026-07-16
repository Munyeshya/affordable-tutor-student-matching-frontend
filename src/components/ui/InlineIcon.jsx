import React from 'react'

const iconPaths = {
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  book: 'M5 4h6a3 3 0 013 3v13a3 3 0 00-3-3H5zm14 0h-5a3 3 0 00-3 3v13a3 3 0 013-3h5z',
  calendar: 'M5 5h14v16H5zM8 3v4m8-4v4M5 10h14',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-13v5l3 2',
  close: 'M6 6l12 12M18 6L6 18',
  filter: 'M4 6h16M7 12h10m-7 6h4',
  location: 'M12 21s6-5.4 6-11a6 6 0 10-12 0c0 5.6 6 11 6 11zm0-8a3 3 0 100-6 3 3 0 000 6z',
  money: 'M4 7h16v12H4zM4 10h16m8 5h4',
  star: 'M12 3.5l2.7 5.4 6 .9-4.35 4.2 1.03 6-5.38-2.85L6.62 20l1.03-6L3.3 9.8l6-.9z',
  teaching: 'M4 6h16v11H4zM8 21h8m-4-4v4',
  trash: 'M4 7h16m-9 4v6m4-6v6M8 7l1-3h6l1 3m2 0-1 14H7L6 7',
  verified: 'M12 3l7 3v5c0 5-3.1 9.4-7 11-3.9-1.6-7-6-7-11V6zm-3 9 2 2 4-5',
}

export function InlineIcon({ name, size = 16, className = '' }) {
  return (
    <svg
      className={`inline-icon${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={iconPaths[name]}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
