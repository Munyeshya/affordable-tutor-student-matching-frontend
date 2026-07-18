import { describe, expect, it } from 'vitest'

import { dashboardRoleGuides } from './roleGuides.js'

const EXPECTED_ROLES = ['STUDENT', 'PARENT', 'TUTOR', 'ADMIN']

describe('dashboard role guides', () => {
  it('provides a complete, linked workflow for every supported role', () => {
    expect(Object.keys(dashboardRoleGuides)).toEqual(EXPECTED_ROLES)

    EXPECTED_ROLES.forEach((role) => {
      const guide = dashboardRoleGuides[role]
      expect(guide.summary.length).toBeGreaterThan(30)
      expect(guide.actions.length).toBeGreaterThanOrEqual(6)
      expect(guide.limits.length).toBeGreaterThanOrEqual(4)
      expect(guide.tip.length).toBeGreaterThan(20)
      guide.actions.forEach((action) => {
        expect(action.title).toBeTruthy()
        expect(action.description.length).toBeGreaterThan(40)
        expect(action.to).toMatch(/^\//)
        expect(action.linkLabel).toBeTruthy()
      })
    })
  })

  it('documents the latest role-specific workflows', () => {
    expect(dashboardRoleGuides.TUTOR.actions.some((action) => action.to === '/assessments')).toBe(true)
    expect(dashboardRoleGuides.STUDENT.actions.some((action) => action.to === '/learning')).toBe(true)
    expect(dashboardRoleGuides.PARENT.actions.some((action) => action.to === '/payments')).toBe(true)
    expect(dashboardRoleGuides.ADMIN.actions.some((action) => action.to === '/admin/audit')).toBe(true)
  })
})
