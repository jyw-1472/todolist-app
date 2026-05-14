import { useState } from 'react'
import type { TodoFilter } from '../types/todo.types'

interface UseTodoFilterReturn {
  filter: TodoFilter
  filterError: string | null
  setFilter: (partial: Partial<TodoFilter>) => void
  resetFilter: () => void
}

export function useTodoFilter(): UseTodoFilterReturn {
  const [filter, setFilterState] = useState<TodoFilter>({})

  function setFilter(partial: Partial<TodoFilter>) {
    setFilterState((prev) => {
      const next = { ...prev, ...partial }
      return next
    })
  }

  function resetFilter() {
    setFilterState({})
  }

  const filterError =
    filter.from && filter.to && filter.from > filter.to
      ? '시작일이 종료일보다 늦을 수 없습니다.'
      : null

  return { filter, filterError, setFilter, resetFilter }
}
