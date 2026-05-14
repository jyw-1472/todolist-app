import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { TodoFilter } from '../features/todo/components/TodoFilter'
import { TodoForm } from '../features/todo/components/TodoForm'
import { TodoItem } from '../features/todo/components/TodoItem'
import { TodoList } from '../features/todo/components/TodoList'

vi.mock('../api/todo.api', () => ({
  getTodos: vi.fn(),
  getTodoById: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  toggleTodoComplete: vi.fn(),
}))

vi.mock('../api/category.api', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

const mockCategories = [
  { category_id: 1, user_id: null, name: '전체', is_default: true },
  { category_id: 2, user_id: null, name: '업무', is_default: false },
  { category_id: 3, user_id: 1, name: '연구', is_default: false },
]

const mockTodo = {
  todo_id: 1,
  user_id: 1,
  category_id: 2,
  title: '팀 미팅 자료 준비',
  description: null,
  start_date: null,
  due_date: '2026-05-14',
  is_completed: false,
  created_at: '2026-05-14T09:00:00.000Z',
  updated_at: '2026-05-14T09:00:00.000Z',
}

const completedTodo = { ...mockTodo, todo_id: 2, is_completed: true, title: '완료된 할일' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

// ─── TodoFilter ───────────────────────────────────────────────────────────────

describe('TodoFilter', () => {
  it('카테고리, 완료여부, 기간 필터가 렌더링된다', () => {
    render(
      <TodoFilter
        categories={mockCategories}
        filter={{}}
        filterError={null}
        onFilterChange={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByRole('combobox', { name: '카테고리 필터' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '완료여부 필터' })).toBeInTheDocument()
    expect(screen.getByLabelText('시작일')).toBeInTheDocument()
    expect(screen.getByLabelText('종료일')).toBeInTheDocument()
  })

  it('카테고리 변경 시 onFilterChange가 호출된다', () => {
    const onFilterChange = vi.fn()
    render(
      <TodoFilter
        categories={mockCategories}
        filter={{}}
        filterError={null}
        onFilterChange={onFilterChange}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.change(screen.getByRole('combobox', { name: '카테고리 필터' }), {
      target: { value: '2' },
    })
    expect(onFilterChange).toHaveBeenCalledWith({ category_id: 2 })
  })

  it('완료여부 필터 변경 시 onFilterChange가 호출된다', () => {
    const onFilterChange = vi.fn()
    render(
      <TodoFilter
        categories={mockCategories}
        filter={{}}
        filterError={null}
        onFilterChange={onFilterChange}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.change(screen.getByRole('combobox', { name: '완료여부 필터' }), {
      target: { value: 'false' },
    })
    expect(onFilterChange).toHaveBeenCalledWith({ is_completed: false })
  })

  it('filterError가 있으면 에러 메시지가 표시된다', () => {
    render(
      <TodoFilter
        categories={mockCategories}
        filter={{ from: '2026-05-31', to: '2026-05-01' }}
        filterError="시작일이 종료일보다 늦을 수 없습니다."
        onFilterChange={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByRole('alert')).toHaveTextContent('시작일이 종료일보다 늦을 수 없습니다.')
  })

  it('카테고리 목록이 옵션으로 표시된다', () => {
    render(
      <TodoFilter
        categories={mockCategories}
        filter={{}}
        filterError={null}
        onFilterChange={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByRole('option', { name: '업무' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '연구' })).toBeInTheDocument()
  })

  it('카테고리 전체 선택 시 undefined로 onFilterChange가 호출된다', () => {
    const onFilterChange = vi.fn()
    render(
      <TodoFilter
        categories={mockCategories}
        filter={{ category_id: 2 }}
        filterError={null}
        onFilterChange={onFilterChange}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.change(screen.getByRole('combobox', { name: '카테고리 필터' }), {
      target: { value: '' },
    })
    expect(onFilterChange).toHaveBeenCalledWith({ category_id: undefined })
  })
})

// ─── TodoForm ─────────────────────────────────────────────────────────────────

describe('TodoForm', () => {
  it('제목, 설명, 종료일, 카테고리 필드가 렌더링된다', () => {
    render(
      <TodoForm
        categories={mockCategories}
        onSubmit={vi.fn()}
        isLoading={false}
        onCancel={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByRole('textbox', { name: /제목/ })).toBeInTheDocument()
    expect(screen.getByLabelText('시작일')).toBeInTheDocument()
    expect(screen.getByLabelText('종료일')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '카테고리' })).toBeInTheDocument()
  })

  it('제목 미입력 시 오류 메시지가 표시된다', async () => {
    render(
      <TodoForm
        categories={mockCategories}
        onSubmit={vi.fn()}
        isLoading={false}
        onCancel={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.click(screen.getByRole('button', { name: '등록' }))
    expect(await screen.findByText('제목은 필수입니다.')).toBeInTheDocument()
  })

  it('카테고리 미선택 시 오류 메시지가 표시된다', async () => {
    render(
      <TodoForm
        categories={mockCategories}
        onSubmit={vi.fn()}
        isLoading={false}
        onCancel={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.change(screen.getByRole('textbox', { name: /제목/ }), {
      target: { value: '테스트 할일' },
    })
    fireEvent.click(screen.getByRole('button', { name: '등록' }))
    expect(await screen.findByText('카테고리를 선택하세요.')).toBeInTheDocument()
  })

  it('유효성 오류 시 onSubmit이 호출되지 않는다', () => {
    const onSubmit = vi.fn()
    render(
      <TodoForm
        categories={mockCategories}
        onSubmit={onSubmit}
        isLoading={false}
        onCancel={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.click(screen.getByRole('button', { name: '등록' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('유효한 입력으로 제출 시 onSubmit이 호출된다', async () => {
    const onSubmit = vi.fn()
    render(
      <TodoForm
        categories={mockCategories}
        onSubmit={onSubmit}
        isLoading={false}
        onCancel={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.change(screen.getByRole('textbox', { name: /제목/ }), {
      target: { value: '새 할일' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: '카테고리' }), {
      target: { value: '2' },
    })
    fireEvent.click(screen.getByRole('button', { name: '등록' }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: '새 할일', category_id: 2 })
    )
  })

  it('initialValues가 있으면 필드에 기존 값이 미리 채워진다', () => {
    render(
      <TodoForm
        categories={mockCategories}
        initialValues={mockTodo}
        onSubmit={vi.fn()}
        isLoading={false}
        onCancel={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByRole('textbox', { name: /제목/ })).toHaveValue('팀 미팅 자료 준비')
    expect(screen.getByLabelText('시작일')).toHaveValue('')
    expect(screen.getByLabelText('종료일')).toHaveValue('2026-05-14')
    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveValue('2')
  })

  it('initialValues가 있으면 저장 버튼이 표시된다', () => {
    render(
      <TodoForm
        categories={mockCategories}
        initialValues={mockTodo}
        onSubmit={vi.fn()}
        isLoading={false}
        onCancel={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('오늘 이전 날짜 입력 시 권장 안내 메시지가 표시된다', () => {
    render(
      <TodoForm
        categories={mockCategories}
        onSubmit={vi.fn()}
        isLoading={false}
        onCancel={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.change(screen.getByLabelText('종료일'), {
      target: { value: '2020-01-01' },
    })
    expect(screen.getByRole('note')).toHaveTextContent('오늘 이후 날짜를 권장합니다.')
  })

  it('과거 날짜 입력 시에도 저장이 가능하다 (onSubmit 호출됨)', async () => {
    const onSubmit = vi.fn()
    render(
      <TodoForm
        categories={mockCategories}
        onSubmit={onSubmit}
        isLoading={false}
        onCancel={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.change(screen.getByRole('textbox', { name: /제목/ }), {
      target: { value: '과거 할일' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: '카테고리' }), {
      target: { value: '2' },
    })
    fireEvent.change(screen.getByLabelText('종료일'), {
      target: { value: '2020-01-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: '등록' }))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('취소 버튼 클릭 시 onCancel이 호출된다', () => {
    const onCancel = vi.fn()
    render(
      <TodoForm
        categories={mockCategories}
        onSubmit={vi.fn()}
        isLoading={false}
        onCancel={onCancel}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('isLoading=true이면 제출 버튼이 비활성화된다', () => {
    render(
      <TodoForm
        categories={mockCategories}
        onSubmit={vi.fn()}
        isLoading
        onCancel={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByRole('button', { name: /등록/ })).toBeDisabled()
  })
})

// ─── TodoItem ─────────────────────────────────────────────────────────────────

describe('TodoItem', () => {
  it('제목, 카테고리, 날짜, 배지가 렌더링된다', () => {
    render(
      <TodoItem
        todo={mockTodo}
        categoryName="업무"
        onToggleComplete={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByText('팀 미팅 자료 준비')).toBeInTheDocument()
    expect(screen.getByText(/업무/)).toBeInTheDocument()
    expect(screen.getByText(/2026-05-14/)).toBeInTheDocument()
    expect(screen.getByText('미완료')).toBeInTheDocument()
  })

  it('완료된 할일은 취소선이 적용된다', () => {
    render(
      <TodoItem
        todo={completedTodo}
        categoryName="업무"
        onToggleComplete={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    const title = screen.getByText('완료된 할일')
    expect(title.style.textDecoration).toBe('line-through')
  })

  it('체크박스 클릭 시 onToggleComplete가 호출된다', () => {
    const onToggle = vi.fn()
    render(
      <TodoItem
        todo={mockTodo}
        categoryName="업무"
        onToggleComplete={onToggle}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith(1)
  })

  it('수정 버튼 클릭 시 onEdit이 호출된다', () => {
    const onEdit = vi.fn()
    render(
      <TodoItem
        todo={mockTodo}
        categoryName="업무"
        onToggleComplete={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.click(screen.getByRole('button', { name: /수정/ }))
    expect(onEdit).toHaveBeenCalledWith(mockTodo)
  })

  it('삭제 버튼 클릭 시 onDelete가 호출된다', () => {
    const onDelete = vi.fn()
    render(
      <TodoItem
        todo={mockTodo}
        categoryName="업무"
        onToggleComplete={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.click(screen.getByRole('button', { name: /삭제/ }))
    expect(onDelete).toHaveBeenCalledWith(mockTodo)
  })
})

// ─── TodoList ─────────────────────────────────────────────────────────────────

describe('TodoList', () => {
  it('할일 목록이 비어 있으면 "등록된 할일이 없습니다." 메시지가 표시된다', () => {
    render(
      <TodoList
        todos={[]}
        categories={mockCategories}
        onToggleComplete={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByText('등록된 할일이 없습니다.')).toBeInTheDocument()
  })

  it('할일 목록이 있으면 모든 항목이 렌더링된다', () => {
    const todos = [mockTodo, completedTodo]
    render(
      <TodoList
        todos={todos}
        categories={mockCategories}
        onToggleComplete={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByText('팀 미팅 자료 준비')).toBeInTheDocument()
    expect(screen.getByText('완료된 할일')).toBeInTheDocument()
  })

  it('카테고리 이름을 매핑하여 표시한다', () => {
    render(
      <TodoList
        todos={[mockTodo]}
        categories={mockCategories}
        onToggleComplete={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByText(/업무/)).toBeInTheDocument()
  })
})

// ─── TodoListPage 통합 테스트 ─────────────────────────────────────────────────

import * as todoApi from '../api/todo.api'
import * as categoryApi from '../api/category.api'
import { TodoListPage } from '../pages/TodoListPage'

describe('TodoListPage', () => {
  beforeEach(() => {
    vi.mocked(todoApi.getTodos).mockResolvedValue([mockTodo])
    vi.mocked(categoryApi.getCategories).mockResolvedValue(mockCategories)
  })

  it('페이지 제목과 할일 추가 버튼이 렌더링된다', async () => {
    render(<TodoListPage />, { wrapper: makeWrapper() })
    expect(screen.getByText('일정 캘린더')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ 할일 추가' })).toBeInTheDocument()
  })

  it('할일 목록이 로드되어 표시된다', async () => {
    render(<TodoListPage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '목록' }))
    await waitFor(() => expect(screen.getByText('팀 미팅 자료 준비')).toBeInTheDocument())
  })

  it('+ 할일 추가 버튼 클릭 시 등록 모달이 열린다', async () => {
    render(<TodoListPage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '+ 할일 추가' }))
    expect(screen.getByRole('dialog', { name: '새 할일 추가' })).toBeInTheDocument()
  })

  it('할일 목록이 비어 있으면 빈 상태 메시지가 표시된다', async () => {
    vi.mocked(todoApi.getTodos).mockResolvedValue([])
    render(<TodoListPage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '목록' }))
    await waitFor(() => expect(screen.getByText('등록된 할일이 없습니다.')).toBeInTheDocument())
  })

  it('삭제 버튼 클릭 시 삭제 확인 다이얼로그가 열린다', async () => {
    render(<TodoListPage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '목록' }))
    await waitFor(() => screen.getByText('팀 미팅 자료 준비'))
    fireEvent.click(screen.getByRole('button', { name: /삭제: 팀 미팅 자료 준비/ }))
    expect(screen.getByRole('dialog', { name: '할일 삭제' })).toBeInTheDocument()
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument()
  })

  it('삭제 모달에서 취소 클릭 시 다이얼로그가 닫힌다', async () => {
    render(<TodoListPage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '목록' }))
    await waitFor(() => screen.getByText('팀 미팅 자료 준비'))
    fireEvent.click(screen.getByRole('button', { name: /삭제: 팀 미팅 자료 준비/ }))
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('수정 버튼 클릭 시 수정 모달이 열리고 기존 값이 채워진다', async () => {
    render(<TodoListPage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '목록' }))
    await waitFor(() => screen.getByText('팀 미팅 자료 준비'))
    fireEvent.click(screen.getByRole('button', { name: /수정: 팀 미팅 자료 준비/ }))
    expect(screen.getByRole('dialog', { name: '할일 수정' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /제목/ })).toHaveValue('팀 미팅 자료 준비')
  })

  it('등록 모달에서 취소 클릭 시 모달이 닫힌다', async () => {
    render(<TodoListPage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '+ 할일 추가' }))
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('완료 토글 시 toggleTodoComplete가 호출된다', async () => {
    vi.mocked(todoApi.toggleTodoComplete).mockResolvedValue({ ...mockTodo, is_completed: true })
    render(<TodoListPage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '목록' }))
    await waitFor(() => screen.getByText('팀 미팅 자료 준비'))
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(todoApi.toggleTodoComplete).toHaveBeenCalledWith(1))
  })
})
