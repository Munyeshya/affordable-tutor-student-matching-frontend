import { toPlainFormattedText } from '../../components/ui/formattedText.js'

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
  const descriptionLength = toPlainFormattedText(course?.description).length
  const detailRequirements = [
    { complete: Boolean(String(course?.title || '').trim()), label: 'course title' },
    { complete: Boolean(course?.subject), label: 'teaching subject' },
    { complete: Boolean(String(course?.academic_level || '').trim()), label: 'academic level' },
    {
      complete: descriptionLength >= 20,
      label: `course description (${descriptionLength}/20 visible characters)`,
    },
  ]
  const missingDetails = detailRequirements
    .filter((requirement) => !requirement.complete)
    .map((requirement) => requirement.label)
  const checks = {
    details: detailRequirements.every((requirement) => requirement.complete),
    curriculum: Boolean(course?.lessons?.length),
    assessments: Boolean(course?.assessment_readiness?.is_ready),
  }
  const completed = Object.values(checks).filter(Boolean).length

  return {
    ...checks,
    descriptionLength,
    missingDetails,
    completed,
    percent: Math.round((completed / 3) * 100),
  }
}
