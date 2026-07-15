const STATUS_MESSAGES = {
  401: 'Your session has expired or your sign-in details are not valid. Please sign in again.',
  403: 'Your account is not allowed to perform this action. Check your role or account approval status.',
  404: 'The requested information could not be found. It may have been removed or is no longer available.',
  409: 'This action conflicts with the current record. Refresh the page and check its latest status.',
  429: 'Too many requests were sent. Please wait a moment before trying again.',
}

const FRIENDLY_MESSAGES = {
  'No active account found with the given credentials': 'The email address or password is incorrect.',
  'Authentication credentials were not provided.': 'Please sign in to continue.',
  'Given token not valid for any token type': 'Your session has expired. Please sign in again.',
  'Invalid input.': 'Some information is missing or invalid. Review the form and try again.',
}

function humanizeField(field) {
  return String(field).replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function friendlyMessage(value) {
  const message = String(value || '').trim()
  return FRIENDLY_MESSAGES[message] || message
}

function extractValidationMessage(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ''
  if (data.detail) return friendlyMessage(data.detail)
  if (data.message) return friendlyMessage(data.message)

  const general = data.non_field_errors
  if (Array.isArray(general) && general[0]) return friendlyMessage(general[0])

  for (const [field, value] of Object.entries(data)) {
    if (Array.isArray(value) && value[0]) {
      return `${humanizeField(field)}: ${friendlyMessage(value[0])}`
    }
    if (typeof value === 'string' && value.trim()) {
      return `${humanizeField(field)}: ${friendlyMessage(value)}`
    }
    if (value && typeof value === 'object') {
      const nested = extractValidationMessage(value)
      if (nested) return `${humanizeField(field)}: ${nested}`
    }
  }

  return ''
}

export function getApiErrorMessage(error, fallback = 'We could not complete this action. Please try again.') {
  if (error?.code === 'ECONNABORTED') {
    return 'The request took too long. Check your connection and try again.'
  }
  if (error?.code === 'ERR_NETWORK' || (!error?.response && error?.request)) {
    return 'The server could not be reached. Check your internet connection and confirm the Isomo service is running.'
  }

  const status = error?.response?.status
  const data = error?.response?.data
  if (typeof data === 'string' && data.trim()) return friendlyMessage(data)

  const validationMessage = extractValidationMessage(data)
  if (validationMessage) return validationMessage
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status]
  if (status >= 500) return 'The server encountered a problem. Please try again shortly. If it continues, contact support.'

  return friendlyMessage(error?.message) || fallback
}
