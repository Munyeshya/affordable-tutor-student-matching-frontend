import { getApiBaseUrl, getStoredAccessToken } from '../client'


function deriveWebSocketBaseUrl() {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL.replace(/\/$/, '')
  }

  const apiUrl = new URL(getApiBaseUrl(), window.location.origin)
  apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  apiUrl.pathname = apiUrl.pathname.replace(/\/api\/?$/, '')
  apiUrl.search = ''
  apiUrl.hash = ''
  return apiUrl.toString().replace(/\/$/, '')
}


export function createBookingChatSocket(bookingId) {
  const token = getStoredAccessToken()
  if (!token) throw new Error('Your sign-in session is unavailable.')
  const url = `${deriveWebSocketBaseUrl()}/ws/chats/bookings/${bookingId}/`
  return new WebSocket(url, ['isomo-chat', `jwt.${token}`])
}
