import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  deleteMe: vi.fn(),
  refreshAccessToken: vi.fn(),
  getMe: vi.fn(),
  updateMe: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

function renderPages(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  it('/login 접근 시 페이지 제목이 표시된다', () => {
    renderPages('/login')
    expect(screen.getByText('TodoList 로그인')).toBeInTheDocument()
  })

  it('/login 접근 시 LoginForm(이메일·비밀번호·버튼)이 표시된다', () => {
    renderPages('/login')
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  it('회원가입 링크가 표시된다', () => {
    renderPages('/login')
    expect(screen.getByRole('link', { name: /회원가입/ })).toBeInTheDocument()
  })

  it('회원가입 링크 클릭 시 SignupPage로 이동한다', () => {
    renderPages('/login')
    fireEvent.click(screen.getByRole('link', { name: /회원가입/ }))
    expect(screen.getByText('TodoList 가입하기')).toBeInTheDocument()
    expect(screen.queryByText('TodoList 로그인')).not.toBeInTheDocument()
  })

  it('페이지 래퍼가 flexbox 중앙 정렬 스타일을 가진다', () => {
    const { container } = renderPages('/login')
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.display).toBe('flex')
    expect(wrapper.style.alignItems).toBe('center')
    expect(wrapper.style.justifyContent).toBe('center')
  })

  it('페이지 래퍼가 minHeight: 100vh를 가진다', () => {
    const { container } = renderPages('/login')
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.minHeight).toBe('100vh')
  })
})

describe('SignupPage', () => {
  it('/signup 접근 시 페이지 제목이 표시된다', () => {
    renderPages('/signup')
    expect(screen.getByText('TodoList 가입하기')).toBeInTheDocument()
  })

  it('/signup 접근 시 SignupForm(이름·이메일·비밀번호·버튼)이 표시된다', () => {
    renderPages('/signup')
    expect(screen.getByLabelText('이름')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument()
  })

  it('로그인 링크가 표시된다', () => {
    renderPages('/signup')
    expect(screen.getByRole('link', { name: /로그인/ })).toBeInTheDocument()
  })

  it('로그인 링크 클릭 시 LoginPage로 이동한다', () => {
    renderPages('/signup')
    fireEvent.click(screen.getByRole('link', { name: /로그인/ }))
    expect(screen.getByText('TodoList 로그인')).toBeInTheDocument()
    expect(screen.queryByText('TodoList 가입하기')).not.toBeInTheDocument()
  })

  it('페이지 래퍼가 flexbox 중앙 정렬 스타일을 가진다', () => {
    const { container } = renderPages('/signup')
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.display).toBe('flex')
    expect(wrapper.style.alignItems).toBe('center')
    expect(wrapper.style.justifyContent).toBe('center')
  })

  it('페이지 래퍼가 minHeight: 100vh를 가진다', () => {
    const { container } = renderPages('/signup')
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.minHeight).toBe('100vh')
  })
})
