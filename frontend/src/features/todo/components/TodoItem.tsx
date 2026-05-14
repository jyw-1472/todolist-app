import type { Todo } from '../types/todo.types'

interface TodoItemLabels {
  category: string
  startDate: string
  dueDate: string
  edit: string
  delete: string
  completed: string
  incomplete: string
  uncategorized: string
}

const defaultLabels: TodoItemLabels = {
  category: 'Category',
  startDate: 'Start date',
  dueDate: 'Due date',
  edit: 'Edit',
  delete: 'Delete',
  completed: 'Completed',
  incomplete: 'Incomplete',
  uncategorized: 'Uncategorized',
}

interface TodoItemProps {
  todo: Todo
  categoryName: string
  labels?: TodoItemLabels
  onToggleComplete: (todoId: number) => void
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
  isToggling?: boolean
}

export function TodoItem({
  todo,
  categoryName,
  labels = defaultLabels,
  onToggleComplete,
  onEdit,
  onDelete,
  isToggling,
}: TodoItemProps) {
  return (
    <article className={['todo-card', todo.is_completed ? 'completed' : ''].join(' ')}>
      <input
        type="checkbox"
        checked={todo.is_completed}
        onChange={() => onToggleComplete(todo.todo_id)}
        disabled={isToggling}
        aria-label={`${labels.completed}: ${todo.title}`}
        style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
      />

      <div className="todo-content">
        <p className="todo-title">{todo.title}</p>
        <div className="todo-meta">
          <span className="meta-pill">{labels.category}: {categoryName || labels.uncategorized}</span>
          {todo.start_date && <span className="meta-pill">{labels.startDate}: {todo.start_date}</span>}
          {todo.due_date && <span className="meta-pill">{labels.dueDate}: {todo.due_date}</span>}
          <span className="meta-pill">{todo.is_completed ? labels.completed : labels.incomplete}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          className="icon-button"
          style={{ width: 'auto', padding: '0 8px' }}
          onClick={() => onEdit(todo)}
          aria-label={`${labels.edit}: ${todo.title}`}
          title={labels.edit}
        >
          Edit
        </button>
        <button
          type="button"
          className="icon-button danger-button"
          style={{ width: 'auto', padding: '0 8px' }}
          onClick={() => onDelete(todo)}
          aria-label={`${labels.delete}: ${todo.title}`}
          title={labels.delete}
        >
          Del
        </button>
      </div>
    </article>
  )
}
