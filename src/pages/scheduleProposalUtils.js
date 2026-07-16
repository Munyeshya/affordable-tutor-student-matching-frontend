export function buildRecurringSessions(recurring) {
  const [startYear, startMonth, startDay] = recurring.startDate.split('-').map(Number)
  const [endYear, endMonth, endDay] = recurring.endDate.split('-').map(Number)
  const [hour, minute] = recurring.startTime.split(':').map(Number)
  const startDate = new Date(startYear, startMonth - 1, startDay)
  const endDate = new Date(endYear, endMonth - 1, endDay)
  const selectedWeekdays = new Set(recurring.weekdays.map(Number))
  const sessions = []

  if (
    Number.isNaN(startDate.getTime())
    || Number.isNaN(endDate.getTime())
    || endDate < startDate
    || !selectedWeekdays.size
  ) {
    return []
  }

  for (const date = new Date(startDate); date <= endDate && sessions.length < 61; date.setDate(date.getDate() + 1)) {
    if (!selectedWeekdays.has(date.getDay())) continue
    const start = new Date(date)
    start.setHours(hour, minute, 0, 0)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + Number(recurring.durationMinutes || 0))
    sessions.push({
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
    })
  }

  return sessions
}
