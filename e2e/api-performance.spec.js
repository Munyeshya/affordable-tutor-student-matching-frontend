import { expect, test } from '@playwright/test'

import { demoAccounts } from './helpers.js'

const apiBaseUrl = 'http://127.0.0.1:8001/api'

function percentile(values, percentileValue) {
  const sortedValues = [...values].sort((left, right) => left - right)
  const index = Math.min(
    sortedValues.length - 1,
    Math.ceil((percentileValue / 100) * sortedValues.length) - 1,
  )
  return sortedValues[index]
}

async function measureRequests({ iterations, concurrency, requestAction }) {
  const durations = []
  let nextRequest = 0

  async function worker() {
    while (nextRequest < iterations) {
      const requestIndex = nextRequest
      nextRequest += 1
      const startedAt = performance.now()
      const response = await requestAction(requestIndex)
      durations.push(performance.now() - startedAt)
      expect(response.status(), await response.text()).toBeLessThan(400)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return {
    requests: iterations,
    concurrency,
    mean_ms: Number((durations.reduce((sum, duration) => sum + duration, 0) / durations.length).toFixed(1)),
    p50_ms: Number(percentile(durations, 50).toFixed(1)),
    p95_ms: Number(percentile(durations, 95).toFixed(1)),
    max_ms: Number(Math.max(...durations).toFixed(1)),
  }
}

test('core API performance stays within local verification budgets', async ({ request, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'API timing is browser-independent and runs once in Chromium.')

  const authentication = await measureRequests({
    iterations: 4,
    concurrency: 1,
    requestAction: () => request.post(`${apiBaseUrl}/auth/login/`, {
      data: {
        email: demoAccounts.student.email,
        password: demoAccounts.student.password,
      },
    }),
  })

  const sessionResponse = await request.post(`${apiBaseUrl}/auth/login/`, {
    data: {
      email: demoAccounts.student.email,
      password: demoAccounts.student.password,
    },
  })
  const session = await sessionResponse.json()
  const authenticatedHeaders = { Authorization: `Bearer ${session.access}` }

  const tutorSearch = await measureRequests({
    iterations: 20,
    concurrency: 5,
    requestAction: (index) => request.get(
      `${apiBaseUrl}/tutors/?page=1&page_size=9&sort=best_match&q=${index % 2 ? 'Math' : 'Nicolas'}`,
    ),
  })
  const bookings = await measureRequests({
    iterations: 20,
    concurrency: 5,
    requestAction: () => request.get(`${apiBaseUrl}/bookings/`, { headers: authenticatedHeaders }),
  })
  const messaging = await measureRequests({
    iterations: 20,
    concurrency: 5,
    requestAction: () => request.get(`${apiBaseUrl}/chats/threads/`, { headers: authenticatedHeaders }),
  })
  const results = {
    environment: 'Django development ASGI server with SQLite on localhost',
    authentication,
    tutor_search: tutorSearch,
    booking_list: bookings,
    messaging_threads: messaging,
  }

  console.log(`API_PERFORMANCE_RESULTS=${JSON.stringify(results)}`)
  await testInfo.attach('api-performance-results', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  })

  expect(authentication.p95_ms).toBeLessThan(8_000)
  expect(tutorSearch.p95_ms).toBeLessThan(2_000)
  expect(bookings.p95_ms).toBeLessThan(2_000)
  expect(messaging.p95_ms).toBeLessThan(2_000)
})
