import React from 'react'

const iconPaths = {
  account: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0',
  assessments: 'M7 4h10v17H7zM9 4V2h6v2m-5 6h4m-4 4h4',
  audit: 'M6 3h12v18H6zM9 7h6M9 11h6m-6 4h3m5.5 1.5l1.5 1.5 3-3',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  bookings: 'M5 5h14v16H5zM8 3v4m8-4v4M5 10h14',
  close: 'M6 6l12 12M18 6L6 18',
  dashboard: 'M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z',
  courses: 'M4 5h7a3 3 0 013 3v11a3 3 0 00-3-3H4zm16 0h-6a3 3 0 00-3 3v11a3 3 0 013-3h6z',
  disputes: 'M12 3l9 17H3zM12 9v4m0 3h.01',
  documents: 'M6 3h8l4 4v14H6zM14 3v5h4M9 13h6m-6 4h6',
  earnings: 'M4 7h16v12H4zM4 10h16m-4 5h1',
  help: 'M12 22a10 10 0 100-20 10 10 0 000 20zM9.5 9a2.5 2.5 0 115 0c0 2-2.5 2-2.5 4m0 4h.01',
  logout: 'M10 5H5v14h5m4-4l4-3-4-3m4 3H9',
  menu: 'M4 7h16M4 12h16M4 17h16',
  messages: 'M4 5h16v12H8l-4 4z',
  reports: 'M5 20V10m7 10V4m7 16v-7',
  reviews: 'M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  schedule: 'M5 5h14v16H5zM8 3v4m8-4v4M5 10h14m-9 4h4m-4 4h7',
  search: 'M21 21l-4.3-4.3m1.3-5.2a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z',
  site: 'M3 11l9-8 9 8M5 10v10h14V10M9 20v-6h6v6',
  students: 'M8 12a4 4 0 100-8 4 4 0 000 8zm8-1a3 3 0 100-6 3 3 0 000 6zM2 21a6 6 0 0112 0m0 0a5 5 0 018 0',
  verification: 'M12 3l7 3v5c0 5-3.1 9.4-7 11-3.9-1.6-7-6-7-11V6zM9 12l2 2 4-5',
}

export function DashboardIcon({ name, size = 20 }) {
  return (
    <svg
      className="dashboard-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d={iconPaths[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

