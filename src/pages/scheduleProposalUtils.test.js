import { describe, expect, it } from 'vitest'

import { buildRecurringSessions } from './scheduleProposalUtils.js'

describe('buildRecurringSessions', () => {
  it('expands selected weekdays into a consistent recurring schedule', () => {
    const sessions = buildRecurringSessions({
      startDate: '2030-01-01',
      endDate: '2030-01-14',
      weekdays: [1, 3],
      startTime: '16:00',
      durationMinutes: 60,
    })

    expect(sessions).toHaveLength(4)
    expect(sessions.every((session) => (
      new Date(session.end_datetime) - new Date(session.start_datetime) === 3600000
    ))).toBe(true)
    expect(sessions.map((session) => new Date(session.start_datetime).getDay())).toEqual([3, 1, 3, 1])
  })

  it('returns no sessions for an invalid date range', () => {
    expect(buildRecurringSessions({
      startDate: '2030-02-10',
      endDate: '2030-02-01',
      weekdays: [1],
      startTime: '16:00',
      durationMinutes: 60,
    })).toEqual([])
  })
})
