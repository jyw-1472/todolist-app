import { useState } from 'react'
import { Input } from '../../../components/Input'
import { Button } from '../../../components/Button'
import { isPastDate } from '../../../utils/date'
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types/todo.types'
import type { Category } from '../../category/types/category.types'

interface TodoFormLabels {
  title: string
  description: string
  startDate: string
  dueDate: string
  category: string
  completed: string
  optional: string
  select: string
  save: string
  create: string
  cancel: string
  titleRequired: string
  categoryRequired: string
  pastDateWarning: string
}

const defaultLabels: TodoFormLabels = {
  title: 'Title',
  description: 'Description',
  startDate: 'Start date',
  dueDate: 'Due date',
  category: 'Category',
  completed: 'Completed',
  optional: 'optional',
  select: 'Select',
  save: 'Save',
  create: 'Create',
  cancel: 'Cancel',
  titleRequired: 'Title is required.',
  categoryRequired: 'Please select a category.',
  pastDateWarning: 'A future date is recommended.',
}

interface TodoFormProps {
  categories: Category[]
  initialValues?: Partial<Todo>
  labels?: TodoFormLabels
  onSubmit: (data: CreateTodoRequest | UpdateTodoRequest) => void
  isLoading: boolean
  onCancel: () => void
}

interface FieldErrors {
  title?: string
  category_id?: string
}

export function TodoForm({ categories, initialValues, labels = defaultLabels, onSubmit, isLoading, onCancel }: TodoFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [startDate, setStartDate] = useState(initialValues?.start_date ?? '')
  const [dueDate, setDueDate] = useState(initialValues?.due_date ?? '')
  const [isCompleted, setIsCompleted] = useState(initialValues?.is_completed ?? false)
  const [categoryId, setCategoryId] = useState<string>(
    initialValues?.category_id ? String(initialValues.category_id) : ''
  )
  const [errors, setErrors] = useState<FieldErrors>({})

  const showPastDateWarning = dueDate !== '' && isPastDate(dueDate)

  function validate(): boolean {
    const nextErrors: FieldErrors = {}
    if (!title.trim()) nextErrors.title = labels.titleRequired
    if (!categoryId) nextErrors.category_id = labels.categoryRequired
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const data: CreateTodoRequest | UpdateTodoRequest = {
      title: title.trim(),
      category_id: Number(categoryId),
      description: description.trim() || undefined,
      start_date: startDate || undefined,
      due_date: dueDate || undefined,
      ...(initialValues?.todo_id !== undefined ? { is_completed: isCompleted } : {}),
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input
        label={`${labels.title} *`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        placeholder={labels.title}
      />

      <div className="form-field">
        <label className="field-label">{labels.description} ({labels.optional})</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={labels.description}
          rows={3}
          className="textarea-input"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
        <div className="form-field">
          <label className="field-label">{labels.startDate} ({labels.optional})</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-input"
            aria-label={labels.startDate}
          />
        </div>
        <div className="form-field">
          <label className="field-label">{labels.dueDate} ({labels.optional})</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-input"
            aria-label={labels.dueDate}
          />
          {showPastDateWarning && (
            <span role="note" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>
              {labels.pastDateWarning}
            </span>
          )}
        </div>
      </div>

      <div className="form-field">
        <label className="field-label">{labels.category} *</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="select-input"
          style={{ borderColor: errors.category_id ? 'var(--color-danger)' : undefined }}
          aria-label={labels.category}
          aria-invalid={!!errors.category_id}
        >
          <option value="">{labels.select}</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
          ))}
        </select>
        {errors.category_id && (
          <span role="alert" style={{ fontSize: '12px', color: 'var(--color-danger)' }}>
            {errors.category_id}
          </span>
        )}
      </div>

      {initialValues?.todo_id !== undefined && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => setIsCompleted(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span>{labels.completed}</span>
        </label>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {labels.cancel}
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialValues?.todo_id ? labels.save : labels.create}
        </Button>
      </div>
    </form>
  )
}
