import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import MockAdapter from 'axios-mock-adapter'
import axiosInstance from '../api/axiosInstance'
import { useAuthStore } from '../store/authStore'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockAxios = new MockAdapter(axiosInstance)

const mockUser = {
  user_id: 1,
  email: 'test@example.com',
  name: '김민준',
  provider: 'local',
  created_at: '2026-05-14T00:00:00.000Z',
}

const updatedUser = { ...mockUser, name: '이수아' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/profile']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  mockAxios.reset()
  mockNavigate.mockReset()
  useAuthStore.setState({ accessToken: 'token', refreshToken: 'refresh', user: mockUser })
  mockAxios.onPost('/auth/logout').reply(204)
})

describe('ProfilePage — 이름 변경', () => {
  it('페이지 진입 시 현재 사용자 이름이 이름 필드에 미리 채워진다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    await waitFor(() => {
      const input = screen.getByLabelText('현재 이름') as HTMLInputElement
      expect(input.value).toBe('김민준')
    })
  })

  it('이름 변경 성공 시 authStore.user.name이 업데이트된다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    mockAxios.onPatch('/users/me').reply(200, { data: updatedUser })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect((screen.getByLabelText('현재 이름') as HTMLInputElement).value).toBe('김민준')
    })
    fireEvent.change(screen.getByLabelText('현재 이름'), { target: { value: '이수아' } })
    fireEvent.click(screen.getByRole('button', { name: '이름 변경' }))
    await waitFor(() => {
      expect(useAuthStore.getState().user?.name).toBe('이수아')
    })
  })

  it('이름 변경 성공 시 성공 메시지가 표시된다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    mockAxios.onPatch('/users/me').reply(200, { data: updatedUser })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect((screen.getByLabelText('현재 이름') as HTMLInputElement).value).toBe('김민준')
    })
    fireEvent.change(screen.getByLabelText('현재 이름'), { target: { value: '이수아' } })
    fireEvent.click(screen.getByRole('button', { name: '이름 변경' }))
    await waitFor(() => {
      expect(screen.getByText('이름이 변경되었습니다.')).toBeInTheDocument()
    })
  })

  it('변경 항목 없이 이름 저장 시도 시 유효성 오류가 표시된다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect((screen.getByLabelText('현재 이름') as HTMLInputElement).value).toBe('김민준')
    })
    fireEvent.click(screen.getByRole('button', { name: '이름 변경' }))
    expect(screen.getByRole('alert')).toHaveTextContent('변경할 내용을 입력하세요.')
  })

  it('이름 필드가 비어 있으면 유효성 오류가 표시된다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect((screen.getByLabelText('현재 이름') as HTMLInputElement).value).toBe('김민준')
    })
    fireEvent.change(screen.getByLabelText('현재 이름'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: '이름 변경' }))
    expect(screen.getByRole('alert')).toHaveTextContent('변경할 내용을 입력하세요.')
  })
})

describe('ProfilePage — 비밀번호 변경', () => {
  it('현재 비밀번호 불일치(401) 시 오류 메시지가 표시된다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    mockAxios.onPatch('/users/me').reply(401, { error: { code: 'UNAUTHORIZED', message: '불일치' } })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'wrongpass' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('현재 비밀번호가 올바르지 않습니다.')
    })
  })

  it('새 비밀번호 불일치 시 유효성 오류가 표시된다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'current123' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }))
    expect(screen.getByRole('alert')).toHaveTextContent('새 비밀번호가 일치하지 않습니다.')
  })

  it('현재 비밀번호 미입력 시 유효성 오류가 표시된다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }))
    expect(screen.getByRole('alert')).toHaveTextContent('현재 비밀번호를 입력하세요.')
  })
})

describe('ProfilePage — 회원 탈퇴', () => {
  it('회원 탈퇴 버튼 클릭 시 확인 모달이 표시된다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))
    expect(screen.getByRole('dialog', { name: '회원 탈퇴' })).toBeInTheDocument()
  })

  it('회원 탈퇴 모달에서 취소 클릭 시 탈퇴되지 않는다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(mockAxios.history.delete.length).toBe(0)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('탈퇴 성공 시 authStore가 초기화되고 /signup으로 이동한다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    mockAxios.onDelete('/users/me').reply(204)
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))
    const dialog = screen.getByRole('dialog', { name: '회원 탈퇴' })
    const passwordInput = within(dialog).getByLabelText('현재 비밀번호')
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } })
    fireEvent.click(within(dialog).getByRole('button', { name: '탈퇴하기' }))
    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith('/signup')
    })
  })

  it('탈퇴 시 비밀번호 미입력이면 유효성 오류가 표시된다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))
    const dialog = screen.getByRole('dialog', { name: '회원 탈퇴' })
    fireEvent.click(within(dialog).getByRole('button', { name: '탈퇴하기' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('비밀번호를 입력하세요.')
  })

  it('탈퇴 시 비밀번호 불일치(401) 오류 메시지가 표시된다', async () => {
    mockAxios.onGet('/users/me').reply(200, { data: mockUser })
    mockAxios.onDelete('/users/me').reply(401, { error: { code: 'UNAUTHORIZED', message: '불일치' } })
    const { ProfilePage } = await import('../pages/ProfilePage')
    render(<ProfilePage />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))
    const dialog = screen.getByRole('dialog', { name: '회원 탈퇴' })
    fireEvent.change(within(dialog).getByLabelText('현재 비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(within(dialog).getByRole('button', { name: '탈퇴하기' }))
    await waitFor(() => {
      expect(within(dialog).getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않습니다.')
    })
  })
})
