export interface Todo {
  todo_id: number
  user_id: number
  category_id: number
  title: string
  description: string | null
  start_date?: string | null
  due_date: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface TodoFilter {
  category_id?: number
  from?: string
  to?: string
  is_completed?: boolean
}

export interface CreateTodoRequest {
  title: string
  category_id: number
  description?: string
  start_date?: string
  due_date?: string
}

export interface UpdateTodoRequest {
  title?: string
  category_id?: number
  description?: string
  start_date?: string
  due_date?: string
  is_completed?: boolean
}
