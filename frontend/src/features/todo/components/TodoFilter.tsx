import { ErrorMessage } from '../../../components/ErrorMessage'
import type { TodoFilter } from '../types/todo.types'
import type { Category } from '../../category/types/category.types'

interface TodoFilterLabels {
  category: string
  status: string
  all: string
  incomplete: string
  completed: string
  startDate: string
  dueDate: string
}

const defaultLabels: TodoFilterLabels = {
  category: 'Category',
  status: 'Status',
  all: 'All',
  incomplete: 'Incomplete',
  completed: 'Completed',
  startDate: 'Start date',
  dueDate: 'Due date',
}

interface TodoFilterProps {
  categories: Category[]
  filter: TodoFilter
  filterError: string | null
  labels?: TodoFilterLabels
  onFilterChange: (partial: Partial<TodoFilter>) => void
}

export function TodoFilter({ categories, filter, filterError, labels = defaultLabels, onFilterChange }: TodoFilterProps) {
  return (
    <div className="panel" style={{ marginBottom: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        <div className="form-field">
          <label className="field-label">{labels.category}</label>
          <select
            value={filter.category_id ?? ''}
            onChange={(e) =>
              onFilterChange({ category_id: e.target.value ? Number(e.target.value) : undefined })
            }
            className="select-input"
            aria-label={labels.category}
          >
            <option value="">{labels.all}</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="field-label">{labels.status}</label>
          <select
            value={filter.is_completed === undefined ? '' : String(filter.is_completed)}
            onChange={(e) =>
              onFilterChange({
                is_completed: e.target.value === '' ? undefined : e.target.value === 'true',
              })
            }
            className="select-input"
            aria-label={labels.status}
          >
            <option value="">{labels.all}</option>
            <option value="false">{labels.incomplete}</option>
            <option value="true">{labels.completed}</option>
          </select>
        </div>

        <div className="form-field">
          <label className="field-label">{labels.startDate}</label>
          <input
            type="date"
            value={filter.from ?? ''}
            onChange={(e) => onFilterChange({ from: e.target.value || undefined })}
            className="text-input"
            aria-label={labels.startDate}
          />
        </div>

        <div className="form-field">
          <label className="field-label">{labels.dueDate}</label>
          <input
            type="date"
            value={filter.to ?? ''}
            onChange={(e) => onFilterChange({ to: e.target.value || undefined })}
            className="text-input"
            aria-label={labels.dueDate}
          />
        </div>
      </div>

      <ErrorMessage message={filterError} />
    </div>
  )
}
