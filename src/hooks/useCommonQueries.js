import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../api/queryKeys'
import { extractListData, normalizePaginatedData } from '../api/response'
import { listBookings, listScheduleProposals } from '../api/services/bookings'
import { listPublicCourses, listSubjects } from '../api/services/catalog'
import { listLearningLibrary } from '../api/services/payments'
import { listTutors } from '../api/services/tutors'

export function useBookingsQuery(options = {}) {
  return useQuery({
    ...options,
    queryKey: queryKeys.bookings.all,
    queryFn: async () => extractListData(await listBookings()),
  })
}

export function useScheduleProposalsQuery(options = {}) {
  return useQuery({
    ...options,
    queryKey: queryKeys.bookings.proposals,
    queryFn: async () => extractListData(await listScheduleProposals()),
  })
}

export function useLearningLibraryQuery(options = {}) {
  return useQuery({
    ...options,
    queryKey: queryKeys.learning.library,
    queryFn: async () => extractListData(await listLearningLibrary()),
  })
}

export function useSubjectsQuery(options = {}) {
  return useQuery({
    ...options,
    queryKey: queryKeys.catalog.subjects,
    queryFn: async () => extractListData(await listSubjects()),
  })
}

export function usePublicTutorsQuery(params, options = {}) {
  return useQuery({
    ...options,
    queryKey: queryKeys.tutors.publicList(params),
    queryFn: async () => normalizePaginatedData(await listTutors(params)),
  })
}

export function usePublicCoursesQuery(params, options = {}) {
  return useQuery({
    ...options,
    queryKey: queryKeys.catalog.publicCourses(params),
    queryFn: async () => normalizePaginatedData(await listPublicCourses(params)),
  })
}
