import { describe, expect, it } from 'vitest'

import {
  getDashboardNavigation,
  getDashboardNavigationPaths,
  getDashboardPageTitle,
} from './dashboardNavigation.js'
import { getRoleHomePath } from './rolePaths.js'

describe('role navigation', () => {
  it.each([
    ['ADMIN', '/admin'],
    ['TUTOR', '/tutor'],
    ['STUDENT', '/student'],
    ['PARENT', '/parent'],
  ])('maps %s to its dashboard', (role, path) => {
    expect(getRoleHomePath(role)).toBe(path)
    expect(getDashboardNavigationPaths(role)).toContain(path)
  })

  it('keeps role-specific actions separated', () => {
    expect(getDashboardNavigationPaths('ADMIN')).toContain('/admin/reviews')
    expect(getDashboardNavigationPaths('ADMIN')).not.toContain('/tutor-earnings')
    expect(getDashboardNavigationPaths('TUTOR')).toContain('/tutor-earnings')
    expect(getDashboardNavigationPaths('STUDENT')).toContain('/assessments')
    expect(getDashboardNavigationPaths('PARENT')).toContain('/parent-students')
  })

  it('returns readable page titles and safe fallbacks', () => {
    expect(getDashboardPageTitle('ADMIN', '/admin/reviews')).toBe('Review moderation')
    expect(getDashboardPageTitle('STUDENT', '/unknown')).toBe('Dashboard')
    expect(getDashboardNavigation('UNKNOWN')).toEqual([])
    expect(getRoleHomePath('UNKNOWN')).toBe('/')
  })
})
