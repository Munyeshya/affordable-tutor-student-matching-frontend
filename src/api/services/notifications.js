import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizeListResponse } from '../response'

export function listNotifications(params = {}) {
  return apiClient.get(API_ENDPOINTS.notifications.list, { params }).then(normalizeListResponse)
}

export function getUnreadNotificationCount() {
  return apiClient.get(API_ENDPOINTS.notifications.unread)
}

export function markNotificationRead(id) {
  return apiClient.post(API_ENDPOINTS.notifications.readOne(id))
}

export function markAllNotificationsRead() {
  return apiClient.post(API_ENDPOINTS.notifications.readAll)
}
