import { describe, expect, it } from 'vitest'

import { extractListData, normalizePaginatedData, unwrapResponse } from './response.js'

describe('API response normalization', () => {
  it('unwraps Axios responses and accepts plain data', () => {
    expect(unwrapResponse({ data: { id: 4 } })).toEqual({ id: 4 })
    expect(unwrapResponse({ id: 4 })).toEqual({ id: 4 })
  })

  it('extracts lists from arrays and paginated responses', () => {
    expect(extractListData([{ id: 1 }])).toEqual([{ id: 1 }])
    expect(extractListData({ data: { results: [{ id: 2 }] } })).toEqual([{ id: 2 }])
    expect(extractListData({ unexpected: true })).toEqual([])
  })

  it('normalizes pagination metadata with safe defaults', () => {
    expect(normalizePaginatedData({
      data: {
        count: '23',
        next: '/api/items/?page=2',
        results: [{ id: 1 }],
      },
    })).toEqual({
      count: 23,
      next: '/api/items/?page=2',
      previous: null,
      results: [{ id: 1 }],
    })
  })
})
