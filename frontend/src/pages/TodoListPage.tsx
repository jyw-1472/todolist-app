import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Spinner } from '../components/Spinner'
import { TodoFilter } from '../features/todo/components/TodoFilter'
import { TodoCalendar } from '../features/todo/components/TodoCalendar'
import { TodoList } from '../features/todo/components/TodoList'
import { TodoForm } from '../features/todo/components/TodoForm'
import { useTodoList } from '../features/todo/hooks/useTodoList'
import { useTodoFilter } from '../features/todo/hooks/useTodoFilter'
import { useCalendar } from '../features/todo/hooks/useCalendar'
import { useCreateTodo, useUpdateTodo, useDeleteTodo, useToggleTodoComplete } from '../features/todo/hooks/useTodoMutations'
import { useCategoryList } from '../features/category/hooks/useCategoryList'
import { useLogout } from '../features/auth/hooks/useAuth'
import type { Todo } from '../features/todo/types/todo.types'
import type { CreateTodoRequest, UpdateTodoRequest } from '../features/todo/types/todo.types'

type Locale = 'ko' | 'en'
type Theme = 'light' | 'dark'

const translations = {
  ko: {
    appName: 'TodoList',
    calendarTitle: '일정 캘린더',
    list: '목록',
    addTodo: '할일 추가',
    today: '오늘',
    todayTodos: '오늘 할일',
    incomplete: '미완료',
    completed: '완료',
    weeklySchedule: '이번 주 일정',
    selectedDate: '선택한 날짜',
    recentTodos: '최근 등록한 할일',
    categoryStats: '카테고리별 통계',
    completionRate: '완료율',
    save: '저장',
    cancel: '취소',
    edit: '수정',
    delete: '삭제',
    logout: '로그아웃',
    noTodos: '등록된 할일이 없습니다',
    noTodosGuide: '오른쪽 빠른 추가에서 오늘 할일을 등록해보세요.',
    quickAdd: '빠른 추가',
    title: '제목',
    description: '내용',
    category: '카테고리',
    startDate: '시작일',
    dueDate: '종료일',
    optional: '선택',
    select: '선택',
    all: '전체',
    status: '완료 여부',
    uncategorized: '카테고리 없음',
    dashboardSubtitle: '캘린더, 오늘 할일, 통계와 진행률을 한 화면에서 관리합니다.',
    selectedDateTodos: '선택한 날짜의 할일',
    noSelectedDateTodos: '이 날짜에 등록된 할일이 없습니다.',
    titlePlaceholder: '할일 제목 입력',
    categoryRequired: '카테고리를 선택해주세요.',
    titleRequired: '제목은 필수입니다.',
    pastDateWarning: '오늘 이후 날짜를 권장합니다.',
    noCategories: '카테고리를 먼저 생성해주세요.',
    more: (count: number) => `+${count}개 더보기`,
    previousMonth: '이전 달',
    nextMonth: '다음 달',
    themeLight: '라이트',
    themeDark: '다크',
    language: '언어',
    create: '등록',
    deleteConfirmTitle: '할일 삭제',
    deleteConfirm: '정말 삭제하시겠습니까?',
    deleteConfirmDesc: '선택한 항목은 영구 삭제됩니다.',
    items: '개',
  },
  en: {
    appName: 'TodoList',
    calendarTitle: 'Schedule Calendar',
    list: 'List',
    addTodo: 'Add todo',
    today: 'Today',
    todayTodos: "Today's todos",
    incomplete: 'Incomplete',
    completed: 'Completed',
    weeklySchedule: 'This week',
    selectedDate: 'Selected date',
    recentTodos: 'Recently added',
    categoryStats: 'Category stats',
    completionRate: 'Completion rate',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    logout: 'Logout',
    noTodos: 'No todos registered',
    noTodosGuide: 'Add your first todo from quick add.',
    quickAdd: 'Quick add',
    title: 'Title',
    description: 'Description',
    category: 'Category',
    startDate: 'Start date',
    dueDate: 'Due date',
    optional: 'optional',
    select: 'Select',
    all: 'All',
    status: 'Status',
    uncategorized: 'Uncategorized',
    dashboardSubtitle: 'Manage calendar, today, stats, and progress in one dashboard.',
    selectedDateTodos: 'Todos on selected date',
    noSelectedDateTodos: 'There are no todos for this date.',
    titlePlaceholder: 'Enter a todo title',
    categoryRequired: 'Please select a category.',
    titleRequired: 'Title is required.',
    pastDateWarning: 'A future date is recommended.',
    noCategories: 'Create a category first.',
    more: (count: number) => `+${count} more`,
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    create: 'Create',
    deleteConfirmTitle: 'Delete todo',
    deleteConfirm: 'Delete this todo?',
    deleteConfirmDesc: 'The selected item will be permanently deleted.',
    items: 'items',
  },
} as const

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekRange(date = new Date()) {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function dateInRange(dateString: string | null | undefined, start: Date, end: Date): boolean {
  if (!dateString) return false
  const date = new Date(`${dateString}T00:00:00`)
  return date >= start && date <= end
}

function getTodoDate(todo: Todo): string {
  return todo.due_date ?? todo.start_date ?? todo.created_at.slice(0, 10)
}

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; todo: Todo }
  | { type: 'delete'; todo: Todo }

