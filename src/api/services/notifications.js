import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export function listNotifications(params = {}) {
  return apiClient.get(API_ENDPOINTS.notifications.list, { params })
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
