import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { normalizePaginatedResponse } from '../response'


export function listAuditEvents(params = {}) {
  return apiClient.get(API_ENDPOINTS.audit.list, { params }).then(normalizePaginatedResponse)
}

export async function downloadAuditEvents(params = {}) {
  const response = await apiClient.get(API_ENDPOINTS.audit.export, {
    params,
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = 'isomo-audit-events.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
