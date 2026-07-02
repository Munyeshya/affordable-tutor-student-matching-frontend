export const API_ENDPOINTS = {
  health: '/health/',
  auth: {
    login: '/auth/login/',
    logout: '/auth/logout/',
    register: '/auth/register/',
    me: '/auth/me/',
    refresh: '/auth/refresh/',
  },
  tutors: {
    list: '/tutors/',
    detail: (id) => `/tutors/${id}/`,
    search: '/tutors/search/',
    dashboard: '/tutors/dashboard/',
    checklist: '/tutors/setup/checklist/',
    completion: '/tutors/me/completion/',
    agreement: '/tutors/agreement/',
    agreementDownload: '/tutors/agreement/download/',
    documents: '/tutors/documents/',
    verifications: '/tutors/verifications/',
    verificationDecision: (id) => `/tutors/verifications/${id}/decide/`,
    lessons: '/tutors/lessons/',
    ratings: '/tutors/ratings/',
  },
  students: {
    list: '/students/',
    detail: (id) => `/students/${id}/`,
    bookings: '/students/bookings/',
  },  parents: {
    dashboard: '/parents/dashboard/',
    profile: '/parents/me/',
    links: '/parents/students/',
  },
  notifications: {
    list: '/notifications/',
    unread: '/notifications/unread/',
    readAll: '/notifications/read-all/',
    readOne: (id) => `/notifications/${id}/read/`,
  },
  chats: {
    unread: '/chats/unread/',
    threads: '/chats/threads/',
    messages: (bookingId) => `/chats/bookings/${bookingId}/messages/`,
    markRead: (bookingId) => `/chats/bookings/${bookingId}/messages/read/`,
  },
  reviews: {
    bookingList: '/reviews/',
    bookingCreate: '/reviews/create/',
    lessonList: '/reviews/lesson/',
    lessonCreate: '/reviews/lesson/create/',
  },
  bookings: {
    list: '/bookings/',
    create: '/bookings/create/',
    action: (id) => `/bookings/${id}/action/`,
    disputes: '/bookings/disputes/',
    disputeCreate: '/bookings/disputes/create/',
  },
  catalog: {
    subjects: '/catalog/subjects/',
    tutorSubjects: '/catalog/tutor-subjects/',
    tutorSubjectDetail: (id) => `/catalog/tutor-subjects/${id}/`,
    myCourses: '/catalog/my-courses/',
    courseCreate: '/catalog/courses/create/',
    courseSubmit: (id) => `/catalog/courses/${id}/submit/`,
    courseDetail: (id) => `/catalog/courses/${id}/`,
    lessons: (courseId) => `/catalog/courses/${courseId}/lessons/`,
    lessonDetail: (id) => `/catalog/lessons/${id}/`,
  },
  reports: {
    admin: '/analytics/report/',
    mine: '/analytics/my-report/',
  },
}






