import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizeListResponse } from '../response'

export function listConversationThreads() {
  return apiClient.get(API_ENDPOINTS.chats.threads).then(normalizeListResponse)
}

export function getUnreadChatCount() {
  return apiClient.get(API_ENDPOINTS.chats.unread)
}

export function listBookingMessages(bookingId) {
  return apiClient.get(API_ENDPOINTS.chats.messages(bookingId)).then(normalizeListResponse)
}

export function sendBookingMessage(bookingId, payload) {
  return apiClient.post(API_ENDPOINTS.chats.messages(bookingId), payload)
}

export function markBookingMessagesRead(bookingId, messageIds) {
  return apiClient.post(API_ENDPOINTS.chats.markRead(bookingId), { message_ids: messageIds })
}
