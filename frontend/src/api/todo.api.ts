import axiosInstance from './axiosInstance'
import type { Todo, TodoFilter, CreateTodoRequest, UpdateTodoRequest } from '../features/todo/types/todo.types'

function buildParams(filter?: TodoFilter): Record<string, string> {
  if (!filter) return {}
  const params: Record<string, string> = {}
  if (filter.category_id !== undefined) params.category_id = String(filter.category_id)
  if (filter.from !== undefined) params.from = filter.from
  if (filter.to !== undefined) params.to = filter.to
  if (filter.is_completed !== undefined) params.is_completed = String(filter.is_completed)
  return params
}

export async function getTodos(filter?: TodoFilter): Promise<Todo[]> {
  const response = await axiosInstance.get<{ data: Todo[] }>('/todos', {
    params: buildParams(filter),
  })
  return response.data.data
}

export async function getTodoById(todoId: number): Promise<Todo> {
  const response = await axiosInstance.get<{ data: Todo }>(`/todos/${todoId}`)
  return response.data.data
}

export async function createTodo(data: CreateTodoRequest): Promise<Todo> {
  const response = await axiosInstance.post<{ data: Todo }>('/todos', data)
  return response.data.data
}

export async function updateTodo(todoId: number, data: UpdateTodoRequest): Promise<Todo> {
  const response = await axiosInstance.patch<{ data: Todo }>(`/todos/${todoId}`, data)
  return response.data.data
}

export async function deleteTodo(todoId: number): Promise<void> {
  await axiosInstance.delete(`/todos/${todoId}`)
}

export async function toggleTodoComplete(todoId: number): Promise<Todo> {
  const response = await axiosInstance.patch<{ data: Todo }>(`/todos/${todoId}/complete`)
  return response.data.data
}