export function TodoListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [quickTitle, setQuickTitle] = useState('')
  const [quickDate, setQuickDate] = useState(searchParams.get('date') ?? getTodayString())
  const [quickCategoryId, setQuickCategoryId] = useState('')
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem('todo-locale')
    return stored === 'en' || stored === 'ko' ? stored : 'ko'
  })
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('todo-theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const t = translations[locale]
  const { filter, filterError, setFilter } = useTodoFilter()
  const calendar = useCalendar()
  const { data: todos = [], isLoading: todosLoading } = useTodoList()
  const { data: filteredTodos = [], isLoading: filteredTodosLoading } = useTodoList(filterError ? undefined : filter)
  const { data: categories = [] } = useCategoryList()

  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const toggleComplete = useToggleTodoComplete()
  const { mutate: logout } = useLogout()

  const queryDate = searchParams.get('date')
  const [selectedDate, setSelectedDate] = useState<string>(queryDate ?? getTodayString())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('todo-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('todo-locale', locale)
  }, [locale])

  useEffect(() => {
    setQuickDate(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    if (!quickCategoryId && categories[0]) {
      setQuickCategoryId(String(categories[0].category_id))
    }
  }, [categories, quickCategoryId])

  const today = getTodayString()
  const weekRange = useMemo(() => getWeekRange(), [])

  const selectedDateTodos = useMemo(() => {
    return todos.filter((todo) => todo.due_date === selectedDate || todo.start_date === selectedDate)
  }, [todos, selectedDate])

  const todayTodos = useMemo(() => {
    return todos.filter((todo) => todo.due_date === today || todo.start_date === today)
  }, [todos, today])

  const stats = useMemo(() => {
    const completed = todos.filter((todo) => todo.is_completed).length
    const incomplete = todos.length - completed
    const weekly = todos.filter((todo) =>
      dateInRange(todo.start_date, weekRange.start, weekRange.end) ||
      dateInRange(todo.due_date, weekRange.start, weekRange.end)
    ).length
    return {
      today: todayTodos.length,
      completed,
      incomplete,
      weekly,
      completionRate: todos.length === 0 ? 0 : Math.round((completed / todos.length) * 100),
    }
  }, [todos, todayTodos.length, weekRange.end, weekRange.start])

  const recentTodos = useMemo(() => {
    return [...todos]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [todos])

  const categoryStats = useMemo(() => {
    return categories
      .map((category) => ({
        category,
        count: todos.filter((todo) => todo.category_id === category.category_id).length,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [categories, todos])

  function handleDateSelect(date: string) {
    setSelectedDate(date)
    setSearchParams({ date }, { replace: true })
  }

  function closeModal() {
    setModal({ type: 'none' })
  }

  function handleCreate(data: CreateTodoRequest | UpdateTodoRequest) {
    createTodo.mutate(data as CreateTodoRequest, { onSuccess: closeModal })
  }

  function handleUpdate(data: CreateTodoRequest | UpdateTodoRequest) {
    if (modal.type !== 'edit') return
    updateTodo.mutate(
      { todoId: modal.todo.todo_id, data: data as UpdateTodoRequest },
      { onSuccess: closeModal }
    )
  }

  function handleDelete() {
    if (modal.type !== 'delete') return
    deleteTodo.mutate(modal.todo.todo_id, { onSuccess: closeModal })
  }

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickTitle.trim() || !quickCategoryId) return

    createTodo.mutate(
      {
        title: quickTitle.trim(),
        category_id: Number(quickCategoryId),
        start_date: quickDate,
        due_date: quickDate,
      },
      {
        onSuccess: () => {
          setQuickTitle('')
          handleDateSelect(quickDate)
        },
      }
    )
  }

  const listLabels = {
    emptyTitle: t.noTodos,
    emptyDescription: t.noTodosGuide,
    addTodo: t.addTodo,
    category: t.category,
    startDate: t.startDate,
    dueDate: t.dueDate,
    edit: t.edit,
    delete: t.delete,
    completed: t.completed,
    incomplete: t.incomplete,
    uncategorized: t.uncategorized,
  }

  const formLabels = {
    title: t.title,
    description: t.description,
    startDate: t.startDate,
    dueDate: t.dueDate,
    category: t.category,
    completed: t.completed,
    optional: t.optional,
    select: t.select,
    save: t.save,
    create: t.create,
    cancel: t.cancel,
    titleRequired: t.titleRequired,
    categoryRequired: t.categoryRequired,
    pastDateWarning: t.pastDateWarning,
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-block">
            <span className="brand-title">{t.appName}</span>
            <span className="brand-subtitle">{t.dashboardSubtitle}</span>
          </div>
          <div className="topbar-actions">
            <select
              className="select-input"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              aria-label={t.language}
              style={{ width: '112px' }}
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? t.themeLight : t.themeDark}
            </Button>
            <Button variant="secondary" onClick={() => logout()}>{t.logout}</Button>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{viewMode === 'calendar' ? t.calendarTitle : t.list}</h1>
            <p className="panel-subtitle">{selectedDate}</p>
          </div>
          <div className="view-tabs">
            <Button
              type="button"
              variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('calendar')}
            >
              {t.calendarTitle}
            </Button>
            <Button
              type="button"
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('list')}
            >
              {t.list}
            </Button>
          </div>
        </div>

        <section className="summary-grid" aria-label="Summary">
          {[
            { label: t.todayTodos, value: stats.today, meta: t.today },
            { label: t.incomplete, value: stats.incomplete, meta: t.noTodosGuide },
            { label: t.completed, value: stats.completed, meta: `${stats.completionRate}%` },
            { label: t.weeklySchedule, value: stats.weekly, meta: t.calendarTitle },
          ].map((card) => (
            <article key={card.label} className="summary-card">
              <span className="summary-label">{card.label}</span>
              <strong className="summary-value">{card.value}</strong>
              <span className="summary-meta">{card.meta}</span>
            </article>
          ))}
        </section>

        {viewMode === 'calendar' ? (
          <div className="main-grid">
            <div className="calendar-column">
              <TodoCalendar
                year={calendar.year}
                month={calendar.month}
                selectedDate={selectedDate}
                todos={todos}
                categories={categories}
                locale={locale}
                labels={{
                  today: t.today,
                  previousMonth: t.previousMonth,
                  nextMonth: t.nextMonth,
                  items: t.items,
                  more: t.more,
                }}
                onPrevMonth={calendar.goToPrevMonth}
                onNextMonth={calendar.goToNextMonth}
                onToday={() => {
                  calendar.goToToday()
                  handleDateSelect(getTodayString())
                }}
                onDateSelect={handleDateSelect}
              />

              <section className="support-grid">
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">{t.recentTodos}</h2>
                  </div>
                  {recentTodos.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-title">{t.noTodos}</div>
                      <p>{t.noTodosGuide}</p>
                    </div>
                  ) : (
                    recentTodos.map((todo) => (
                      <div key={todo.todo_id} className="recent-row">
                        <span style={{ color: todo.is_completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                          {todo.title}
                        </span>
                        <span>{getTodoDate(todo)}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">{t.categoryStats}</h2>
                  </div>
                  {categoryStats.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-title">{t.noTodos}</div>
                      <p>{t.noTodosGuide}</p>
                    </div>
                  ) : (
                    categoryStats.map(({ category, count }) => (
                      <div key={category.category_id} className="category-row">
                        <span>{category.name}</span>
                        <strong>{count}</strong>
                      </div>
                    ))
                  )}
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">{t.completionRate}</h2>
                      <p className="panel-subtitle">{stats.completed}/{todos.length} {t.items}</p>
                    </div>
                    <strong>{stats.completionRate}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${stats.completionRate}%` }} />
                  </div>
                </div>
              </section>
            </div>

            <aside className="side-panel">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">{t.selectedDateTodos}</h2>
                    <p className="panel-subtitle">{selectedDate}</p>
                  </div>
                  <Button type="button" onClick={() => setModal({ type: 'create' })}>
                    + {t.addTodo}
                  </Button>
                </div>
                {todosLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}><Spinner /></div>
                ) : (
                  <TodoList
                    todos={selectedDateTodos}
                    categories={categories}
                    labels={{ ...listLabels, emptyDescription: t.noSelectedDateTodos }}
                    onAdd={() => setModal({ type: 'create' })}
                    onToggleComplete={(id) => toggleComplete.mutate(id)}
                    onEdit={(todo) => setModal({ type: 'edit', todo })}
                    onDelete={(todo) => setModal({ type: 'delete', todo })}
                  />
                )}
              </section>

              <section className="quick-add">
                <div className="panel-header">
                  <h2 className="panel-title">{t.quickAdd}</h2>
                </div>
                <form onSubmit={handleQuickAdd} className="quick-add-form">
                  <div className="form-field">
                    <label className="field-label">{t.title}</label>
                    <input
                      className="text-input"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder={t.titlePlaceholder}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">{t.dueDate}</label>
                    <input
                      className="text-input"
                      type="date"
                      value={quickDate}
                      onChange={(e) => setQuickDate(e.target.value)}
                    />
                  </div>
                  <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">{t.category}</label>
                    <select
                      className="select-input"
                      value={quickCategoryId}
                      onChange={(e) => setQuickCategoryId(e.target.value)}
                    >
                      {categories.length === 0 ? (
                        <option value="">{t.noCategories}</option>
                      ) : (
                        categories.map((cat) => (
                          <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <Button
                    type="submit"
                    isLoading={createTodo.isPending}
                    disabled={!quickTitle.trim() || !quickCategoryId}
                    style={{ gridColumn: '1 / -1' }}
                  >
                    {t.save}
                  </Button>
                </form>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">{t.todayTodos}</h2>
                  <span className="panel-subtitle">{todayTodos.length}</span>
                </div>
                <TodoList
                  todos={todayTodos}
                  categories={categories}
                  labels={listLabels}
                  onAdd={() => setModal({ type: 'create' })}
                  onToggleComplete={(id) => toggleComplete.mutate(id)}
                  onEdit={(todo) => setModal({ type: 'edit', todo })}
                  onDelete={(todo) => setModal({ type: 'delete', todo })}
                />
              </section>
            </aside>
          </div>
        ) : (
          <section>
            <TodoFilter
              categories={categories}
              filter={filter}
              filterError={filterError}
              labels={{
                category: t.category,
                status: t.status,
                all: t.all,
                incomplete: t.incomplete,
                completed: t.completed,
                startDate: t.startDate,
                dueDate: t.dueDate,
              }}
              onFilterChange={setFilter}
            />
            {filteredTodosLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}><Spinner /></div>
            ) : (
              <TodoList
                todos={filteredTodos}
                categories={categories}
                labels={listLabels}
                onAdd={() => setModal({ type: 'create' })}
                onToggleComplete={(id) => toggleComplete.mutate(id)}
                onEdit={(todo) => setModal({ type: 'edit', todo })}
                onDelete={(todo) => setModal({ type: 'delete', todo })}
              />
            )}
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {[
            { to: '/', label: t.calendarTitle },
            { to: '/categories', label: t.category },
            { to: '/profile', label: 'Profile' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className={`nav-link ${to === '/' ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <Modal isOpen={modal.type === 'create'} onClose={closeModal} title={t.addTodo}>
        <TodoForm
          categories={categories}
          initialValues={{ start_date: selectedDate, due_date: selectedDate }}
          labels={formLabels}
          onSubmit={handleCreate}
          isLoading={createTodo.isPending}
          onCancel={closeModal}
        />
      </Modal>

      <Modal isOpen={modal.type === 'edit'} onClose={closeModal} title={t.edit}>
        {modal.type === 'edit' && (
          <TodoForm
            categories={categories}
            initialValues={modal.todo}
            labels={formLabels}
            onSubmit={handleUpdate}
            isLoading={updateTodo.isPending}
            onCancel={closeModal}
          />
        )}
      </Modal>

      <Modal isOpen={modal.type === 'delete'} onClose={closeModal} title={t.deleteConfirmTitle}>
        {modal.type === 'delete' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{t.deleteConfirm}</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {t.deleteConfirmDesc}: "{modal.todo.title}"
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={closeModal} disabled={deleteTodo.isPending}>{t.cancel}</Button>
              <Button variant="danger" isLoading={deleteTodo.isPending} onClick={handleDelete}>{t.delete}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
