import { describe, expect, it } from 'vitest'

import {
  courseCompletion,
  formatCourseStatus,
  isCourseEditable,
} from './courseHelpers.js'

describe('course teaching helpers', () => {
  it('tracks the three course publishing stages', () => {
    expect(courseCompletion({
      title: 'Algebra foundations',
      subject: 2,
      academic_level: 'Secondary lower',
      description: 'A complete introduction to core algebra skills.',
      lessons: [{ id: 8 }],
      assessment_readiness: { is_ready: true },
    })).toMatchObject({
      details: true,
      curriculum: true,
      assessments: true,
      percent: 100,
    })
  })

  it('keeps submitted and published courses read only', () => {
    expect(isCourseEditable('DRAFT')).toBe(true)
    expect(isCourseEditable('CHANGES_REQUESTED')).toBe(true)
    expect(isCourseEditable('PENDING_REVIEW')).toBe(false)
    expect(isCourseEditable('PUBLISHED')).toBe(false)
  })

  it('formats backend statuses for tutors', () => {
    expect(formatCourseStatus('CHANGES_REQUESTED')).toBe('Changes requested')
  })
})
