import { useMemo } from 'react'
import type { Todo } from '../types/todo.types'
import type { Category } from '../../category/types/category.types'

interface TodoCalendarProps {
  year: number
  month: number
  selectedDate: string
  todos: Todo[]
  categories: Category[]
  locale: 'ko' | 'en'
  labels: {
    today: string
    previousMonth: string
    nextMonth: string
    items: string
    more: (count: number) => string
  }
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onDateSelect: (date: string) => void
}

const WEEKDAYS = {
  ko: ['일', '월', '화', '수', '목', '금', '토'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}

const CATEGORY_BG_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#0891b2',
  '#16a34a',
  '#ca8a04',
  '#dc2626',
  '#4f46e5',
  '#0f766e',
  '#be123c',
  '#64748b',
]

function getCalendarDates(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const dates: (number | null)[] = []

  for (let i = 0; i < firstDay.getDay(); i += 1) dates.push(null)
  for (let d = 1; d <= lastDay.getDate(); d += 1) dates.push(d)
  while (dates.length % 7 !== 0) dates.push(null)

  return dates
}

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function TodoCalendar({
  year,
  month,
  selectedDate,
  todos,
  categories,
  locale,
  labels,
  onPrevMonth,
  onNextMonth,
  onToday,
  onDateSelect,
}: TodoCalendarProps) {
  const dates = useMemo(() => getCalendarDates(year, month), [year, month])
  const todayStr = getTodayString()

  function getCategoryColor(categoryId: number): string {
    const idx = categories.findIndex((c) => c.category_id === categoryId)
    return CATEGORY_BG_COLORS[idx >= 0 ? idx % CATEGORY_BG_COLORS.length : CATEGORY_BG_COLORS.length - 1]
  }

  function getTodosForDate(dateStr: string): Todo[] {
    return todos.filter((todo) => todo.due_date === dateStr || todo.start_date === dateStr)
  }

  return (
    <section className="calendar-card" aria-label="Todo calendar">
      <div className="calendar-toolbar">
        <div>
          <div className="calendar-title">
            {new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
              year: 'numeric',
              month: 'long',
            }).format(new Date(year, month - 1, 1))}
          </div>
          <div className="panel-subtitle">
            {todos.length} {labels.items}
          </div>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={onPrevMonth} aria-label={labels.previousMonth}>
            {'<'}
          </button>
          <button className="icon-button" type="button" onClick={onToday}>
            {labels.today}
          </button>
          <button className="icon-button" type="button" onClick={onNextMonth} aria-label={labels.nextMonth}>
            {'>'}
          </button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS[locale].map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {dates.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="calendar-day empty" aria-hidden="true" />
          }

          const dateStr = formatDate(year, month, day)
          const dayTodos = getTodosForDate(dateStr)
          const visibleTodos = dayTodos.slice(0, 3)
          const hiddenCount = dayTodos.length - visibleTodos.length

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onDateSelect(dateStr)}
              className={[
                'calendar-day',
                dateStr === selectedDate ? 'selected' : '',
              ].join(' ')}
              aria-pressed={dateStr === selectedDate}
            >
              <span className="calendar-day-header">
                <span className={['date-number', dateStr === todayStr ? 'today' : ''].join(' ')}>
                  {day}
                </span>
                {dayTodos.length > 0 && <span className="panel-subtitle">{dayTodos.length}</span>}
              </span>

              {visibleTodos.map((todo) => (
                <span
                  key={todo.todo_id}
                  className={['calendar-chip', todo.is_completed ? 'done' : ''].join(' ')}
                  title={todo.title}
                  style={{ backgroundColor: getCategoryColor(todo.category_id) }}
                >
                  {todo.title}
                </span>
              ))}
              {hiddenCount > 0 && <span className="more-chip">{labels.more(hiddenCount)}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
