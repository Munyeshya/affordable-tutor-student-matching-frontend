export const EDITABLE_COURSE_STATUSES = new Set(['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'])

export function isCourseEditable(status) {
  return EDITABLE_COURSE_STATUSES.has(status)
}

export function formatCourseStatus(value) {
  return String(value || 'Unknown')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function courseCompletion(course) {
  const checks = {
    details: Boolean(
      course?.title
      && course?.subject
      && course?.academic_level
      && String(course?.description || '').trim().length >= 20
    ),
    curriculum: Boolean(course?.lessons?.length),
    assessments: Boolean(course?.assessment_readiness?.is_ready),
  }
  const completed = Object.values(checks).filter(Boolean).length

  return {
    ...checks,
    completed,
    percent: Math.round((completed / 3) * 100),
  }
}
