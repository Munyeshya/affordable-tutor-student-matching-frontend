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
    lessons: '/tutors/lessons/',
    ratings: '/tutors/ratings/',
  },
  students: {
    list: '/students/',
    detail: (id) => `/students/${id}/`,
    bookings: '/students/bookings/',
  },
  reports: {
    admin: '/analytics/report/',
    mine: '/analytics/my-report/',
  },
}


