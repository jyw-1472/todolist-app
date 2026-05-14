import { TodoItem } from './TodoItem'
import type { Todo } from '../types/todo.types'
import type { Category } from '../../category/types/category.types'

interface TodoListLabels {
  emptyTitle: string
  emptyDescription: string
  addTodo: string
  category: string
  startDate: string
  dueDate: string
  edit: string
  delete: string
  completed: string
  incomplete: string
  uncategorized: string
}

const defaultLabels: TodoListLabels = {
  emptyTitle: 'No todos registered',
  emptyDescription: 'Add your first todo from quick add.',
  addTodo: 'Add todo',
  category: 'Category',
  startDate: 'Start date',
  dueDate: 'Due date',
  edit: 'Edit',
  delete: 'Delete',
  completed: 'Completed',
  incomplete: 'Incomplete',
  uncategorized: 'Uncategorized',
}

interface TodoListProps {
  todos: Todo[]
  categories: Category[]
  labels?: TodoListLabels
  onAdd?: () => void
  onToggleComplete: (todoId: number) => void
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
}

export function TodoList({
  todos,
  categories,
  labels = defaultLabels,
  onAdd,
  onToggleComplete,
  onEdit,
  onDelete,
}: TodoListProps) {
  function getCategoryName(categoryId: number): string {
    return categories.find((c) => c.category_id === categoryId)?.name ?? labels.uncategorized
  }

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-title">{labels.emptyTitle}</div>
        <p>{labels.emptyDescription}</p>
        {onAdd && (
          <button type="button" className="icon-button" style={{ width: 'auto', padding: '0 12px' }} onClick={onAdd}>
            + {labels.addTodo}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="todo-stack">
      {todos.map((todo) => (
        <TodoItem
          key={todo.todo_id}
          todo={todo}
          categoryName={getCategoryName(todo.category_id)}
          labels={labels}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
