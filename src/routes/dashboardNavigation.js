const navigationByRole = {
  ADMIN: [
    {
      label: 'Main',
      items: [
        { label: 'Overview', to: '/admin', icon: 'dashboard', end: true },
      ],
    },
    {
      label: 'Management',
      items: [
        { label: 'User management', to: '/admin/users', icon: 'students' },
        { label: 'Tutor verification', to: '/admin/tutor-reviews', icon: 'verification' },
        { label: 'Course moderation', to: '/admin/courses', icon: 'courses' },
        { label: 'Review moderation', to: '/admin/reviews', icon: 'reviews' },
        { label: 'Disputes', to: '/admin/disputes', icon: 'disputes' },
        { label: 'Payouts', to: '/admin/payouts', icon: 'earnings' },
        { label: 'Reports', to: '/reports', icon: 'reports' },
        { label: 'Audit trail', to: '/admin/audit', icon: 'audit' },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Account settings', to: '/account', icon: 'account' },
      ],
    },
  ],
  TUTOR: [
    {
      label: 'Main',
      items: [
        { label: 'Overview', to: '/tutor', icon: 'dashboard', end: true },
      ],
    },
    {
      label: 'Teaching',
      items: [
        { label: 'Verification documents', to: '/tutor-documents', icon: 'documents' },
        { label: 'Courses and lessons', to: '/tutor-teaching', icon: 'courses' },
        { label: 'Schedule proposals', to: '/schedule-proposals', icon: 'schedule' },
        { label: 'Bookings', to: '/bookings', icon: 'bookings' },
        { label: 'Earnings', to: '/tutor-earnings', icon: 'earnings' },
        { label: 'Reviews', to: '/reviews', icon: 'reviews' },
      ],
    },
    {
      label: 'Communication',
      items: [
        { label: 'Messages', to: '/messages', icon: 'messages' },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Account settings', to: '/account', icon: 'account' },
      ],
    },
  ],
  STUDENT: [
    {
      label: 'Main',
      items: [
        { label: 'Overview', to: '/student', icon: 'dashboard', end: true },
      ],
    },
    {
      label: 'Learning',
      items: [
        { label: 'Find tutors', to: '/tutors', icon: 'search' },
        { label: 'Schedule proposals', to: '/schedule-proposals', icon: 'schedule' },
        { label: 'Bookings', to: '/bookings', icon: 'bookings' },
        { label: 'Payments', to: '/payments', icon: 'payments' },
        { label: 'Assessments', to: '/assessments', icon: 'assessments' },
        { label: 'Reviews', to: '/reviews', icon: 'reviews' },
      ],
    },
    {
      label: 'Communication',
      items: [
        { label: 'Messages', to: '/messages', icon: 'messages' },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Account settings', to: '/account', icon: 'account' },
      ],
    },
  ],
  PARENT: [
    {
      label: 'Main',
      items: [
        { label: 'Overview', to: '/parent', icon: 'dashboard', end: true },
      ],
    },
    {
      label: 'Family learning',
      items: [
        { label: 'Find tutors', to: '/tutors', icon: 'search' },
        { label: 'Linked students', to: '/parent-students', icon: 'students' },
        { label: 'Schedule proposals', to: '/schedule-proposals', icon: 'schedule' },
        { label: 'Bookings', to: '/bookings', icon: 'bookings' },
        { label: 'Payments', to: '/payments', icon: 'payments' },
        { label: 'Reports', to: '/reports', icon: 'reports' },
      ],
    },
    {
      label: 'Communication',
      items: [
        { label: 'Messages', to: '/messages', icon: 'messages' },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Account settings', to: '/account', icon: 'account' },
      ],
    },
  ],
}

const fallbackTitles = {
  '/notifications': 'Notifications',
  '/tutor-dashboard': 'Overview',
  '/learning': 'Overview',
  '/parent-dashboard': 'Overview',
}

export function getDashboardNavigation(role) {
  return navigationByRole[String(role || '').toUpperCase()] || []
}

export function getDashboardPageTitle(role, pathname) {
  const matchedItem = getDashboardNavigation(role)
    .flatMap((group) => group.items)
    .sort((left, right) => right.to.length - left.to.length)
    .find((item) => item.to === pathname || (!item.end && pathname.startsWith(`${item.to}/`)))

  return matchedItem?.label || fallbackTitles[pathname] || 'Dashboard'
}

export function getDashboardNavigationPaths(role) {
  return getDashboardNavigation(role)
    .flatMap((group) => group.items)
    .map((item) => item.to)
}
