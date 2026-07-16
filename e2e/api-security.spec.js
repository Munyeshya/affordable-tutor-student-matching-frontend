import { expect, test } from '@playwright/test'

import { demoAccounts } from './helpers.js'

const apiBaseUrl = 'http://127.0.0.1:8001/api'

async function login(request, account) {
  const response = await request.post(`${apiBaseUrl}/auth/login/`, {
    data: {
      email: account.email,
      password: account.password,
    },
  })
  expect(response.ok()).toBeTruthy()
  return response.json()
}

test('API denies anonymous and wrong-role access', async ({ request }) => {
  const anonymousBookings = await request.get(`${apiBaseUrl}/bookings/`)
  expect(anonymousBookings.status()).toBe(401)

  const studentSession = await login(request, demoAccounts.student)
  const adminUsers = await request.get(`${apiBaseUrl}/admin/users/`, {
    headers: {
      Authorization: `Bearer ${studentSession.access}`,
    },
  })
  expect(adminUsers.status()).toBe(403)
})

test('authentication payloads do not expose passwords or place tokens in URLs', async ({ request }) => {
  const response = await request.post(`${apiBaseUrl}/auth/login/`, {
    data: {
      email: demoAccounts.admin.email,
      password: demoAccounts.admin.password,
    },
  })
  const payload = await response.json()
  const serializedPayload = JSON.stringify(payload).toLowerCase()

  expect(response.ok()).toBeTruthy()
  expect(payload.access).toBeTruthy()
  expect(payload.refresh).toBeTruthy()
  expect(serializedPayload).not.toContain('"password"')
  expect(response.url()).not.toContain(payload.access)
  expect(response.url()).not.toContain(payload.refresh)
})
