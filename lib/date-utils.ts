export function toLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayLocalDateString() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return toLocalDateString(today)
}
