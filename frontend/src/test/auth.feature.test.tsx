import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { LoginForm } from '../features/auth/components/LoginForm'
import { SignupForm } from '../features/auth/components/SignupForm'
import { useAuthStore } from '../store/authStore'

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  deleteMe: vi.fn(),
  refreshAccessToken: vi.fn(),
  getMe: vi.fn(),
  updateMe: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import * as authApi from '../api/auth.api'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ accessToken: null, refreshToken: null, user: null })
})

describe('LoginForm', () => {
  it('이메일, 비밀번호, 로그인 버튼이 렌더링된다', () => {
    render(<LoginForm />, { wrapper: Wrapper })
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  it('회원가입 링크가 렌더링된다', () => {
    render(<LoginForm />, { wrapper: Wrapper })
    expect(screen.getByRole('link', { name: /회원가입/ })).toBeInTheDocument()
  })

  it('이메일 미입력 시 클라이언트 오류 메시지가 표시된다', async () => {
    render(<LoginForm />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByText('이메일을 입력하세요.')).toBeInTheDocument()
  })

  it('비밀번호 미입력 시 클라이언트 오류 메시지가 표시된다', async () => {
    render(<LoginForm />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@test.com' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByText('비밀번호를 입력하세요.')).toBeInTheDocument()
  })

  it('유효성 오류 시 API가 호출되지 않는다', () => {
    render(<LoginForm />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('로그인 성공 시 authStore에 토큰과 사용자가 저장된다', async () => {
    const mockUser = { user_id: 1, email: 'test@test.com', name: '홍길동', provider: 'local', created_at: '' }
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: mockUser,
    })

    render(<LoginForm />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.accessToken).toBe('access-token')
      expect(state.refreshToken).toBe('refresh-token')
      expect(state.user).toEqual(mockUser)
    })
  })

  it('로그인 성공 시 /로 이동한다', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { user_id: 1, email: 'test@test.com', name: '홍길동', provider: 'local', created_at: '' },
    })

    render(<LoginForm />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('401 오류 시 서버 에러 메시지가 표시된다', async () => {
    const error = { response: { data: { error: { code: 'UNAUTHORIZED', message: '...' } } } }
    vi.mocked(authApi.login).mockRejectedValue(error)

    render(<LoginForm />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('인증이 필요합니다. 다시 로그인해주세요.')
    })
  })

  it('제출 중 버튼이 isLoading 상태가 된다', async () => {
    let resolveLogin!: (value: any) => void
    vi.mocked(authApi.login).mockReturnValue(new Promise((res) => { resolveLogin = res }))

    render(<LoginForm />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })

    resolveLogin({ accessToken: 'a', refreshToken: 'r', user: { user_id: 1, email: '', name: '', provider: 'local', created_at: '' } })
  })
})

describe('SignupForm', () => {
  it('이름, 이메일, 비밀번호, 가입하기 버튼이 렌더링된다', () => {
    render(<SignupForm />, { wrapper: Wrapper })
    expect(screen.getByLabelText('이름')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument()
  })

  it('로그인 링크가 렌더링된다', () => {
    render(<SignupForm />, { wrapper: Wrapper })
    expect(screen.getByRole('link', { name: /로그인/ })).toBeInTheDocument()
  })

  it('이름 미입력 시 클라이언트 오류 메시지가 표시된다', async () => {
    render(<SignupForm />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: '가입하기' }))
    expect(await screen.findByText('이름을 입력하세요.')).toBeInTheDocument()
  })

  it('이메일 미입력 시 클라이언트 오류 메시지가 표시된다', async () => {
    render(<SignupForm />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.click(screen.getByRole('button', { name: '가입하기' }))
    expect(await screen.findByText('이메일을 입력하세요.')).toBeInTheDocument()
  })

  it('비밀번호 미입력 시 클라이언트 오류 메시지가 표시된다', async () => {
    render(<SignupForm />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@test.com' } })
    fireEvent.click(screen.getByRole('button', { name: '가입하기' }))
    expect(await screen.findByText('비밀번호를 입력하세요.')).toBeInTheDocument()
  })

  it('비밀번호 8자 미만 시 오류 메시지가 표시된다', async () => {
    render(<SignupForm />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: '가입하기' }))
    expect(await screen.findByText('비밀번호는 8자 이상이어야 합니다.')).toBeInTheDocument()
  })

  it('유효성 오류 시 API가 호출되지 않는다', () => {
    render(<SignupForm />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: '가입하기' }))
    expect(authApi.signup).not.toHaveBeenCalled()
  })

  it('회원가입 성공 시 /login으로 이동한다', async () => {
    vi.mocked(authApi.signup).mockResolvedValue({
      user_id: 1, email: 'test@test.com', name: '홍길동', provider: 'local', created_at: '',
    })

    render(<SignupForm />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '가입하기' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('이메일 중복(409) 시 "이미 사용 중인 이메일입니다." 메시지가 표시된다', async () => {
    const error = { response: { data: { error: { code: 'DUPLICATE_EMAIL', message: '...' } } } }
    vi.mocked(authApi.signup).mockRejectedValue(error)

    render(<SignupForm />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'dupe@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '가입하기' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('이미 사용 중인 이메일입니다.')
    })
  })

  it('제출 중 버튼이 isLoading 상태가 된다', async () => {
    let resolveSignup!: (value: any) => void
    vi.mocked(authApi.signup).mockReturnValue(new Promise((res) => { resolveSignup = res }))

    render(<SignupForm />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '가입하기' }))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })

    resolveSignup({ user_id: 1, email: '', name: '', provider: 'local', created_at: '' })
  })
})
