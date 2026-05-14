import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { GuestRoute } from '../components/GuestRoute'
import { useAuthStore } from '../store/authStore'

beforeEach(() => {
  useAuthStore.getState().clearAuth()
})

describe('ProtectedRoute', () => {
  it('accessToken이 없으면 /login으로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<div>로그인 페이지</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>보호된 페이지</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
    expect(screen.queryByText('보호된 페이지')).not.toBeInTheDocument()
  })

  it('accessToken이 있으면 children을 렌더링한다', () => {
    useAuthStore.getState().setTokens('valid-token', 'refresh-token')
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<div>로그인 페이지</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>보호된 페이지</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('보호된 페이지')).toBeInTheDocument()
    expect(screen.queryByText('로그인 페이지')).not.toBeInTheDocument()
  })

  it('/categories 비인증 접근 시 /login으로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/categories']}>
        <Routes>
          <Route path="/login" element={<div>로그인 페이지</div>} />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <div>카테고리 페이지</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
  })

  it('/profile 비인증 접근 시 /login으로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/login" element={<div>로그인 페이지</div>} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>프로필 페이지</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
  })
})

describe('GuestRoute', () => {
  it('accessToken이 없으면 children을 렌더링한다', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={<div>메인 페이지</div>} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <div>로그인 페이지</div>
              </GuestRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
  })

  it('accessToken이 있으면 /로 리다이렉트된다', () => {
    useAuthStore.getState().setTokens('valid-token', 'refresh-token')
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={<div>메인 페이지</div>} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <div>로그인 페이지</div>
              </GuestRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('메인 페이지')).toBeInTheDocument()
    expect(screen.queryByText('로그인 페이지')).not.toBeInTheDocument()
  })

  it('로그인 상태에서 /signup 접근 시 /로 리다이렉트된다', () => {
    useAuthStore.getState().setTokens('valid-token', 'refresh-token')
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/" element={<div>메인 페이지</div>} />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <div>회원가입 페이지</div>
              </GuestRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('메인 페이지')).toBeInTheDocument()
  })
})
