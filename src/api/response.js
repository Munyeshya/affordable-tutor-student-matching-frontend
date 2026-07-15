export const EMPTY_PAGE = Object.freeze({
  count: 0,
  next: null,
  previous: null,
  results: [],
})

export function unwrapResponse(responseOrData) {
  if (
    responseOrData
    && typeof responseOrData === 'object'
    && Object.prototype.hasOwnProperty.call(responseOrData, 'data')
  ) {
    return responseOrData.data
  }

  return responseOrData
}

export function extractListData(responseOrData) {
  const data = unwrapResponse(responseOrData)
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export function normalizePaginatedData(responseOrData) {
  const data = unwrapResponse(responseOrData)
  const results = extractListData(data)
  const parsedCount = Number(data?.count)

  return {
    ...(data && !Array.isArray(data) && typeof data === 'object' ? data : {}),
    count: Number.isFinite(parsedCount) ? parsedCount : results.length,
    next: data && !Array.isArray(data) ? data.next ?? null : null,
    previous: data && !Array.isArray(data) ? data.previous ?? null : null,
    results,
  }
}

export function normalizeListResponse(response) {
  return {
    ...response,
    data: extractListData(response),
  }
}

export function normalizePaginatedResponse(response) {
  return {
    ...response,
    data: normalizePaginatedData(response),
  }
}
