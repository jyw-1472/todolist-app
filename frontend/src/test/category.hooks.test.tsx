import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCategoryList } from '../features/category/hooks/useCategoryList'
import { useCreateCategory, useDeleteCategory } from '../features/category/hooks/useCategoryMutations'

vi.mock('../api/category.api', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

import * as categoryApi from '../api/category.api'

const mockCategories = [
  { category_id: 1, user_id: null, name: '전체', is_default: true },
  { category_id: 2, user_id: null, name: '업무', is_default: false },
  { category_id: 3, user_id: 1, name: '연구', is_default: false },
]

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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCategoryList', () => {
  it('useQuery로 카테고리 목록을 조회한다', async () => {
    vi.mocked(categoryApi.getCategories).mockResolvedValue(mockCategories)
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCategoryList(), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockCategories)
  })

  it('queryKey가 ["categories"]이다', async () => {
    vi.mocked(categoryApi.getCategories).mockResolvedValue(mockCategories)
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCategoryList(), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cachedData = queryClient.getQueryData(['categories'])
    expect(cachedData).toEqual(mockCategories)
  })

  it('API 오류 시 isError가 true가 된다', async () => {
    vi.mocked(categoryApi.getCategories).mockRejectedValue(new Error('네트워크 오류'))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCategoryList(), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('초기 로딩 시 isPending이 true이다', () => {
    vi.mocked(categoryApi.getCategories).mockReturnValue(new Promise(() => {}))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCategoryList(), {
      wrapper: makeWrapper(queryClient),
    })

    expect(result.current.isPending).toBe(true)
  })
})

describe('useCreateCategory', () => {
  it('성공 시 categories 캐시가 무효화된다', async () => {
    const newCat = { category_id: 4, user_id: 1, name: '독서', is_default: false }
    vi.mocked(categoryApi.createCategory).mockResolvedValue(newCat)
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({ name: '독서' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] })
  })

  it('성공 시 생성된 카테고리를 반환한다', async () => {
    const newCat = { category_id: 4, user_id: 1, name: '독서', is_default: false }
    vi.mocked(categoryApi.createCategory).mockResolvedValue(newCat)
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({ name: '독서' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(newCat)
  })

  it('실패 시 isError가 true가 된다', async () => {
    vi.mocked(categoryApi.createCategory).mockRejectedValue({ response: { status: 409 } })
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({ name: '업무' })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useDeleteCategory', () => {
  it('성공 시 categories 캐시가 무효화된다', async () => {
    vi.mocked(categoryApi.deleteCategory).mockResolvedValue(undefined)
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate(3)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] })
  })

  it('성공 시 todos 캐시도 무효화된다', async () => {
    vi.mocked(categoryApi.deleteCategory).mockResolvedValue(undefined)
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate(3)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] })
  })

  it('실패 시 isError가 true가 된다', async () => {
    vi.mocked(categoryApi.deleteCategory).mockRejectedValue({ response: { status: 409 } })
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate(3)
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
