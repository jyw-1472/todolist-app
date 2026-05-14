import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTodoList } from '../features/todo/hooks/useTodoList'
import {
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useToggleTodoComplete,
} from '../features/todo/hooks/useTodoMutations'
import { useTodoFilter } from '../features/todo/hooks/useTodoFilter'

vi.mock('../api/todo.api', () => ({
  getTodos: vi.fn(),
  getTodoById: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  toggleTodoComplete: vi.fn(),
}))

import * as todoApi from '../api/todo.api'

const mockTodo = {
  todo_id: 1,
  user_id: 1,
  category_id: 2,
  title: '팀 미팅 자료 준비',
  description: null,
  due_date: '2026-05-15',
  is_completed: false,
  created_at: '2026-05-14T09:00:00.000Z',
  updated_at: '2026-05-14T09:00:00.000Z',
}

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

beforeEach(() => vi.clearAllMocks())

describe('useTodoList', () => {
  it('필터 없이 할일 목록을 조회한다', async () => {
    vi.mocked(todoApi.getTodos).mockResolvedValue([mockTodo])
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useTodoList(), { wrapper: makeWrapper(queryClient) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockTodo])
  })

  it('필터가 queryKey에 포함된다', async () => {
    vi.mocked(todoApi.getTodos).mockResolvedValue([mockTodo])
    const filter = { category_id: 2, is_completed: false }
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useTodoList(filter), { wrapper: makeWrapper(queryClient) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData(['todos', filter])
    expect(cached).toEqual([mockTodo])
  })

  it('필터 변경 시 새 요청이 발생한다', async () => {
    vi.mocked(todoApi.getTodos).mockResolvedValue([])
    const queryClient = createTestQueryClient()

    renderHook(() => useTodoList({ category_id: 1 }), { wrapper: makeWrapper(queryClient) })
    renderHook(() => useTodoList({ category_id: 2 }), { wrapper: makeWrapper(queryClient) })

    await waitFor(() => expect(todoApi.getTodos).toHaveBeenCalledTimes(2))
  })

  it('API 오류 시 isError가 true가 된다', async () => {
    vi.mocked(todoApi.getTodos).mockRejectedValue(new Error('서버 오류'))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useTodoList(), { wrapper: makeWrapper(queryClient) })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCreateTodo', () => {
  it('성공 시 todos 캐시가 무효화된다', async () => {
    vi.mocked(todoApi.createTodo).mockResolvedValue(mockTodo)
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateTodo(), { wrapper: makeWrapper(queryClient) })

    result.current.mutate({ title: '새 할일', category_id: 2 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] })
  })

  it('성공 시 생성된 Todo를 반환한다', async () => {
    vi.mocked(todoApi.createTodo).mockResolvedValue(mockTodo)
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCreateTodo(), { wrapper: makeWrapper(queryClient) })

    result.current.mutate({ title: '새 할일', category_id: 2 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTodo)
  })

  it('실패 시 isError가 true가 된다', async () => {
    vi.mocked(todoApi.createTodo).mockRejectedValue({ response: { status: 404 } })
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCreateTodo(), { wrapper: makeWrapper(queryClient) })

    result.current.mutate({ title: '새 할일', category_id: 999 })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useUpdateTodo', () => {
  it('성공 시 todos 캐시가 무효화된다', async () => {
    vi.mocked(todoApi.updateTodo).mockResolvedValue({ ...mockTodo, title: '수정됨' })
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateTodo(), { wrapper: makeWrapper(queryClient) })

    result.current.mutate({ todoId: 1, data: { title: '수정됨' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] })
  })
})

describe('useDeleteTodo', () => {
  it('성공 시 todos 캐시가 무효화된다', async () => {
    vi.mocked(todoApi.deleteTodo).mockResolvedValue(undefined)
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: makeWrapper(queryClient) })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] })
  })
})

describe('useToggleTodoComplete', () => {
  it('성공 시 todos 캐시가 무효화된다', async () => {
    vi.mocked(todoApi.toggleTodoComplete).mockResolvedValue({ ...mockTodo, is_completed: true })
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useToggleTodoComplete(), { wrapper: makeWrapper(queryClient) })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] })
  })
})

describe('useTodoFilter', () => {
  it('초기 filter는 빈 객체이다', () => {
    const { result } = renderHook(() => useTodoFilter())
    expect(result.current.filter).toEqual({})
  })

  it('초기 filterError는 null이다', () => {
    const { result } = renderHook(() => useTodoFilter())
    expect(result.current.filterError).toBeNull()
  })

  it('setFilter로 필터를 업데이트한다', () => {
    const { result } = renderHook(() => useTodoFilter())
    act(() => result.current.setFilter({ category_id: 2 }))
    expect(result.current.filter.category_id).toBe(2)
  })

  it('기존 필터를 유지하면서 부분 업데이트된다', () => {
    const { result } = renderHook(() => useTodoFilter())
    act(() => result.current.setFilter({ category_id: 2 }))
    act(() => result.current.setFilter({ is_completed: false }))
    expect(result.current.filter.category_id).toBe(2)
    expect(result.current.filter.is_completed).toBe(false)
  })

  it('from > to 조건 시 에러 메시지가 반환된다', () => {
    const { result } = renderHook(() => useTodoFilter())
    act(() => result.current.setFilter({ from: '2026-05-31', to: '2026-05-01' }))
    expect(result.current.filterError).toBe('시작일이 종료일보다 늦을 수 없습니다.')
  })

  it('from <= to 조건 시 filterError는 null이다', () => {
    const { result } = renderHook(() => useTodoFilter())
    act(() => result.current.setFilter({ from: '2026-05-01', to: '2026-05-31' }))
    expect(result.current.filterError).toBeNull()
  })

  it('from === to 조건 시 filterError는 null이다', () => {
    const { result } = renderHook(() => useTodoFilter())
    act(() => result.current.setFilter({ from: '2026-05-15', to: '2026-05-15' }))
    expect(result.current.filterError).toBeNull()
  })

  it('from만 있고 to가 없으면 filterError는 null이다', () => {
    const { result } = renderHook(() => useTodoFilter())
    act(() => result.current.setFilter({ from: '2026-05-31' }))
    expect(result.current.filterError).toBeNull()
  })

  it('resetFilter로 필터가 초기화된다', () => {
    const { result } = renderHook(() => useTodoFilter())
    act(() => result.current.setFilter({ category_id: 2, from: '2026-05-01' }))
    act(() => result.current.resetFilter())
    expect(result.current.filter).toEqual({})
    expect(result.current.filterError).toBeNull()
  })
})
