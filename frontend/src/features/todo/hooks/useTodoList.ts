import { useQuery } from '@tanstack/react-query'
import { getTodos } from '../../../api/todo.api'
import type { TodoFilter } from '../types/todo.types'

export const TODOS_QUERY_KEY = ['todos'] as const

export function useTodoList(filter?: TodoFilter) {
  return useQuery({
    queryKey: [...TODOS_QUERY_KEY, filter] as const,
    queryFn: () => getTodos(filter),
  })
}
