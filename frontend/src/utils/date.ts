export function getTodayString(): string {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function formatDate(dateString: string): string {
  const [yyyy, mm, dd] = dateString.split('-')
  return `${yyyy}년 ${mm}월 ${dd}일`
}

export function isPastDate(dateString: string): boolean {
  return dateString < getTodayString()
}

export function isOverdue(dueDateString: string): boolean {
  return dueDateString < getTodayString()
}
