import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export function getAdminDashboard() {
  return apiClient.get(API_ENDPOINTS.reports.dashboard)
}

async function openReport(path) {
  const reportWindow = window.open('about:blank', '_blank')

  try {
    const response = await apiClient.get(path, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    if (reportWindow) {
      reportWindow.location.href = url
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return url
  } catch (error) {
    reportWindow?.close()
    throw error
  }
}

export function openMyPrintableReport() {
  return openReport(API_ENDPOINTS.reports.mine)
}

export function openAdminPrintableReport() {
  return openReport(API_ENDPOINTS.reports.admin)
}
