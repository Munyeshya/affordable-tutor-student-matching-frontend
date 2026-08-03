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
      price: 1234.56,
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

  it('measures visible description text instead of formatting markup', () => {
    expect(courseCompletion({
      title: 'Algebra foundations',
      subject: 2,
      academic_level: "O'Level",
      price: 5000,
      description: '<h2>Short</h2><p>description</p>',
    })).toMatchObject({
      details: false,
      descriptionLength: 17,
      missingDetails: ['course description (17/20 visible characters)'],
    })
  })

  it('keeps an unpriced course private even when its learning content is complete', () => {
    expect(courseCompletion({
      title: 'Algebra foundations',
      subject: 2,
      academic_level: "O'Level",
      description: 'A complete introduction to core algebra skills.',
      price: 0,
      lessons: [{ id: 8 }],
      assessment_readiness: { is_ready: true },
    })).toMatchObject({
      details: false,
      missingDetails: ['positive course price'],
      percent: 67,
    })
  })

  it('formats backend statuses for tutors', () => {
    expect(formatCourseStatus('CHANGES_REQUESTED')).toBe('Changes requested')
  })
})
