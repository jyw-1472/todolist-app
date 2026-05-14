import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTodo, updateTodo, deleteTodo, toggleTodoComplete } from '../../../api/todo.api'
import { TODOS_QUERY_KEY } from './useTodoList'
import type { CreateTodoRequest, UpdateTodoRequest } from '../types/todo.types'

function useInvalidateTodos() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
}

export function useCreateTodo() {
  const invalidate = useInvalidateTodos()
  return useMutation({
    mutationFn: (data: CreateTodoRequest) => createTodo(data),
    onSuccess: invalidate,
  })
}

export function useUpdateTodo() {
  const invalidate = useInvalidateTodos()
  return useMutation({
    mutationFn: ({ todoId, data }: { todoId: number; data: UpdateTodoRequest }) =>
      updateTodo(todoId, data),
    onSuccess: invalidate,
  })
}

export function useDeleteTodo() {
  const invalidate = useInvalidateTodos()
  return useMutation({
    mutationFn: (todoId: number) => deleteTodo(todoId),
    onSuccess: invalidate,
  })
}

export function useToggleTodoComplete() {
  const invalidate = useInvalidateTodos()
  return useMutation({
    mutationFn: (todoId: number) => toggleTodoComplete(todoId),
    onSuccess: invalidate,
  })
}
