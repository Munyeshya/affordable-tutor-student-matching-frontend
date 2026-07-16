import { describe, expect, it } from 'vitest'

import { getApiErrorMessage } from './errors.js'

describe('getApiErrorMessage', () => {
  it('turns nested validation errors into a clear field message', () => {
    const error = {
      response: {
        status: 400,
        data: { profile: { hourly_rate: ['Must be greater than zero.'] } },
      },
    }

    expect(getApiErrorMessage(error)).toBe(
      'Profile: Hourly rate: Must be greater than zero.',
    )
  })

  it('uses friendly messages for authentication failures', () => {
    const error = {
      response: {
        status: 401,
        data: { detail: 'No active account found with the given credentials' },
      },
    }

    expect(getApiErrorMessage(error)).toBe('The email address or password is incorrect.')
  })

  it.each([
    [{ code: 'ECONNABORTED' }, 'The request took too long. Check your connection and try again.'],
    [{ code: 'ERR_NETWORK' }, 'The server could not be reached. Check your internet connection and confirm the Isomo service is running.'],
    [{ response: { status: 403 } }, 'Your account is not allowed to perform this action. Check your role or account approval status.'],
    [{ response: { status: 500 } }, 'The server encountered a problem. Please try again shortly. If it continues, contact support.'],
  ])('returns the expected operational message', (error, expected) => {
    expect(getApiErrorMessage(error)).toBe(expected)
  })
})
