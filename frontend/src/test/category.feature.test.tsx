import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import MockAdapter from 'axios-mock-adapter'
import axiosInstance from '../api/axiosInstance'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

const mockAxios = new MockAdapter(axiosInstance)

const defaultCategories = [
  { category_id: 1, user_id: null, name: '전체', is_default: true },
  { category_id: 2, user_id: null, name: '업무', is_default: true },
  { category_id: 3, user_id: null, name: '개인', is_default: true },
]

const userCategories = [
  { category_id: 4, user_id: 1, name: '연구', is_default: false },
  { category_id: 5, user_id: 1, name: '독서', is_default: false },
]

const allCategories = [...defaultCategories, ...userCategories]

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/categories']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  mockAxios.reset()
})

// ─── CategoryList ──────────────────────────────────────────────────────────────

describe('CategoryList', () => {
  it('기본 카테고리에 [기본] 뱃지가 표시되고 삭제 버튼이 없다', async () => {
    const { CategoryList } = await import('../features/category/components/CategoryList')
    render(
      <CategoryList
        categories={allCategories}
        deleteErrors={{}}
        onDeleteRequest={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getAllByText('기본').length).toBe(defaultCategories.length)
    defaultCategories.forEach((cat) => {
      expect(screen.queryByRole('button', { name: `삭제: ${cat.name}` })).toBeNull()
    })
  })

  it('사용자 카테고리에 삭제 버튼이 표시된다', async () => {
    const { CategoryList } = await import('../features/category/components/CategoryList')
    render(
      <CategoryList
        categories={allCategories}
        deleteErrors={{}}
        onDeleteRequest={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    userCategories.forEach((cat) => {
      expect(screen.getByRole('button', { name: `삭제: ${cat.name}` })).toBeInTheDocument()
    })
  })

  it('삭제 버튼 클릭 시 onDeleteRequest가 해당 카테고리와 함께 호출된다', async () => {
    const { CategoryList } = await import('../features/category/components/CategoryList')
    const onDeleteRequest = vi.fn()
    render(
      <CategoryList
        categories={allCategories}
        deleteErrors={{}}
        onDeleteRequest={onDeleteRequest}
      />,
      { wrapper: makeWrapper() }
    )
    fireEvent.click(screen.getByRole('button', { name: '삭제: 연구' }))
    expect(onDeleteRequest).toHaveBeenCalledWith(userCategories[0])
  })

  it('deleteErrors에 해당 카테고리 오류가 있으면 오류 메시지가 표시된다', async () => {
    const { CategoryList } = await import('../features/category/components/CategoryList')
    render(
      <CategoryList
        categories={allCategories}
        deleteErrors={{ 4: '할일이 존재하는 카테고리는 삭제할 수 없습니다.' }}
        onDeleteRequest={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByText('할일이 존재하는 카테고리는 삭제할 수 없습니다.')).toBeInTheDocument()
  })

  it('카테고리가 없을 때 빈 상태 메시지가 표시된다', async () => {
    const { CategoryList } = await import('../features/category/components/CategoryList')
    render(
      <CategoryList
        categories={[]}
        deleteErrors={{}}
        onDeleteRequest={vi.fn()}
      />,
      { wrapper: makeWrapper() }
    )
    expect(screen.getByText('등록된 카테고리가 없습니다.')).toBeInTheDocument()
  })
})

// ─── CategoryForm ──────────────────────────────────────────────────────────────

describe('CategoryForm', () => {
  it('이름 입력 필드와 추가 버튼이 렌더링된다', async () => {
    const { CategoryForm } = await import('../features/category/components/CategoryForm')
    mockAxios.onGet('/categories').reply(200, { data: allCategories })
    render(<CategoryForm />, { wrapper: makeWrapper() })
    expect(screen.getByLabelText(/새 카테고리 이름/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /추가/ })).toBeInTheDocument()
  })

  it('빈 이름으로 제출 시 클라이언트 유효성 오류가 표시된다', async () => {
    const { CategoryForm } = await import('../features/category/components/CategoryForm')
    mockAxios.onGet('/categories').reply(200, { data: allCategories })
    render(<CategoryForm />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: /추가/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('카테고리 이름을 입력하세요.')
  })

  it('유효성 오류 시 API가 호출되지 않는다', async () => {
    const { CategoryForm } = await import('../features/category/components/CategoryForm')
    mockAxios.onPost('/categories').reply(200, { data: { category_id: 10, name: '테스트', is_default: false } })
    render(<CategoryForm />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: /추가/ }))
    expect(mockAxios.history.post.length).toBe(0)
  })

  it('성공 시 입력 필드가 초기화된다', async () => {
    const { CategoryForm } = await import('../features/category/components/CategoryForm')
    mockAxios.onGet('/categories').reply(200, { data: allCategories })
    mockAxios.onPost('/categories').reply(201, { data: { category_id: 10, name: '새카테고리', user_id: 1, is_default: false } })
    render(<CategoryForm />, { wrapper: makeWrapper() })
    const input = screen.getByLabelText(/새 카테고리 이름/)
    fireEvent.change(input, { target: { value: '새카테고리' } })
    fireEvent.click(screen.getByRole('button', { name: /추가/ }))
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(''))
  })

  it('이름 중복(409 DUPLICATE_CATEGORY) 시 오류 메시지가 표시된다', async () => {
    const { CategoryForm } = await import('../features/category/components/CategoryForm')
    mockAxios.onGet('/categories').reply(200, { data: allCategories })
    mockAxios.onPost('/categories').reply(409, { error: { code: 'DUPLICATE_CATEGORY', message: '중복' } })
    render(<CategoryForm />, { wrapper: makeWrapper() })
    const input = screen.getByLabelText(/새 카테고리 이름/)
    fireEvent.change(input, { target: { value: '연구' } })
    fireEvent.click(screen.getByRole('button', { name: /추가/ }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('이미 존재하는 카테고리 이름입니다.')
    )
  })
})

// ─── CategoryPage 통합 테스트 ──────────────────────────────────────────────────

describe('CategoryPage', () => {
  beforeEach(() => {
    mockAxios.onGet('/categories').reply(200, { data: allCategories })
    mockAxios.onPost('/auth/logout').reply(204)
  })

  it('카테고리 목록이 렌더링된다', async () => {
    const { CategoryPage } = await import('../pages/CategoryPage')
    render(<CategoryPage />, { wrapper: makeWrapper() })
    await waitFor(() => {
      allCategories.forEach((cat) => {
        expect(screen.getByText(cat.name)).toBeInTheDocument()
      })
    })
  })

  it('기본 카테고리 섹션과 사용자 카테고리 섹션이 구분된다', async () => {
    const { CategoryPage } = await import('../pages/CategoryPage')
    render(<CategoryPage />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect(screen.getByText('기본 카테고리')).toBeInTheDocument()
      expect(screen.getByText('사용자 카테고리')).toBeInTheDocument()
    })
  })

  it('삭제 버튼 클릭 시 삭제 확인 모달이 표시된다', async () => {
    const { CategoryPage } = await import('../pages/CategoryPage')
    render(<CategoryPage />, { wrapper: makeWrapper() })
    await waitFor(() => screen.getByRole('button', { name: '삭제: 연구' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제: 연구' }))
    expect(screen.getByRole('dialog', { name: '카테고리 삭제' })).toBeInTheDocument()
    expect(screen.getByText(/"연구"/)).toBeInTheDocument()
  })

  it('삭제 확인 모달에서 취소 클릭 시 삭제되지 않는다', async () => {
    const { CategoryPage } = await import('../pages/CategoryPage')
    render(<CategoryPage />, { wrapper: makeWrapper() })
    await waitFor(() => screen.getByRole('button', { name: '삭제: 연구' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제: 연구' }))
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(mockAxios.history.delete.length).toBe(0)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('삭제 확인 후 API가 호출되고 목록이 갱신된다', async () => {
    mockAxios.onDelete('/categories/4').reply(204)
    mockAxios.onGet('/categories').replyOnce(200, { data: allCategories })
      .onGet('/categories').replyOnce(200, { data: [...defaultCategories, userCategories[1]] })
    const { CategoryPage } = await import('../pages/CategoryPage')
    render(<CategoryPage />, { wrapper: makeWrapper() })
    await waitFor(() => screen.getByRole('button', { name: '삭제: 연구' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제: 연구' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    await waitFor(() => expect(mockAxios.history.delete.length).toBe(1))
  })

  it('할일 있는 카테고리 삭제(409 CATEGORY_HAS_TODOS) 시 인라인 오류가 표시된다', async () => {
    mockAxios.onDelete('/categories/4').reply(409, { error: { code: 'CATEGORY_HAS_TODOS', message: '할일 있음' } })
    const { CategoryPage } = await import('../pages/CategoryPage')
    render(<CategoryPage />, { wrapper: makeWrapper() })
    await waitFor(() => screen.getByRole('button', { name: '삭제: 연구' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제: 연구' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    await waitFor(() =>
      expect(screen.getByText('할일이 존재하는 카테고리는 삭제할 수 없습니다.')).toBeInTheDocument()
    )
  })
})
