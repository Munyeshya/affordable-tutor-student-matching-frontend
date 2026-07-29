import { beforeEach, describe, expect, it, vi } from 'vitest'

const axiosMocks = vi.hoisted(() => {
  const client = vi.fn()
  client.interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  }
  return {
    client,
    create: vi.fn(() => client),
    post: vi.fn(),
  }
})

vi.mock('axios', () => ({
  default: {
    create: axiosMocks.create,
    post: axiosMocks.post,
  },
}))

import {
  bootstrapAuthSession,
  clearAuthSession,
  getStoredAccessToken,
  setAuthSession,
} from './client.js'

describe('API authentication refresh coordination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearAuthSession()
  })

  it('uses one rotating refresh request for concurrent application bootstraps', async () => {
    let completeRefresh
    axiosMocks.post.mockReturnValue(new Promise((resolve) => {
      completeRefresh = resolve
    }))
    setAuthSession({ accessToken: null, sessionKey: 'student-tab-session-key-123' })

    const firstBootstrap = bootstrapAuthSession()
    const strictModeBootstrap = bootstrapAuthSession()

    expect(axiosMocks.post).toHaveBeenCalledTimes(1)
    expect(axiosMocks.post.mock.calls[0][2].headers).toEqual({
      'X-Isomo-Session-Key': 'student-tab-session-key-123',
    })

    completeRefresh({ data: { access: 'rotated-access-token' } })

    await expect(firstBootstrap).resolves.toBe('rotated-access-token')
    await expect(strictModeBootstrap).resolves.toBe('rotated-access-token')
    expect(getStoredAccessToken()).toBe('rotated-access-token')
  })
})
