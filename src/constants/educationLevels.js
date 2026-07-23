export const EDUCATION_LEVEL_OPTIONS = [
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'SECONDARY_LOWER', label: "O'Level" },
  { value: 'SECONDARY_UPPER', label: "A'Level" },
  { value: 'UNIVERSITY', label: 'University' },
]

const EDUCATION_LEVEL_LABELS = new Map([
  ...EDUCATION_LEVEL_OPTIONS.map(({ value, label }) => [value, label]),
  ['PRIMARY', 'Primary'],
  ['SECONDARY LOWER LEVEL', "O'Level"],
  ['SECONDARY LOWER', "O'Level"],
  ["O'LEVEL", "O'Level"],
  ['SECONDARY UPPER LEVEL', "A'Level"],
  ['SECONDARY UPPER', "A'Level"],
  ["A'LEVEL", "A'Level"],
  ['UNIVERSITY', 'University'],
])

export function formatEducationLevel(value, fallback = 'All academic levels') {
  if (!value) return fallback

  const normalized = String(value).trim().replaceAll('_', ' ').toUpperCase()
  return EDUCATION_LEVEL_LABELS.get(normalized) || String(value).trim()
}
