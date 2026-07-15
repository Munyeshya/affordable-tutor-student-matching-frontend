export const queryKeys = {
  admin: {
    all: ['admin'],
    dashboard: ['admin', 'dashboard'],
    disputes: ['admin', 'disputes'],
    tutorVerifications: (status) => (
      status ? ['admin', 'tutor-verifications', { status }] : ['admin', 'tutor-verifications']
    ),
  },
  assessments: {
    all: ['assessments'],
    list: ['assessments', 'list'],
    attempts: ['assessments', 'attempts'],
    confirmations: ['assessments', 'confirmations'],
  },
  bookings: {
    all: ['bookings'],
    tutors: ['bookings', 'tutors'],
    tutorDetail: (id) => ['bookings', 'tutors', id],
  },
  catalog: {
    all: ['catalog'],
    subjects: ['catalog', 'subjects'],
    tutorSubjects: ['catalog', 'tutor-subjects'],
    tutorCourses: ['catalog', 'tutor-courses'],
    courseLessons: (courseId) => ['catalog', 'tutor-courses', courseId, 'lessons'],
    publicCourses: (filters = {}) => ['catalog', 'public-courses', filters],
    publicCoursesRoot: ['catalog', 'public-courses'],
  },
  chats: {
    all: ['chats'],
    threads: ['chats', 'threads'],
    unread: ['chats', 'unread-count'],
    messages: (bookingId) => ['chats', 'messages', bookingId],
  },
  learning: {
    all: ['learning'],
    library: ['learning', 'library'],
    lessonProgress: ['learning', 'lesson-progress'],
    impact: ['learning', 'impact'],
  },
  notifications: {
    all: ['notifications'],
    list: (params = {}) => ['notifications', 'list', params],
    unread: ['notifications', 'unread-count'],
  },
  parents: {
    all: ['parents'],
    dashboard: ['parents', 'dashboard'],
    links: ['parents', 'links'],
  },
  payments: {
    all: ['payments'],
    coursePurchases: ['payments', 'course-purchases'],
    tutorEarnings: ['payments', 'tutor-earnings'],
    tutorPayouts: ['payments', 'tutor-payouts'],
  },
  reviews: {
    all: ['reviews'],
    eligible: ['reviews', 'eligible'],
    bookings: ['reviews', 'bookings'],
    lessons: ['reviews', 'lessons'],
  },
  tutors: {
    all: ['tutors'],
    publicList: (params = {}) => ['tutors', 'public', params],
    detail: (id) => ['tutors', 'detail', id],
    dashboard: ['tutors', 'dashboard'],
    checklist: ['tutors', 'checklist'],
    documents: ['tutors', 'documents'],
    agreement: ['tutors', 'agreement'],
  },
}
