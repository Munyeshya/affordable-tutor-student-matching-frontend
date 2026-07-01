import { getApiBaseUrl } from '../client'
import { API_ENDPOINTS } from '../endpoints'

function openReport(path) {
  const url = `${getApiBaseUrl()}${path}`
  window.open(url, '_blank', 'noopener,noreferrer')
  return url
}

export function openMyPrintableReport() {
  return openReport(API_ENDPOINTS.reports.mine)
}

export function openAdminPrintableReport() {
  return openReport(API_ENDPOINTS.reports.admin)
}
