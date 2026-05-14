import { useState, useCallback } from 'react'

interface UseCalendarReturn {
  year: number
  month: number
  goToPrevMonth: () => void
  goToNextMonth: () => void
  goToToday: () => void
}

export function useCalendar(): UseCalendarReturn {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const goToPrevMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 1) {
        setYear((y) => y - 1)
        return 12
      }
      return m - 1
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 12) {
        setYear((y) => y + 1)
        return 1
      }
      return m + 1
    })
  }, [])

  const goToToday = useCallback(() => {
    const d = new Date()
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }, [])

  return { year, month, goToPrevMonth, goToNextMonth, goToToday }
}
